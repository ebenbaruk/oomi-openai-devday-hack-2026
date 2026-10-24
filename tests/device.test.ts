import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { OomiDevice } from "../src/lib/device";
import type { ServerEvent } from "../src/lib/contracts";

class FakeSocket {
  static OPEN = 1; static instance: FakeSocket; readyState = 1;
  onopen?: () => void; onmessage?: (event: { data: string }) => void; onclose?: () => void; onerror?: () => void;
  sent: unknown[] = []; constructor() { FakeSocket.instance = this; }
  send(data: string) { this.sent.push(JSON.parse(data)); } close() { this.readyState = 3; }
  event(event: ServerEvent) { this.onmessage?.({ data: JSON.stringify(event) }); }
}
class FakePeer {
  static instance: FakePeer; ontrack?: (event: { track: object }) => void; onconnectionstatechange?: () => void;
  constructor() { FakePeer.instance = this; } addTrack() {} async createOffer() { return { sdp: "test-sdp" }; } async setLocalDescription() {} async setRemoteDescription() {}
  close() {}
}
class FakeRecorder {
  static instance: FakeRecorder; static isTypeSupported() { return true; }
  state = "inactive"; onstop?: (() => void) | null; ondataavailable?: ((event: { data: Blob }) => void) | null; onerror?: () => void;
  constructor() { FakeRecorder.instance = this; } start() { this.state = "recording"; } stop() { this.state = "inactive"; this.ondataavailable?.({ data: new Blob(["sound"]) }); this.onstop?.(); }
}
const play = vi.fn(async () => {}); const track = { enabled: false, readyState: "live", stop: vi.fn() };
beforeEach(() => {
  vi.useFakeTimers(); play.mockClear(); track.enabled = false; track.stop.mockClear();
  vi.stubGlobal("WebSocket", FakeSocket); vi.stubGlobal("RTCPeerConnection", FakePeer); vi.stubGlobal("MediaRecorder", FakeRecorder);
  vi.stubGlobal("MediaStream", class { getAudioTracks() { return [track]; } getTracks() { return [track]; } });
  vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: async () => ({ getAudioTracks: () => [track], getTracks: () => [track] }) } });
  vi.stubGlobal("window", { MediaRecorder: FakeRecorder, RTCPeerConnection: FakePeer, speechSynthesis: { cancel: vi.fn(), speak: vi.fn() } });
  vi.stubGlobal("location", { protocol: "http:", host: "localhost:3000" });
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ ok: true })));
  vi.stubGlobal("Audio", class { play = play; pause() {} removeAttribute() {} load() {} });
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
async function connected() {
  const device = new OomiDevice(() => {}); await device.connect("test-access-code-long");
  const ws = FakeSocket.instance; ws.onopen?.(); FakePeer.instance.ontrack?.({ track });
  ws.event({ type: "connected", sdp: "answer", sessionId: "session", expiresAt: Date.now() + 240000, language: "en" });
  await Promise.resolve(); return { device, ws };
}
it("transmits only after capture acknowledgement and mutes immediately on release", async () => {
  const { device, ws } = await connected(); device.press(); expect(track.enabled).toBe(false);
  ws.event({ type: "capture.start", turnId: "one" }); expect(track.enabled).toBe(true); device.release(); expect(track.enabled).toBe(false);
  device.close(); expect(track.stop).toHaveBeenCalled();
});
it("does not enable a microphone when a delayed acknowledgement arrives after release", async () => {
  const { device, ws } = await connected(); device.press(); device.release(); ws.event({ type: "capture.start", turnId: "one" }); expect(track.enabled).toBe(false); device.close();
});
it("does not construct audible playback until both approval and delivery arrive", async () => {
  const { device, ws } = await connected(); device.press(); ws.event({ type: "capture.start", turnId: "one" }); device.release();
  ws.event({ type: "audio.prepare", turnId: "one" });
  ws.event({ type: "audio.drained", turnId: "one" }); await vi.advanceTimersByTimeAsync(500); expect(play).not.toHaveBeenCalled();
  ws.event({ type: "audio.approved", turnId: "one", elapsedMs: 500 }); await vi.advanceTimersByTimeAsync(300); expect(play).toHaveBeenCalledOnce(); device.close();
});
it("discards a recorded response on interruption and ignores its late approval", async () => {
  const { device, ws } = await connected(); device.press(); ws.event({ type: "capture.start", turnId: "one" }); device.release(); ws.event({ type: "audio.prepare", turnId: "one" });
  device.press(); ws.event({ type: "audio.approved", turnId: "one", elapsedMs: 400 }); ws.event({ type: "audio.drained", turnId: "one" }); await vi.advanceTimersByTimeAsync(500);
  expect(play).not.toHaveBeenCalled(); expect(FakeRecorder.instance.state).toBe("inactive"); device.close();
});
