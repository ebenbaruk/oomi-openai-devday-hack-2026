import { z } from "zod";
import { handle } from "@/server/http";
import { loadMedia } from "@/server/media";

/** Serves stored narration. Supports byte ranges, which Safari requires to play audio. */
export function GET(request: Request, { params }: RouteContext<"/api/media/[id]">) {
  return handle("media", async () => {
    const { id } = await params;
    if (!z.uuid().safeParse(id).success) return new Response("Not found", { status: 404 });
    const media = await loadMedia(id);
    if (!media) return new Response("Not found", { status: 404 });

    const headers = {
      "Content-Type": media.mime,
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=31536000, immutable",
    };
    const total = media.data.length;
    const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range") ?? "");
    if (!range) return new Response(new Uint8Array(media.data), { headers: { ...headers, "Content-Length": String(total) } });

    const start = range[1] ? Number(range[1]) : Math.max(0, total - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), total - 1) : total - 1;
    if (start >= total || start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${total}` } });
    return new Response(new Uint8Array(media.data.subarray(start, end + 1)), {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${total}`, "Content-Length": String(end - start + 1) },
    });
  });
}
