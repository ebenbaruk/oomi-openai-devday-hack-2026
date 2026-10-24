import { randomUUID } from "node:crypto";
import WebSocket from "ws";
import { clientEventSchema, type ServerEvent } from "../../lib/contracts";
import type { Config } from "../config";
import { allowAttempt, closeSession, DEMO_OWNER, recordAudit, reserveSession } from "../db";
import { createSafetyProviders, realtimeConfig } from "../openai";
import { TurnController } from "./controller";

const object = (v: unknown): Record<string, unknown> => v && typeof v === "object" ? v as Record<string, unknown> : {};
const string = (v: unknown) => typeof v === "string" ? v : "";

export function attachDevice(socket: WebSocket, config: Config) {
  const sessionId = randomUUID();
  const expiresAt = Date.now() + config.OOMI_SESSION_SECONDS * 1000;
  let sideband: WebSocket | undefined;
  let callId = "";
  let controller: TurnController | undefined;
  let started = false;
  let reserved = false;
  let closed = false;
  let lastPing = Date.now();
  const abort = new AbortController();
  const pendingCommits: string[] = [];
  const inputs = new Map<string, string>();
  const responses = new Map<string, string>();
  const turnItems = new Map<string, Set<string>>();
  const sendRealtime = (data: Record<string, unknown>) => { if (sideband?.readyState === WebSocket.OPEN) sideband.send(JSON.stringify(data)); };
  const emit = (event: ServerEvent) => {
    if (event.type === "fixed") {
      for (const itemId of turnItems.get(event.turnId) ?? []) sendRealtime({ type: "conversation.item.delete", item_id: itemId });
    }
    if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(event));
  };
  const addItem = (turnId: string, itemId: string) => {
    if (!turnId || !itemId) return;
    const items = turnItems.get(turnId) ?? new Set<string>();
    items.add(itemId); turnItems.set(turnId, items);
  };
  async function cleanup(reason: string) {
    if (closed) return;
    closed = true;
    clearTimeout(expiration); clearInterval(heartbeat);
    controller?.close(); abort.abort();
    emit({ type: "closed", reason });
    sideband?.close(); socket.close(1000, "Session ended");
    if (callId) {
      void fetch(`https://api.openai.com/v1/realtime/calls/${callId}/hangup`, {
        method: "POST", headers: { Authorization: `Bearer ${config.OPENAI_API_KEY}` }, signal: AbortSignal.timeout(3000),
      }).catch(() => {});
    }
    if (reserved) await closeSession(sessionId).catch(() => {});
  }
  const expiration = setTimeout(() => void cleanup("La session est terminée. À bientôt pour une découverte !"), config.OOMI_SESSION_SECONDS * 1000);
  const heartbeat = setInterval(() => { if (Date.now() - lastPing > 25_000) void cleanup("La connexion a été interrompue."); }, 5000);

  async function connect(sdp: string) {
    if (started) return;
    started = true;
    // Keep the OpenAI data channel out of the browser's offer. Only our sideband controls turns.
    if (/^m=application /m.test(sdp)) throw new Error("Untrusted data channel");
    if (!await allowAttempt(`sessions:${DEMO_OWNER}`, 20, 3600)) throw new Error("Session rate limit");
    await reserveSession(sessionId, config); reserved = true;
    if (closed) { await closeSession(sessionId); return; }
    const body = new FormData();
    body.set("sdp", sdp); body.set("session", JSON.stringify(realtimeConfig(config)));
    const call = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST", headers: { Authorization: `Bearer ${config.OPENAI_API_KEY}` }, body,
      signal: AbortSignal.any([abort.signal, AbortSignal.timeout(12_000)]),
    });
    if (!call.ok) throw new Error(`Call HTTP ${call.status}: ${(await call.text()).slice(0, 300)}`);
    callId = call.headers.get("location")?.split("/").pop() ?? "";
    if (!/^rtc_[a-zA-Z0-9_-]+$/.test(callId)) throw new Error("Missing call ID");
    const answer = await call.text();
    if (closed) return;
    sideband = new WebSocket(`wss://api.openai.com/v1/realtime?call_id=${encodeURIComponent(callId)}`, {
      headers: { Authorization: `Bearer ${config.OPENAI_API_KEY}` }, handshakeTimeout: 8000, maxPayload: 2 * 1024 * 1024,
    });
    controller = new TurnController({
      language: config.OOMI_LANGUAGE, timeoutMs: config.OOMI_SAFETY_TIMEOUT_MS, providers: createSafetyProviders(config), emit,
      command(data, turnId) { if (data.type === "input_audio_buffer.commit") pendingCommits.push(turnId); sendRealtime(data); },
      audit: (turnId, verdict, status, elapsed) => recordAudit(sessionId, turnId, verdict, status, elapsed),
    });
    sideband.on("message", data => {
      try {
        const event = object(JSON.parse(data.toString()));
        const response = object(event.response);
        const type = string(event.type);
        if (type === "input_audio_buffer.committed") {
          const id = pendingCommits.shift();
          if (id) { inputs.set(string(event.item_id), id); addItem(id, string(event.item_id)); }
        }
        if (type === "conversation.item.input_audio_transcription.completed") {
          const id = inputs.get(string(event.item_id));
          if (id) void controller?.transcript(id, string(event.transcript));
        }
        if (type === "response.created") {
          const id = string(object(response.metadata).turn_id);
          if (id) responses.set(string(response.id), id);
        }
        const turnId = responses.get(string(event.response_id)) ?? responses.get(string(response.id));
        if (turnId && type === "response.output_item.added") addItem(turnId, string(object(event.item).id));
        if (turnId && type === "response.output_audio_transcript.delta") controller?.output(turnId, string(event.delta));
        if (turnId && type === "response.done") void controller?.completed(turnId, string(response.status));
        if (turnId && type === "output_audio_buffer.stopped") controller?.drained(turnId);
        if (type === "conversation.item.input_audio_transcription.failed") controller?.fail();
        if (type === "error") {
          const code = string(object(event.error).code);
          if (!["response_cancel_not_active", "input_audio_buffer_commit_empty", "item_not_found"].includes(code)) controller?.fail();
          if (code === "input_audio_buffer_commit_empty") { pendingCommits.shift(); controller?.fail(); }
        }
      } catch { controller?.fail(); }
    });
    await new Promise<void>((resolve, reject) => {
      sideband!.once("open", resolve); sideband!.once("error", reject);
    });
    sideband.on("error", () => void cleanup("Le service vocal n’est plus disponible."));
    sideband.on("close", () => void cleanup("La connexion vocale est fermée. Vous pouvez ouvrir une nouvelle session."));
    if (!closed) emit({ type: "connected", sdp: answer, sessionId, language: config.OOMI_LANGUAGE, expiresAt });
  }

  socket.on("message", data => {
    try {
      if (Buffer.byteLength(data.toString()) > 60_000) { void cleanup("Message trop volumineux."); return; }
      const parsed = clientEventSchema.safeParse(JSON.parse(data.toString()));
      if (!parsed.success) { void cleanup("Commande non reconnue."); return; }
      lastPing = Date.now();
      const event = parsed.data;
      switch (event.type) {
        case "connect": void connect(event.sdp).catch(error => { console.error("voice connect failed:", error instanceof Error ? error.message : String(error)); return cleanup("Impossible d’ouvrir la session. Vérifiez les accès API, la base et les modèles configurés."); }); break;
        case "press": controller?.press(); break;
        case "release": controller?.release(); break;
        case "audio.prepared": controller?.prepared(event.turnId); break;
        case "playback.ended": controller?.playbackEnded(event.turnId); break;
        case "close": void cleanup("Session fermée."); break;
        case "ping": emit({ type: "pong" }); break;
      }
    } catch { void cleanup("Commande invalide."); }
  });
  socket.on("close", () => void cleanup("Connexion fermée."));
  socket.on("error", () => void cleanup("Erreur de connexion."));
}
