import { z } from "zod";
import { CHILD_ID, queryOne } from "@/server/db";
import { handle } from "@/server/http";
import { synthesize } from "@/server/speech";
import type { StoryPage } from "@/lib/contracts";

export const maxDuration = 120;

/** Streams the bedtime narration, so Oomi starts reading before the whole audio is generated. */
export function GET(_request: Request, { params }: RouteContext<"/api/stories/[id]/audio">) {
  return handle("story-audio", async () => {
    const { id } = await params;
    if (!z.uuid().safeParse(id).success) return new Response("Not found", { status: 404 });
    const story = await queryOne<{ title: string; pages: StoryPage[] }>(
      `SELECT title, pages FROM oomi_app.story WHERE id = $1 AND child_id = $2`,
      [id, CHILD_ID],
    );
    if (!story) return new Response("Not found", { status: 404 });
    const text = `${story.title}. ${story.pages.map((page) => page.text).join("\n\n")}`;
    const audio = await synthesize(text, "bedtime");
    return new Response(audio.body, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
  });
}
