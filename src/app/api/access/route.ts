import { NextResponse } from "next/server";
import { z } from "zod";
import { ACCESS_COOKIE, accessToken, safeEqual } from "@/lib/access";
import { env } from "@/server/env";
import { parseJson } from "@/server/http";

export async function POST(request: Request) {
  const body = await parseJson(request, z.object({ code: z.string().max(200) }));
  if (body instanceof NextResponse) return body;
  const { OOMI_ACCESS_CODE, OOMI_SESSION_SECRET } = env();
  if (!safeEqual(body.code.trim(), OOMI_ACCESS_CODE)) {
    return NextResponse.json({ error: "wrong_code" }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ACCESS_COOKIE, await accessToken(OOMI_SESSION_SECRET, OOMI_ACCESS_CODE), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return response;
}
