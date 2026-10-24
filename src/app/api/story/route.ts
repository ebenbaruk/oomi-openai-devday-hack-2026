import { after, NextResponse } from "next/server";
import { handle } from "@/server/http";
import { createStory } from "@/server/journal";

export const maxDuration = 120;

/** Writes tonight's story now and illustrates it for the parent app in the background. */
export function POST() {
  return handle("story", async () => {
    const { story, illustrate } = await createStory();
    after(() => illustrate().catch((error: unknown) => console.error("[story] illustration failed:", error)));
    return NextResponse.json(story);
  });
}
