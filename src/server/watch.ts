import "server-only";
import { createHash, randomBytes, randomInt } from "node:crypto";
import { z } from "zod";
import type { Language, WatchMascot, WatchProfileResponse, WatchTurnResponse } from "@/lib/contracts";
import { CHILD_ID, query, queryOne } from "./db";
import { loadChild } from "./child";
import { loadMascot } from "./mascot";
import { transcribe, synthesize, writeReply } from "./speech";
import { checkAnswer, decideTurn } from "./turn";

const MAX_AUDIO_BYTES = 4 * 1024 * 1024;
const supportedAudio = new Set(["audio/mp4", "audio/m4a", "audio/x-m4a", "audio/aac", "audio/wav", "audio/x-wav", "audio/mpeg", "audio/webm"]);
const WATCH_TOKEN_TTL = "365 days";
const MAX_PAIRING_ATTEMPTS = 8;

export class WatchError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

const credentialHash = (value: string) => createHash("sha256").update(value).digest("hex");
type WatchCredentials = { pairingCode?: string; deviceToken?: string };
type WatchAuth = { deviceToken?: string };

/** Creates a 15-minute code. The first connection exchanges it for a secure Watch credential. */
export async function createWatchPairing(): Promise<{ pairingCode: string; expiresAt: string }> {
  const pairingCode = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const row = await queryOne<{ pairing_expires_at: Date }>(
    `INSERT INTO oomi_app.watch_device (child_id, name, pairing_code_hash, pairing_expires_at)
     VALUES ($1, 'Apple Watch', $2, now() + interval '15 minutes')
     ON CONFLICT (child_id, name) DO UPDATE SET pairing_code_hash = EXCLUDED.pairing_code_hash,
       pairing_expires_at = EXCLUDED.pairing_expires_at, paired_at = NULL, last_seen_at = NULL, failed_attempts = 0
     RETURNING pairing_expires_at`,
    [CHILD_ID, credentialHash(pairingCode)],
  );
  if (!row) throw new Error("Unable to create Watch code");
  return { pairingCode, expiresAt: row.pairing_expires_at.toISOString() };
}

/** Lets the parent UI distinguish an already linked Watch from a Watch that needs first-time setup. */
export async function getWatchPairingStatus(): Promise<{ paired: boolean; pairedAt: string | null; lastSeenAt: string | null }> {
  const device = await queryOne<{ paired_at: Date | null; last_seen_at: Date | null }>(
    `SELECT paired_at, last_seen_at
     FROM oomi_app.watch_device
     WHERE child_id = $1 AND name = 'Apple Watch'
     LIMIT 1`,
    [CHILD_ID],
  );
  return {
    paired: Boolean(device?.paired_at),
    pairedAt: device?.paired_at?.toISOString() ?? null,
    lastSeenAt: device?.last_seen_at?.toISOString() ?? null,
  };
}

/** The short code is accepted once, then replaced by a high-entropy credential in the Watch Keychain. */
async function verifyWatch(credentials: WatchCredentials): Promise<WatchAuth> {
  if (credentials.deviceToken) {
    const device = await queryOne<{ id: string }>(
      `SELECT id FROM oomi_app.watch_device
       WHERE child_id = $1 AND pairing_code_hash = $2 AND paired_at IS NOT NULL
         AND pairing_expires_at > now() LIMIT 1`,
      [CHILD_ID, credentialHash(credentials.deviceToken)],
    );
    if (!device) throw new WatchError(401, "Cette Watch doit être reconnectée depuis l'espace parent.");
    await query(`UPDATE oomi_app.watch_device SET last_seen_at = now() WHERE id = $1`, [device.id]);
    return {};
  }

  const code = credentials.pairingCode;
  if (!code) throw new WatchError(400, "Ajoutez le code créé dans l'espace parent.");
  const device = await queryOne<{ id: string }>(
    `SELECT id FROM oomi_app.watch_device
     WHERE child_id = $1 AND pairing_code_hash = $2 AND pairing_expires_at > now() LIMIT 1`,
    [CHILD_ID, credentialHash(code)],
  );
  if (!device) {
    // Burn the pending code after a few wrong guesses so it can't be brute-forced.
    await query(
      `UPDATE oomi_app.watch_device
       SET failed_attempts = failed_attempts + 1,
         pairing_expires_at = CASE WHEN failed_attempts + 1 >= $2 THEN now() ELSE pairing_expires_at END
       WHERE child_id = $1 AND paired_at IS NULL`,
      [CHILD_ID, MAX_PAIRING_ATTEMPTS],
    );
    throw new WatchError(401, "Ce code Watch a expiré. Créez-en un nouveau dans l'espace parent.");
  }

  const deviceToken = randomBytes(32).toString("base64url");
  const paired = await queryOne<{ id: string }>(
    `UPDATE oomi_app.watch_device
     SET pairing_code_hash = $2, pairing_expires_at = now() + interval '${WATCH_TOKEN_TTL}',
       paired_at = now(), last_seen_at = now()
     WHERE id = $1 AND pairing_code_hash = $3
     RETURNING id`,
    [device.id, credentialHash(deviceToken), credentialHash(code)],
  );
  if (!paired) throw new WatchError(401, "Le code vient d'être remplacé. Créez-en un nouveau dans l'espace parent.");
  return { deviceToken };
}

/** The Watch has no parent cookie. Its credential only grants this deliberately narrow profile. */
async function loadWatchMascot(): Promise<WatchMascot> {
  const mascot = await loadMascot();
  if (!mascot.config.portraitId) return { config: mascot.config, portrait: null };
  const portrait = await queryOne<{ mime: string; data: Buffer }>(
    `SELECT image.mime, image.data
     FROM oomi_app.mascot_portrait portrait
     JOIN oomi_app.image image ON image.id = portrait.image_id
     WHERE portrait.id = $1 AND portrait.child_id = $2`,
    [mascot.config.portraitId, CHILD_ID],
  );
  return { config: mascot.config, portrait: portrait ? { mime: portrait.mime, base64: portrait.data.toString("base64") } : null };
}

export async function loadWatchProfile(credentials: WatchCredentials): Promise<WatchProfileResponse> {
  const auth = await verifyWatch(credentials);
  const child = await loadChild();
  return { childName: child.firstName, mascot: await loadWatchMascot(), ...auth };
}

function toState(verdict: WatchTurnResponse["verdict"]): WatchTurnResponse["state"] {
  return verdict === "answer" ? "happy" : verdict;
}

async function withAudio(turnId: string, verdict: WatchTurnResponse["verdict"], text: string, language: Language, voice: string, mascot: WatchMascot, auth: WatchAuth): Promise<WatchTurnResponse> {
  const audio = await synthesize(text, "playful", language, voice);
  const bytes = Buffer.from(await audio.arrayBuffer());
  return { turnId, verdict, state: toState(verdict), text, audioBase64: bytes.toString("base64"), audioMimeType: "audio/mpeg", mascot, ...auth };
}

/** Watch fallback turn: transcript → safety gate → OpenAI text + OpenAI audio. */
export async function handleWatchTurn(request: Request): Promise<WatchTurnResponse> {
  if (!request.headers.get("content-type")?.includes("multipart/form-data")) throw new WatchError(415, "Audio multipart required.");
  const form = await request.formData();
  const pairingCode = z.string().regex(/^\d{6}$/).safeParse(form.get("pairingCode"));
  const deviceToken = z.string().min(32).safeParse(form.get("deviceToken"));
  const audio = form.get("audio");
  if ((!pairingCode.success && !deviceToken.success) || !(audio instanceof File)) throw new WatchError(400, "Reprenez la connexion de votre Watch.");
  if (audio.size < 400 || audio.size > MAX_AUDIO_BYTES || !supportedAudio.has(audio.type.toLowerCase())) throw new WatchError(400, "L'enregistrement audio n'est pas valide.");
  const auth = await verifyWatch({ pairingCode: pairingCode.success ? pairingCode.data : undefined, deviceToken: deviceToken.success ? deviceToken.data : undefined });

  const [child, mascot] = await Promise.all([loadChild(), loadWatchMascot()]);
  const session = await queryOne<{ id: string }>(`INSERT INTO oomi_app.voice_session (child_id) VALUES ($1) RETURNING id`, [CHILD_ID]);
  if (!session) throw new Error("Unable to start Watch session");
  try {
    const transcript = await transcribe(audio);
    const gate = await decideTurn(session.id, transcript);
    if (gate.action === "ignore") throw new WatchError(400, "Je n'ai pas bien entendu. Réessaie en parlant un peu plus près.");
    const fallback = child.language === "fr" ? "Oups, mon cerveau d'explorateur s'est emmêlé ! Tu peux me reposer la question ?" : "Oops, can you ask me again?";
    if (gate.action === "sleep") return withAudio(`sleep:${crypto.randomUUID()}`, "decline", gate.say, child.language, child.mascot.voice, mascot, auth);
    if (gate.action === "story") return withAudio(gate.turnId, "answer", gate.say, gate.language, child.mascot.voice, mascot, auth);

    const watchInstructions = `${gate.instructions}

You are answering on a small Apple Watch screen. Reply in one warm, child-friendly sentence of at most 18 words and 90 characters. Keep the answer complete and concrete.`;
    const draft = gate.exactText ?? await writeReply(transcript, watchInstructions);
    const checked = await checkAnswer(draft, gate.language);
    return withAudio(gate.turnId, checked.safe ? gate.verdict : "decline", checked.safe ? draft : (checked.replacement ?? fallback), gate.language, child.mascot.voice, mascot, auth);
  } finally {
    await query(`DELETE FROM oomi_app.voice_session WHERE id = $1`, [session.id]).catch(() => undefined);
  }
}
