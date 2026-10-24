import "server-only";
import { createHash, randomInt } from "node:crypto";
import { z } from "zod";
import type { Language, WatchTurnResponse } from "@/lib/contracts";
import { CHILD_ID, query, queryOne } from "./db";
import { loadChild } from "./child";
import { transcribe, synthesize, writeReply } from "./speech";
import { checkAnswer, decideTurn } from "./turn";

const MAX_AUDIO_BYTES = 4 * 1024 * 1024;
const supportedAudio = new Set(["audio/mp4", "audio/m4a", "audio/x-m4a", "audio/aac", "audio/wav", "audio/x-wav", "audio/mpeg", "audio/webm"]);

export class WatchError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

const codeHash = (code: string) => createHash("sha256").update(code).digest("hex");

/** Creates a 15-minute code. The Watch stores it locally after its first successful turn. */
export async function createWatchPairing(): Promise<{ pairingCode: string; expiresAt: string }> {
  const pairingCode = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const row = await queryOne<{ pairing_expires_at: Date }>(
    `INSERT INTO oomi_app.watch_device (child_id, name, pairing_code_hash, pairing_expires_at)
     VALUES ($1, 'Apple Watch', $2, now() + interval '15 minutes')
     ON CONFLICT (child_id, name) DO UPDATE SET pairing_code_hash = EXCLUDED.pairing_code_hash,
       pairing_expires_at = EXCLUDED.pairing_expires_at, paired_at = NULL, last_seen_at = NULL
     RETURNING pairing_expires_at`,
    [CHILD_ID, codeHash(pairingCode)],
  );
  if (!row) throw new Error("Unable to create Watch code");
  return { pairingCode, expiresAt: row.pairing_expires_at.toISOString() };
}

async function verifyPairing(code: string): Promise<void> {
  const device = await queryOne<{ id: string }>(
    `SELECT id FROM oomi_app.watch_device
     WHERE child_id = $1 AND pairing_code_hash = $2 AND pairing_expires_at > now() LIMIT 1`,
    [CHILD_ID, codeHash(code)],
  );
  if (!device) throw new WatchError(401, "Ce code Watch a expiré. Créez-en un nouveau dans l'espace parent.");
  await query(`UPDATE oomi_app.watch_device SET paired_at = coalesce(paired_at, now()), last_seen_at = now() WHERE id = $1`, [device.id]);
}

function toState(verdict: WatchTurnResponse["verdict"]): WatchTurnResponse["state"] {
  return verdict === "answer" ? "happy" : verdict;
}

async function withAudio(turnId: string, verdict: WatchTurnResponse["verdict"], text: string, language: Language, voice: string): Promise<WatchTurnResponse> {
  const audio = await synthesize(text, "playful", language, voice);
  const bytes = Buffer.from(await audio.arrayBuffer());
  return {
    turnId,
    verdict,
    state: toState(verdict),
    text,
    audioBase64: bytes.toString("base64"),
    audioMimeType: "audio/mpeg",
  };
}

/** Watch equivalent of the fallback HTTP turn: transcript → safety gate → OpenAI text + OpenAI audio. */
export async function handleWatchTurn(request: Request): Promise<WatchTurnResponse> {
  if (!request.headers.get("content-type")?.includes("multipart/form-data")) throw new WatchError(415, "Audio multipart required.");
  const form = await request.formData();
  const pairingCode = z.string().regex(/^\d{6}$/).safeParse(form.get("pairingCode"));
  const audio = form.get("audio");
  if (!pairingCode.success || !(audio instanceof File)) throw new WatchError(400, "Reprenez la connexion de votre Watch.");
  if (audio.size < 400 || audio.size > MAX_AUDIO_BYTES || !supportedAudio.has(audio.type.toLowerCase())) {
    throw new WatchError(400, "L'enregistrement audio n'est pas valide.");
  }
  await verifyPairing(pairingCode.data);

  const child = await loadChild();
  const session = await queryOne<{ id: string }>(`INSERT INTO oomi_app.voice_session (child_id) VALUES ($1) RETURNING id`, [CHILD_ID]);
  if (!session) throw new Error("Unable to start Watch session");
  try {
    const transcript = await transcribe(audio);
    const gate = await decideTurn(session.id, transcript);
    if (gate.action === "ignore") throw new WatchError(400, "Je n'ai pas bien entendu. Réessaie en parlant un peu plus près.");
    const fallback = child.language === "fr" ? "Oups, mon cerveau d'explorateur s'est emmêlé ! Tu peux me reposer la question ?" : "Oops, can you ask me again?";
    if (gate.action === "sleep") return withAudio(`sleep:${crypto.randomUUID()}`, "decline", gate.say, child.language, child.mascot.voice);
    if (gate.action === "story") return withAudio(gate.turnId, "answer", gate.say, gate.language, child.mascot.voice);

    const draft = gate.exactText ?? await writeReply(transcript, gate.instructions);
    const checked = await checkAnswer(draft, gate.language);
    return withAudio(gate.turnId, checked.safe ? gate.verdict : "decline", checked.safe ? draft : (checked.replacement ?? fallback), gate.language, child.mascot.voice);
  } finally {
    await query(`DELETE FROM oomi_app.voice_session WHERE id = $1`, [session.id]).catch(() => undefined);
  }
}
