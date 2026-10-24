import { z } from "zod";
import { getConfig } from "../../../server/config";
import { accessCodeMatches, cookieHeader, loginBucket, makeSessionToken, trustedOrigin } from "../../../server/auth";
import { allowAttempt } from "../../../server/db";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const config = getConfig();
    if (!trustedOrigin(request.headers.get("origin"), config)) return Response.json({ error: "Origine refusée." }, { status: 403 });
    if (Number(request.headers.get("content-length") ?? 0) > 1024) return new Response(null, { status: 413 });
    const raw = await request.text();
    if (raw.length > 1024) return new Response(null, { status: 413 });
    let json: unknown;
    try { json = JSON.parse(raw); } catch { return new Response(null, { status: 400 }); }
    const body = z.object({ code: z.string().max(200) }).strict().safeParse(json);
    if (!body.success) return new Response(null, { status: 400 });
    const ip = process.env.VERCEL ? request.headers.get("x-vercel-forwarded-for") ?? "unknown" : "local-demo";
    if (!await allowAttempt(loginBucket(ip, config))) return Response.json({ error: "Trop de tentatives. Réessayez dans 15 minutes." }, { status: 429 });
    if (!accessCodeMatches(body.data.code, config)) return Response.json({ error: "Code incorrect." }, { status: 401 });
    return Response.json({ ok: true }, { headers: { "Set-Cookie": cookieHeader(makeSessionToken(config), config), "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "La session n’est pas configurée. Vérifiez les variables et les migrations Postgres." }, { status: 503 }); }
}
