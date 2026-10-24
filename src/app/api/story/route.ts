import { after, NextResponse } from "next/server";
import { StoryRequest } from "@/lib/contracts";
import { handle } from "@/server/http";
import { createStory } from "@/server/journal";

export const maxDuration = 120;

/** Writes tonight's story now and illustrates it for the parent app in the background. */
export function POST(request: Request) {
  return handle("story", async () => {
    // The body is optional: an empty request means "in the family language".
    const body = StoryRequest.safeParse(await request.json().catch(() => ({})));
    const { story, illustrate } = await createStory(body.success ? body.data.language : undefined);
    after(() => illustrate().catch((error: unknown) => console.error("[story] illustration failed:", error)));
    return NextResponse.json(story);
  });
}
