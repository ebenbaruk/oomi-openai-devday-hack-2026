// The device client: what the necklace firmware will do, implemented for the browser simulator.
// Live mode: audio flows directly between the device and OpenAI over WebRTC, but the server gates
// every turn (SPEC §7.1). Turn mode: record → server → TTS, same gate, for when live is unavailable.

import type { CompleteTurnResponse, Face, GateResponse, Language, SessionResponse, StoryResponse } from "@/lib/contracts";

export type DeviceMode = "live" | "turn";

export type TurnLog = {
  id: number;
  question: string;
  answer: string;
  verdict?: string;
  intent?: string;
  /** Language the child spoke in; Oomi answers in the same one. */
  language?: Language;
  /** Button release → transcript ready, → safety verdict, → first sound from Oomi. */
  heardMs?: number;
  checkedMs?: number;
  latencyMs?: number;
  status: "listening" | "thinking" | "speaking" | "done" | "ignored";
};

export type DeviceListener = {
  face: (face: Face) => void;
  mic: (open: boolean) => void;
  turn: (turn: TurnLog) => void;
  status: (status: string) => void;
};

type SpeakPlan = { turnId: string; endFace: Face; question: string; language: Language };

const RELEASE_TAIL_MS = 150;
const MIN_PRESS_MS = 450;
const TRANSCRIPT_TIMEOUT_MS = 7000;
const END_FACE_MS = 2600;
const OPENAI_CALLS_URL = "https://api.openai.com/v1/realtime/calls";

async function postJson<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`${url} failed with ${response.status}`);
  return (await response.json()) as T;
}

export class OomiDevice {
  readonly mode: DeviceMode;
  private listener: DeviceListener;
  private sessionId?: string;
  /** Family language, used until the child has spoken. */
  private language: Language = "en";
  private mic?: MediaStream;
  private audioContext?: AudioContext;
  private analysers: AnalyserNode[] = [];
  private levelBuffer = new Uint8Array(256);

  // Live transport
  private pc?: RTCPeerConnection;
  private channel?: RTCDataChannel;
  private remoteAudio?: HTMLAudioElement;
  private pendingTranscripts = new Map<string, (text: string) => void>();
  private committedItem?: (itemId: string) => void;
  private answerText = "";
  private speaking?: SpeakPlan & { started: boolean; releasedAt: number; log: TurnLog };

  // Turn transport and TTS playback (stories, fallback)
  private recorder?: MediaRecorder;
  private chunks: Blob[] = [];
  private player?: HTMLAudioElement;

  private pressedAt = 0;
  private pressed = false;
  private turnCounter = 0;
  private endFaceTimer?: ReturnType<typeof setTimeout>;
  private asleep = false;

  constructor(mode: DeviceMode, listener: DeviceListener) {
    this.mode = mode;
    this.listener = listener;
  }

  get awake(): boolean {
    return Boolean(this.sessionId);
  }

  /** Output loudness, 0..1, so the eyes can bounce with Oomi's voice. */
  level(): number {
    let peak = 0;
    for (const analyser of this.analysers) {
      analyser.getByteTimeDomainData(this.levelBuffer);
      for (const sample of this.levelBuffer) peak = Math.max(peak, Math.abs(sample - 128) / 128);
    }
    return Math.min(1, peak * 2.2);
  }

  async wake(): Promise<void> {
    this.listener.status("Waking up…");
    this.listener.face("thinking");
    const session = await postJson<SessionResponse>("/api/session");
    if (session.status === "sleep") {
      this.asleep = true;
      this.listener.face("sleep");
      this.listener.status(session.say);
      return;
    }
    this.sessionId = session.sessionId;
    this.language = session.language;
    this.audioContext = new AudioContext();
    try {
      this.mic = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      // Never continuous listening: the mic is only live while the button is held.
      for (const track of this.mic.getAudioTracks()) track.enabled = false;
    } catch {
      this.listener.status("Microphone unavailable: type your questions below.");
    }
    if (this.mode === "live") await this.connectLive(session.clientSecret);
    this.listener.face("happy");
    this.listener.status(`${session.childName}'s Oomi is awake`);
    this.endFaceTimer = setTimeout(() => this.listener.face("idle"), END_FACE_MS);
  }

  close(): void {
    this.stopPlayback();
    this.pc?.close();
    this.mic?.getTracks().forEach((track) => track.stop());
    void this.audioContext?.close();
    this.sessionId = undefined;
  }

  // ---------- Push-to-talk ----------

  press(): void {
    if (!this.sessionId || this.asleep || this.pressed) return;
    this.pressed = true;
    this.pressedAt = performance.now();
    clearTimeout(this.endFaceTimer);
    this.interrupt();
    this.listener.face("listening");
    this.listener.mic(true);
    if (this.mode === "live") {
      this.send({ type: "input_audio_buffer.clear" });
      this.mic?.getAudioTracks().forEach((track) => (track.enabled = true));
    } else if (this.mic) {
      this.chunks = [];
      this.mic.getAudioTracks().forEach((track) => (track.enabled = true));
      try {
        this.recorder = new MediaRecorder(this.mic);
        this.recorder.ondataavailable = (event) => this.chunks.push(event.data);
        this.recorder.start();
      } catch (error) {
        console.error("[oomi] recorder failed", error);
        this.recorder = undefined;
        this.listener.status("The microphone is busy, try again.");
      }
    }
  }

  async release(): Promise<void> {
    if (!this.pressed) return;
    this.pressed = false;
    const heldMs = performance.now() - this.pressedAt;
    await new Promise((resolve) => setTimeout(resolve, RELEASE_TAIL_MS));
    this.mic?.getAudioTracks().forEach((track) => (track.enabled = false));
    this.listener.mic(false);

    if (heldMs < MIN_PRESS_MS || !this.mic || (this.mode === "turn" && !this.recorder)) {
      if (this.recorder?.state === "recording") this.recorder.stop();
      if (this.mode === "live") this.send({ type: "input_audio_buffer.clear" });
      this.listener.face("idle");
      return;
    }
    const releasedAt = performance.now();
    this.listener.face("thinking");
    const log = this.newTurn();
    try {
      if (this.mode === "live") await this.releaseLive(heldMs / 1000, releasedAt, log);
      else await this.releaseTurn(heldMs / 1000, releasedAt, log);
    } catch (error) {
      console.error("[oomi] turn failed", error);
      this.listener.status("Oops, something went wrong. Try again!");
      this.listener.face("idle");
    }
  }

  /** Typed question: same pipeline, without audio input. Used by the demo console. */
  async ask(text: string): Promise<void> {
    if (!this.sessionId || this.asleep) return;
    clearTimeout(this.endFaceTimer);
    this.interrupt();
    this.listener.face("thinking");
    const releasedAt = performance.now();
    const log = this.newTurn();
    log.question = text;
    this.listener.turn({ ...log, status: "thinking" });
    try {
      if (this.mode === "live") {
        const gate = await this.gate(text);
        log.checkedMs = Math.round(performance.now() - releasedAt);
        await this.applyGate(gate, text, releasedAt, log, () => this.sendUserText(text));
      } else {
        const result = await postJson<{ transcript: string; gate: GateResponse; reply?: string }>("/api/turn", {
          sessionId: this.sessionId,
          text,
        });
        await this.applyTurnResult(result, releasedAt, log);
      }
    } catch (error) {
      console.error("[oomi] typed turn failed", error);
      this.listener.face("idle");
    }
  }

  private newTurn(): TurnLog {
    this.turnCounter += 1;
    const log: TurnLog = { id: this.turnCounter, question: "", answer: "", status: "thinking" };
    this.listener.turn(log);
    return log;
  }

  private interrupt(): void {
    if (this.speaking) {
      this.send({ type: "response.cancel" });
      this.send({ type: "output_audio_buffer.clear" });
      this.speaking = undefined;
    }
    this.stopPlayback();
  }

  private gate(transcript: string, audioSeconds?: number): Promise<GateResponse> {
    return postJson<GateResponse>("/api/gate", { sessionId: this.sessionId, transcript, audioSeconds });
  }

  // ---------- Live (WebRTC) ----------

  private async connectLive(clientSecret: string): Promise<void> {
    const pc = new RTCPeerConnection();
    this.pc = pc;
    this.remoteAudio = new Audio();
    this.remoteAudio.autoplay = true;
    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (!this.remoteAudio || !this.audioContext) return;
      this.remoteAudio.srcObject = stream;
      const analyser = this.audioContext.createAnalyser();
      analyser.fftSize = 512;
      this.audioContext.createMediaStreamSource(stream).connect(analyser);
      this.analysers.push(analyser);
    };
    const micTrack = this.mic?.getAudioTracks()[0];
    if (micTrack) pc.addTrack(micTrack, this.mic as MediaStream);
    else pc.addTransceiver("audio", { direction: "recvonly" });

    const channel = pc.createDataChannel("oai-events");
    this.channel = channel;
    channel.onmessage = (message: MessageEvent<string>) => this.onServerEvent(JSON.parse(message.data) as ServerEvent);
    const opened = new Promise<void>((resolve) => channel.addEventListener("open", () => resolve(), { once: true }));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    const answer = await fetch(OPENAI_CALLS_URL, {
      method: "POST",
      body: offer.sdp,
      headers: { Authorization: `Bearer ${clientSecret}`, "Content-Type": "application/sdp" },
    });
    if (!answer.ok) throw new Error(`Realtime connection failed (${answer.status})`);
    await pc.setRemoteDescription({ type: "answer", sdp: await answer.text() });
    await opened;
  }

  private send(event: Record<string, unknown>): void {
    if (this.channel?.readyState === "open") this.channel.send(JSON.stringify(event));
  }

  private onServerEvent(event: ServerEvent): void {
    switch (event.type) {
      case "input_audio_buffer.committed":
        this.committedItem?.(event.item_id);
        break;
      case "conversation.item.input_audio_transcription.completed":
        this.pendingTranscripts.get(event.item_id)?.(event.transcript);
        break;
      case "conversation.item.input_audio_transcription.failed":
        this.pendingTranscripts.get(event.item_id)?.("");
        break;
      case "output_audio_buffer.started":
        if (this.speaking && !this.speaking.started) {
          this.speaking.started = true;
          this.speaking.log.latencyMs = Math.round(performance.now() - this.speaking.releasedAt);
          this.speaking.log.status = "speaking";
          this.listener.turn({ ...this.speaking.log });
          this.listener.face("speaking");
        }
        break;
      case "response.output_audio_transcript.delta":
        if (this.speaking) {
          this.answerText += event.delta;
          this.speaking.log.answer = this.answerText;
          this.listener.turn({ ...this.speaking.log });
        }
        break;
      case "response.output_audio_transcript.done":
        // Text finishes long before the audio does: checking it here still lets us cut the voice in time.
        if (this.speaking) void this.completeTurn(this.speaking, event.transcript);
        break;
      case "output_audio_buffer.stopped":
        if (this.speaking) this.finishSpeaking(this.speaking.endFace, this.speaking.log);
        break;
      case "error":
        console.warn("[oomi] realtime error", event.error);
        break;
    }
  }

  private waitForCommit(): Promise<string> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("commit timeout")), 3000);
      this.committedItem = (itemId) => {
        clearTimeout(timer);
        this.committedItem = undefined;
        resolve(itemId);
      };
    });
  }

  private waitForTranscript(itemId: string): Promise<string> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(""), TRANSCRIPT_TIMEOUT_MS);
      this.pendingTranscripts.set(itemId, (text) => {
        clearTimeout(timer);
        this.pendingTranscripts.delete(itemId);
        resolve(text);
      });
    });
  }

  private async releaseLive(audioSeconds: number, releasedAt: number, log: TurnLog): Promise<void> {
    const committed = this.waitForCommit();
    this.send({ type: "input_audio_buffer.commit" });
    const itemId = await committed;
    const transcript = await this.waitForTranscript(itemId);
    log.question = transcript;
    log.heardMs = Math.round(performance.now() - releasedAt);
    this.listener.turn({ ...log });
    const gate = await this.gate(transcript, audioSeconds);
    log.checkedMs = Math.round(performance.now() - releasedAt);
    await this.applyGate(gate, transcript, releasedAt, log, undefined, itemId);
  }

  private sendUserText(text: string): void {
    this.send({ type: "conversation.item.create", item: { type: "message", role: "user", content: [{ type: "input_text", text }] } });
  }

  private async applyGate(
    gate: GateResponse,
    question: string,
    releasedAt: number,
    log: TurnLog,
    addUserItem?: () => void,
    audioItemId?: string,
  ): Promise<void> {
    const dropAudioItem = () => audioItemId && this.send({ type: "conversation.item.delete", item_id: audioItemId });

    if (gate.action === "ignore") {
      dropAudioItem();
      log.status = "ignored";
      this.listener.turn({ ...log });
      this.listener.face("idle");
      return;
    }
    if (gate.action === "sleep") {
      dropAudioItem();
      this.asleep = true;
      this.speakExactly(gate.say, { turnId: "sleep", endFace: "sleep", question, language: this.language }, releasedAt, log);
      return;
    }
    log.verdict = "verdict" in gate ? gate.verdict : "answer";
    log.intent = "intent" in gate ? gate.intent : "story";
    log.language = gate.language;
    this.listener.turn({ ...log });

    if (gate.action === "story") {
      dropAudioItem();
      await this.tellStory(gate.say, gate.language, releasedAt, log);
      return;
    }
    const plan = { turnId: gate.turnId, endFace: gate.endFace, question, language: gate.language };
    if (gate.exactText) {
      // Declined or redirected questions never enter the model's conversation.
      dropAudioItem();
      this.listener.face(gate.face);
      this.speakExactly(gate.exactText, plan, releasedAt, log);
      return;
    }
    addUserItem?.();
    this.startSpeaking(plan, releasedAt, log);
    this.send({ type: "response.create", response: { instructions: gate.instructions, reasoning: { effort: "minimal" } } });
  }

  private startSpeaking(plan: SpeakPlan, releasedAt: number, log: TurnLog): void {
    this.answerText = "";
    this.speaking = { ...plan, started: false, releasedAt, log };
  }

  private speakExactly(text: string, plan: SpeakPlan, releasedAt: number, log: TurnLog): void {
    if (this.mode === "turn") {
      void this.playTts(text, "playful", plan.language, releasedAt, log).then(() => {
        void this.completeTurnTurnMode(plan, text);
        this.finishSpeaking(plan.endFace, log);
      });
      return;
    }
    this.startSpeaking(plan, releasedAt, log);
    this.send({
      type: "response.create",
      response: {
        conversation: "none",
        reasoning: { effort: "minimal" },
        instructions: `You are Oomi, a warm and playful explorer companion for kids. Say exactly the user's text, warmly, and nothing else.`,
        input: [{ type: "message", role: "user", content: [{ type: "input_text", text }] }],
      },
    });
  }

  private async completeTurn(plan: SpeakPlan, answer: string): Promise<void> {
    if (!this.sessionId) return;
    const result = await postJson<CompleteTurnResponse>("/api/turn/complete", {
      sessionId: this.sessionId,
      turnId: plan.turnId,
      answer,
      language: plan.language,
    }).catch(() => ({ safe: true }) as CompleteTurnResponse);
    if (!result.safe && result.replacement && this.speaking?.turnId === plan.turnId) {
      const log = this.speaking.log;
      this.interrupt();
      this.speakExactly(result.replacement, { ...plan, turnId: `replacement:${plan.turnId}` }, performance.now(), log);
    }
  }

  private finishSpeaking(endFace: Face, log: TurnLog): void {
    this.speaking = undefined;
    log.status = "done";
    this.listener.turn({ ...log });
    this.listener.face(endFace);
    if (endFace === "sleep") return;
    clearTimeout(this.endFaceTimer);
    this.endFaceTimer = setTimeout(() => this.listener.face("idle"), END_FACE_MS);
  }

  // ---------- Bedtime story (both modes: expressive TTS narration) ----------

  private async tellStory(intro: string, language: Language, releasedAt: number, log: TurnLog): Promise<void> {
    const storyPromise = postJson<StoryResponse>("/api/story", { language });
    this.listener.face("curious");
    await this.playTts(intro, "playful", language, releasedAt, log);
    this.listener.face("thinking");
    const story = await storyPromise;
    log.answer = `📖 ${story.title}\n\n${story.text}`;
    this.listener.turn({ ...log });
    await this.playAudio(`/api/stories/${story.id}/audio`, performance.now(), log, true);
    // A story always ends with sleep, never "one more" (SPEC §7.7).
    this.finishSpeaking("sleep", log);
  }

  private stopPlayback(): void {
    if (this.player) {
      this.player.pause();
      this.player.src = "";
      this.player = undefined;
    }
  }

  private async playTts(text: string, style: "playful" | "bedtime", language: Language, releasedAt: number, log: TurnLog): Promise<void> {
    const response = await fetch("/api/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, style, language }),
    });
    if (!response.ok) throw new Error(`speech failed with ${response.status}`);
    const url = URL.createObjectURL(await response.blob());
    await this.playAudio(url, releasedAt, log);
    URL.revokeObjectURL(url);
  }

  private async playAudio(url: string, releasedAt: number, log: TurnLog, keepLatency = false): Promise<void> {
    const player = new Audio(url);
    this.player = player;
    if (this.audioContext) {
      const analyser = this.audioContext.createAnalyser();
      analyser.fftSize = 512;
      const source = this.audioContext.createMediaElementSource(player);
      source.connect(analyser);
      analyser.connect(this.audioContext.destination);
      this.analysers.push(analyser);
      player.addEventListener("ended", () => (this.analysers = this.analysers.filter((item) => item !== analyser)), {
        once: true,
      });
    }
    await new Promise<void>((resolve) => {
      player.addEventListener(
        "playing",
        () => {
          if (!keepLatency && log.latencyMs === undefined) log.latencyMs = Math.round(performance.now() - releasedAt);
          log.status = "speaking";
          this.listener.turn({ ...log });
          this.listener.face("speaking");
        },
        { once: true },
      );
      player.addEventListener("ended", () => resolve(), { once: true });
      player.addEventListener("pause", () => resolve(), { once: true });
      player.addEventListener("error", () => resolve(), { once: true });
      void player.play().catch(() => resolve());
    });
  }

  // ---------- Turn-by-turn fallback ----------

  private async releaseTurn(audioSeconds: number, releasedAt: number, log: TurnLog): Promise<void> {
    const recorder = this.recorder;
    this.recorder = undefined;
    if (!recorder || !this.sessionId) return;
    const stopped = new Promise<void>((resolve) => recorder.addEventListener("stop", () => resolve(), { once: true }));
    recorder.stop();
    await stopped;
    const form = new FormData();
    form.set("sessionId", this.sessionId);
    form.set("audioSeconds", String(audioSeconds));
    form.set("audio", new File(this.chunks, "question.webm", { type: recorder.mimeType || "audio/webm" }));
    const response = await fetch("/api/turn", { method: "POST", body: form });
    if (!response.ok) throw new Error(`turn failed with ${response.status}`);
    await this.applyTurnResult((await response.json()) as { transcript: string; gate: GateResponse; reply?: string }, releasedAt, log);
  }

  private async applyTurnResult(
    result: { transcript: string; gate: GateResponse; reply?: string },
    releasedAt: number,
    log: TurnLog,
  ): Promise<void> {
    log.question = result.transcript;
    this.listener.turn({ ...log });
    const { gate, reply } = result;
    if (gate.action !== "speak" || !reply) {
      await this.applyGate(gate, result.transcript, releasedAt, log);
      return;
    }
    log.verdict = gate.verdict;
    log.intent = gate.intent;
    log.language = gate.language;
    log.answer = reply;
    this.listener.face(gate.face);
    await this.playTts(reply, "playful", gate.language, releasedAt, log);
    await this.completeTurnTurnMode(
      { turnId: gate.turnId, endFace: gate.endFace, question: result.transcript, language: gate.language },
      reply,
    );
    this.finishSpeaking(gate.endFace, log);
  }

  private async completeTurnTurnMode(plan: SpeakPlan, answer: string): Promise<void> {
    await postJson("/api/turn/complete", { sessionId: this.sessionId, turnId: plan.turnId, answer, language: plan.language }).catch(
      () => undefined,
    );
  }
}

type ServerEvent =
  | { type: "input_audio_buffer.committed"; item_id: string }
  | { type: "conversation.item.input_audio_transcription.completed"; item_id: string; transcript: string }
  | { type: "conversation.item.input_audio_transcription.failed"; item_id: string }
  | { type: "output_audio_buffer.started"; response_id: string }
  | { type: "output_audio_buffer.stopped"; response_id: string }
  | { type: "response.output_audio_transcript.delta"; delta: string }
  | { type: "response.output_audio_transcript.done"; transcript: string }
  | { type: "error"; error: unknown };
