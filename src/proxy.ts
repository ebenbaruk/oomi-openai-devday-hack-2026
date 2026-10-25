import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, ACCESS_HEADER, accessToken, safeEqual } from "@/lib/access";

/** Everything except the unlock flow sits behind the team access code (it spends OpenAI credits). */
export async function proxy(request: NextRequest) {
  // The landing page is public: it is what the jury and visitors see first.
  if (request.nextUrl.pathname === "/" || request.nextUrl.pathname === "/api/watch/turn" || request.nextUrl.pathname === "/api/watch/profile") return NextResponse.next();

  const code = process.env.OOMI_ACCESS_CODE;
  const secret = process.env.OOMI_SESSION_SECRET;
  if (!code || !secret) return new NextResponse("Server is missing OOMI_ACCESS_CODE / OOMI_SESSION_SECRET", { status: 500 });

  // Hardware devices send the code as a header instead of holding a cookie.
  const header = request.headers.get(ACCESS_HEADER);
  if (header && safeEqual(header, code)) return NextResponse.next();

  const cookie = request.cookies.get(ACCESS_COOKIE)?.value;
  if (cookie && safeEqual(cookie, await accessToken(secret, code))) return NextResponse.next();

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "locked" }, { status: 401 });
  }
  const unlock = new URL("/unlock", request.url);
  unlock.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(unlock);
}

export const config = {
  matcher: ["/((?!unlock|api/access|api/health|_next/|brand/|favicon|icon|apple-icon).*)"],
};
