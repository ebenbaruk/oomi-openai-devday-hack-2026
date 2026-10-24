import type { ClientEvent, FaceState, Language, ServerEvent } from "./contracts";
import { AudioGate } from "./audio-gate";

export interface DeviceState { connected: boolean; busy: boolean; mic: boolean; face: FaceState; message: string; verdict: string; elapsedMs: number | null; }
export const initialDeviceState: DeviceState = { connected: false, busy: false, mic: false, face: "idle", message: "Une grande découverte commence par une petite question.", verdict: "", elapsedMs: null };

export class OomiDevice {
  private socket?: WebSocket;
  private peer?: RTCPeerConnection;
  private mic?: MediaStream;
  private remote?: MediaStream;
  private recorder?: MediaRecorder;
  private audio?: HTMLAudioElement;
  private url?: string;
  private held = false;
  private activeTurn = "";
  private closed = true;
  private epoch = 0;
  private language: Language = "en";
  private timer?: ReturnType<typeof setInterval>;
  private playbackTimer?: ReturnType<typeof setTimeout>;
  private connectionTimer?: ReturnType<typeof setTimeout>;
  private gate = new AudioGate();
  private state = { ...initialDeviceState };
  constructor(private readonly changed: (state: DeviceState) => void) {}
  private update(patch: Partial<DeviceState>) { this.state = { ...this.state, ...patch }; this.changed(this.state); }
  private send(event: ClientEvent) { if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(event)); }
  private mute() { this.mic?.getAudioTracks().forEach(track => { track.enabled = false; }); this.update({ mic: false }); }
  private discard() {
    this.epoch++; this.gate.discard();
    clearTimeout(this.playbackTimer);
    if (this.recorder) { this.recorder.onstop = null; this.recorder.ondataavailable = null; if (this.recorder.state !== "inactive") this.recorder.stop(); }
    this.recorder = undefined;
    if (this.audio) { this.audio.onended = null; this.audio.pause(); this.audio.removeAttribute("src"); this.audio.load(); }
    this.audio = undefined;
    if (this.url) URL.revokeObjectURL(this.url);
    this.url = undefined;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }
  async connect(code: string) {
    if (!this.closed) return;
    this.closed = false;
    this.update({ busy: true, message: "Ouverture de la session…", verdict: "", elapsedMs: null });
    this.connectionTimer = setTimeout(() => this.close("La connexion a pris trop de temps. Réessayez."), 30_000);
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder || !window.RTCPeerConnection) throw new Error("Ce navigateur ne permet pas la session vocale. Essayez Chrome ou Safari récent, sur HTTPS.");
      const access = await fetch("/api/access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
      if (!access.ok) throw new Error(access.status === 401 ? "Le code d’accès n’est pas valide." : "La session n’est pas disponible. Vérifiez la configuration serveur.");
      if (this.closed) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
      stream.getAudioTracks().forEach(track => { track.enabled = false; });
      if (this.closed) { stream.getTracks().forEach(track => track.stop()); return; }
      this.mic = stream;
      const peer = new RTCPeerConnection(); this.peer = peer;
      stream.getTracks().forEach(track => peer.addTrack(track, stream));
      // No data channel and no live audio element: only the server controls generation.
      peer.ontrack = event => { this.remote = new MediaStream([event.track]); };
      peer.onconnectionstatechange = () => {
        if (["failed", "disconnected", "closed"].includes(peer.connectionState) && !this.closed) this.close("La connexion vocale a été interrompue.");
      };
      const offer = await peer.createOffer(); await peer.setLocalDescription(offer);
      if (this.closed) return;
      const socket = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/api/voice`); this.socket = socket;
      socket.onopen = () => { this.send({ type: "connect", sdp: offer.sdp ?? "" }); this.timer = setInterval(() => this.send({ type: "ping" }), 8000); };
      socket.onmessage = event => { void this.receive(JSON.parse(String(event.data)) as ServerEvent).catch(() => this.close("La réponse ne peut pas être jouée en sécurité.")); };
      socket.onclose = () => { if (!this.closed) this.close("Session fermée. Vous pouvez en ouvrir une nouvelle."); };
      socket.onerror = () => this.close("Impossible de joindre le serveur vocal.");
    } catch (error) { this.close(error instanceof Error ? error.message : "Impossible d’ouvrir la session."); }
  }
  press() {
    if (!this.state.connected || this.closed || this.held) return;
    this.held = true; this.activeTurn = ""; this.discard(); this.update({ message: "Maintenez le bouton pour poser votre question.", verdict: "", elapsedMs: null }); this.send({ type: "press" });
  }
  release() { this.held = false; this.mute(); if (!this.closed) this.send({ type: "release" }); }
  private async receive(event: ServerEvent) {
    if (this.closed) return;
    if ("turnId" in event && event.turnId && event.type !== "capture.start" && event.turnId !== this.activeTurn) return;
    switch (event.type) {
      case "connected":
        await this.peer?.setRemoteDescription({ type: "answer", sdp: event.sdp });
        clearTimeout(this.connectionTimer); this.language = event.language;
        this.update({ connected: true, busy: false, face: "idle", message: "Prêt. Maintenez le bouton, posez votre question, puis relâchez." }); break;
      case "capture.start":
        this.activeTurn = event.turnId;
        if (this.held) { this.mic?.getAudioTracks().forEach(track => { track.enabled = true; }); this.update({ mic: true }); }
        else this.send({ type: "release" }); break;
      case "capture.stop": this.held = false; this.mute(); break;
      case "state": this.update({ face: event.state }); break;
      case "verdict": this.update({ verdict: event.verdict, elapsedMs: event.elapsedMs }); break;
      case "audio.prepare": this.prepare(event.turnId); break;
      case "audio.approved": this.update({ elapsedMs: event.elapsedMs }); this.unlock("approved", event.turnId); break;
      case "audio.drained": this.unlock("drained", event.turnId); break;
      case "audio.discard": this.discard(); break;
      case "fixed": this.fixed(event); break;
      case "closed": this.close(event.reason); break;
      case "notice": this.update({ message: event.message }); break;
    }
  }
  private prepare(turnId: string) {
    this.discard();
    if (!this.remote?.getAudioTracks().some(track => track.readyState === "live")) { this.close("Le canal audio n’est pas prêt. Relancez la session."); return; }
    const epoch = this.epoch;
    this.gate.prepare(turnId);
    const mimeType = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find(type => MediaRecorder.isTypeSupported(type));
    if (!mimeType) { this.close("Le navigateur ne peut pas retenir l’audio avant validation."); return; }
    const recorder = new MediaRecorder(this.remote, { mimeType }); this.recorder = recorder;
    const chunks: Blob[] = []; let bytes = 0;
    recorder.ondataavailable = event => {
      if (epoch !== this.epoch) return;
      bytes += event.data.size;
      if (bytes > 2_000_000) { this.close("La réponse audio dépasse la limite de la session."); return; }
      if (event.data.size) chunks.push(event.data);
    };
    recorder.onerror = () => this.close("La préparation de l’audio a échoué.");
    recorder.onstop = () => {
      if (epoch !== this.epoch || this.closed) return;
      this.url = URL.createObjectURL(new Blob(chunks, { type: mimeType }));
      const audio = new Audio(this.url); this.audio = audio;
      audio.onplaying = () => this.update({ face: "speaking", message: "Une petite idée pour explorer le monde…" });
      audio.onended = () => { if (epoch === this.epoch) { this.discard(); this.send({ type: "playback.ended", turnId }); } };
      audio.onerror = () => this.close("L’audio validé n’a pas pu être lu.");
      void audio.play().catch(() => this.close("Le navigateur a bloqué le son. Autorisez la lecture audio puis reconnectez-vous."));
    };
    recorder.start(200); this.send({ type: "audio.prepared", turnId });
    this.update({ message: "Oomi prépare sa réponse et la vérifie avant de parler." });
  }
  private unlock(type: "approved" | "drained", turnId: string) {
    if (!this.gate.accept(type, turnId)) return;
    // Small transport drain allowance; even an incomplete recording cannot bypass moderation.
    this.playbackTimer = setTimeout(() => { if (this.recorder?.state === "recording") this.recorder.stop(); }, 300);
  }
  private fixed(event: Extract<ServerEvent, { type: "fixed" }>) {
    this.discard(); const epoch = this.epoch;
    this.update({ face: "grown_up", message: event.text });
    if (!("speechSynthesis" in window)) { this.send({ type: "playback.ended", turnId: event.turnId }); return; }
    const utterance = new SpeechSynthesisUtterance(event.text);
    utterance.lang = this.language === "fr" ? "fr-FR" : "en-US"; utterance.rate = 0.9;
    utterance.onend = utterance.onerror = () => { if (epoch === this.epoch) this.send({ type: "playback.ended", turnId: event.turnId }); };
    window.speechSynthesis.speak(utterance);
  }
  close(message = "Session terminée. À bientôt pour une découverte !") {
    if (this.closed) return;
    this.closed = true; this.held = false; this.mute(); this.discard();
    clearInterval(this.timer); clearTimeout(this.connectionTimer);
    this.send({ type: "close" }); this.socket?.close(); this.peer?.close();
    this.mic?.getTracks().forEach(track => track.stop()); this.remote?.getTracks().forEach(track => track.stop());
    this.socket = undefined; this.peer = undefined; this.mic = undefined; this.remote = undefined;
    this.update({ connected: false, busy: false, mic: false, face: "sleep", message });
  }
}
