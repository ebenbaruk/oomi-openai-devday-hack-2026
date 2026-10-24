import { createHmac, timingSafeEqual } from "node:crypto";
import type { Config } from "./config";

export const COOKIE_NAME = "oomi_demo";
const ttl = 8 * 60 * 60;
function digest(value: string, secret: string) { return createHmac("sha256", secret).update(value).digest("base64url"); }
export function accessCodeMatches(code: string, config: Config) {
  return timingSafeEqual(Buffer.from(digest(code, config.OOMI_SESSION_SECRET)), Buffer.from(digest(config.OOMI_ACCESS_CODE, config.OOMI_SESSION_SECRET)));
}
export function makeSessionToken(config: Config, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ purpose: "oomi-adult-demo", expires: now + ttl * 1000 })).toString("base64url");
  return `${payload}.${digest(payload, config.OOMI_SESSION_SECRET)}`;
}
export function authenticated(cookie: string | null | undefined, config: Config, now = Date.now()) {
  try {
    const token = cookie?.split(";").map(p => p.trim()).find(p => p.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1);
    const [payload, signature] = token?.split(".") ?? [];
    if (!payload || !signature) return false;
    const expected = digest(payload, config.OOMI_SESSION_SECRET);
    if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
    const value: unknown = JSON.parse(Buffer.from(payload, "base64url").toString());
    return !!value && typeof value === "object" && "purpose" in value && value.purpose === "oomi-adult-demo"
      && "expires" in value && typeof value.expires === "number" && value.expires > now;
  } catch { return false; }
}
export function trustedOrigin(origin: string | null | undefined, config: Config) { return origin === new URL(config.APP_ORIGIN).origin; }
export function loginBucket(ip: string, config: Config) { return `login:${digest(ip, config.OOMI_SESSION_SECRET)}`; }
export function cookieHeader(token: string, config: Config) {
  return `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${ttl}${config.APP_ORIGIN.startsWith("https:") ? "; Secure" : ""}`;
}
