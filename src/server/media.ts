import "server-only";
import { query, queryOne } from "./db";

/** Generated audio (narration). Stored in Postgres like the pictures: one managed service for everything. */
export async function storeMedia(mime: string, data: Buffer): Promise<string> {
  const row = await queryOne<{ id: string }>(`INSERT INTO oomi_app.media (mime, data) VALUES ($1, $2) RETURNING id`, [mime, data]);
  if (!row) throw new Error("Failed to store media");
  return row.id;
}

export async function loadMedia(id: string): Promise<{ mime: string; data: Buffer } | undefined> {
  const rows = await query<{ mime: string; data: Buffer }>(`SELECT mime, data FROM oomi_app.media WHERE id = $1`, [id]);
  return rows[0];
}

export function mediaUrl(id: string | null | undefined): string | null {
  return id ? `/api/media/${id}` : null;
}
