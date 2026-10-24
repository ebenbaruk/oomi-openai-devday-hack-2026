import "server-only";
import type { Activity, Explainer, ExplainerScene, Language, SceneColor } from "@/lib/contracts";
import { sceneColors, writeExplainer } from "./brain";
import { loadChild } from "./child";
import { CHILD_ID, query, queryOne } from "./db";
import { illustrate, imageUrl } from "./images";
import { mediaUrl } from "./media";
import { describeMascot } from "./persona";
import { synthesizeToMedia } from "./speech";

/** Scene as stored: ids, turned into URLs when served. */
type StoredScene = {
  caption: string;
  narration: string;
  imageId: string | null;
  emojis: string[];
  color: SceneColor;
  audioId: string | null;
};

type ExplainerRow = {
  id: string;
  discovery_id: string;
  title: string;
  language: Language;
  status: "pending" | "ready" | "failed";
  scenes: StoredScene[];
  emoji: string | null;
  topic: string | null;
  activity: Activity | null;
  image_id: string | null;
};

const SELECT_EXPLAINER = `SELECT e.id, e.discovery_id, e.title, e.language, e.status, e.scenes, d.emoji, d.topic, d.activity, d.image_id
  FROM oomi_app.explainer e JOIN oomi_app.discovery d ON d.id = e.discovery_id`;

function toExplainer(row: ExplainerRow): Explainer {
  return {
    id: row.id,
    discoveryId: row.discovery_id,
    title: row.title || row.topic || "",
    emoji: row.emoji ?? "✨",
    language: row.language,
    // A failed generation is shown as pending: the kid app keeps its friendly waiting screen and can retry.
    status: row.status === "ready" ? "ready" : "pending",
    scenes: row.scenes.map(
      (scene): ExplainerScene => ({
        caption: scene.caption,
        narration: scene.narration,
        imageUrl: imageUrl(scene.imageId),
        emojis: scene.emojis,
        color: scene.color,
        audioUrl: mediaUrl(scene.audioId),
      }),
    ),
    mission: row.activity,
    coverUrl: imageUrl(row.image_id),
  };
}

export async function loadExplainer(id: string): Promise<Explainer | undefined> {
  const row = await queryOne<ExplainerRow>(`${SELECT_EXPLAINER} WHERE e.id = $1 AND e.child_id = $2`, [id, CHILD_ID]);
  return row && toExplainer(row);
}

/**
 * Returns the explainer of a discovery, creating it when needed. Generation runs in `generate`,
 * which the caller schedules after responding (it takes ~30 s: script, 2 pictures, 4 narrations).
 */
export async function requestExplainer(
  discoveryId: string,
): Promise<{ explainer: Explainer; generate?: () => Promise<void> } | undefined> {
  const discovery = await queryOne<{ id: string }>(
    `SELECT id FROM oomi_app.discovery WHERE id = $1 AND child_id = $2 AND verdict = 'answer' AND status = 'ready'`,
    [discoveryId, CHILD_ID],
  );
  if (!discovery) return undefined;

  // Inserting resets a failed row to pending, so asking again retries.
  const claimed = await queryOne<{ id: string }>(
    `INSERT INTO oomi_app.explainer (child_id, discovery_id, language)
     SELECT child_id, id, language FROM oomi_app.discovery WHERE id = $1
     ON CONFLICT (discovery_id) DO UPDATE SET status = 'pending', created_at = now()
       WHERE oomi_app.explainer.status = 'failed'
          OR (oomi_app.explainer.status = 'pending' AND oomi_app.explainer.created_at < now() - interval '3 minutes')
     RETURNING id`,
    [discoveryId],
  );
  const row = await queryOne<ExplainerRow>(`${SELECT_EXPLAINER} WHERE e.discovery_id = $1`, [discoveryId]);
  if (!row) throw new Error("Explainer row missing");
  return { explainer: toExplainer(row), generate: claimed ? () => generateExplainer(row.id) : undefined };
}

export async function generateExplainer(explainerId: string): Promise<void> {
  try {
    const source = await queryOne<{ question: string; topic: string; summary: string; image_id: string | null; language: Language }>(
      `SELECT d.question, d.topic, d.summary, d.image_id, e.language
       FROM oomi_app.explainer e JOIN oomi_app.discovery d ON d.id = e.discovery_id WHERE e.id = $1`,
      [explainerId],
    );
    if (!source) throw new Error("Explainer source missing");
    const child = await loadChild();
    const script = await writeExplainer({
      question: source.question,
      topic: source.topic,
      summary: source.summary,
      childName: child.firstName,
      age: child.age,
      language: source.language,
      companion: describeMascot(child.mascot),
    });
    const colors = sceneColors(source.topic, script.scenes.length);
    const scenes = await Promise.all(
      script.scenes.map(async (scene, index): Promise<StoredScene> => {
        const [imageId, audioId] = await Promise.all([
          scene.picture ? illustrate(scene.picture, "low", describeMascot(child.mascot)) : Promise.resolve(source.image_id),
          synthesizeToMedia(scene.narration, "explainer", source.language, child.mascot.voice),
        ]);
        return { caption: scene.caption, narration: scene.narration, imageId, emojis: scene.emojis.slice(0, 3), color: colors[index], audioId };
      }),
    );
    await query(`UPDATE oomi_app.explainer SET title = $2, scenes = $3, status = 'ready' WHERE id = $1`, [
      explainerId,
      script.title,
      JSON.stringify(scenes),
    ]);
  } catch (error) {
    await query(`UPDATE oomi_app.explainer SET status = 'failed' WHERE id = $1`, [explainerId]);
    throw error;
  }
}
