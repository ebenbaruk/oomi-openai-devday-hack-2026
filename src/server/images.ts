import "server-only";
import { query, queryOne } from "./db";
import { env } from "./env";
import { openai } from "./openai";

// One consistent, warm picture-book look across discovery cards and bedtime stories.
const STYLE = `Soft children's picture-book illustration, rounded shapes, warm and bright palette,
gentle grain, cozy and joyful, simple composition, no text, no letters, no words.`;

const DEFAULT_COMPANION = "a round coral pebble-shaped creature with a navy face screen and two big cream eyes";

/** `companion` describes the family's mascot, so it looks the same in every picture. */
export async function illustrate(scene: string, quality: "low" | "medium" = "low", companion = DEFAULT_COMPANION): Promise<string> {
  const result = await openai((client) =>
    client.images.generate({
      model: env().OOMI_MODEL_IMAGE,
      prompt: `${STYLE}\nIf a small explorer companion appears, it is ${companion}.\n\nScene: ${scene}`,
      size: "1024x1024",
      quality,
      output_format: "webp",
      output_compression: 80,
      n: 1,
    }),
  );
  const base64 = result.data?.[0]?.b64_json;
  if (!base64) throw new Error("Image generation returned no data");
  const row = await queryOne<{ id: string }>(`INSERT INTO oomi_app.image (mime, data) VALUES ($1, $2) RETURNING id`, [
    "image/webp",
    Buffer.from(base64, "base64"),
  ]);
  if (!row) throw new Error("Failed to store image");
  return row.id;
}

export async function loadImage(id: string): Promise<{ mime: string; data: Buffer } | undefined> {
  const rows = await query<{ mime: string; data: Buffer }>(`SELECT mime, data FROM oomi_app.image WHERE id = $1`, [id]);
  return rows[0];
}

export function imageUrl(id: string | null | undefined): string | null {
  return id ? `/api/images/${id}` : null;
}
