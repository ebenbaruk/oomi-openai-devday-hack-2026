import { after } from "next/server";
import { z } from "zod";
import type { Language, StoryPage } from "@/lib/contracts";
import { loadChild } from "@/server/child";
import { CHILD_ID, query, queryOne } from "@/server/db";
import { handle } from "@/server/http";
import { loadMedia, storeMedia } from "@/server/media";
import { synthesize } from "@/server/speech";

export const maxDuration = 120;

/**
 * Bedtime narration. The first play streams the TTS so Oomi starts reading right away, and keeps a copy:
 * later plays (parent app, Oomi TV) are instant and free.
 */
export function GET(_request: Request, { params }: RouteContext<"/api/stories/[id]/audio">) {
  return handle("story-audio", async () => {
    const { id } = await params;
    if (!z.uuid().safeParse(id).success) return new Response("Not found", { status: 404 });
    const story = await queryOne<{ title: string; pages: StoryPage[]; language: Language; audio_id: string | null }>(
      `SELECT title, pages, language, audio_id FROM oomi_app.story WHERE id = $1 AND child_id = $2`,
      [id, CHILD_ID],
    );
    if (!story) return new Response("Not found", { status: 404 });

    const cached = story.audio_id ? await loadMedia(story.audio_id) : undefined;
    if (cached) {
      return new Response(new Uint8Array(cached.data), {
        headers: { "Content-Type": cached.mime, "Content-Length": String(cached.data.length), "Cache-Control": "private, max-age=3600" },
      });
    }

    const text = `${story.title}. ${story.pages.map((page) => page.text).join("\n\n")}`;
    const audio = await synthesize(text, "bedtime", story.language, (await loadChild()).mascot.voice);
    if (!audio.body) throw new Error("TTS returned no audio");
    const [toClient, toStore] = audio.body.tee();
    after(async () => {
      const data = Buffer.from(await new Response(toStore).arrayBuffer());
      const mediaId = await storeMedia("audio/mpeg", data);
      await query(`UPDATE oomi_app.story SET audio_id = $2 WHERE id = $1 AND audio_id IS NULL`, [id, mediaId]);
    });
    return new Response(toClient, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
  });
}
