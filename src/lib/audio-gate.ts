// Two independent permissions: the server checked the text, and WebRTC finished delivery.
// Reset on every interruption so delayed events can never release an earlier response.
export class AudioGate {
  private turnId = "";
  private approved = false;
  private drained = false;
  private released = false;
  prepare(turnId: string) { this.turnId = turnId; this.approved = false; this.drained = false; this.released = false; }
  discard() { this.prepare(""); }
  accept(type: "approved" | "drained", turnId: string) {
    if (!turnId || turnId !== this.turnId || this.released) return false;
    this[type] = true;
    if (!this.approved || !this.drained) return false;
    this.released = true;
    return true;
  }
}
