import { z } from "zod";
import { handle } from "@/server/http";
import { loadImage } from "@/server/images";

export function GET(_request: Request, { params }: RouteContext<"/api/images/[id]">) {
  return handle("images", async () => {
    const { id } = await params;
    if (!z.uuid().safeParse(id).success) return new Response("Not found", { status: 404 });
    const image = await loadImage(id);
    if (!image) return new Response("Not found", { status: 404 });
    return new Response(new Uint8Array(image.data), {
      headers: { "Content-Type": image.mime, "Cache-Control": "private, max-age=31536000, immutable" },
    });
  });
}
