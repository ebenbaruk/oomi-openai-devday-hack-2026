// Shared access gate. Web Crypto only, so it runs in the proxy and in route handlers alike.

export const ACCESS_COOKIE = "oomi_access";
export const ACCESS_HEADER = "x-oomi-access";

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Cookie value proving the holder once entered the access code. Rotating the code invalidates it. */
export function accessToken(secret: string, code: string): Promise<string> {
  return hmac(secret, `oomi-access:v1:${code}`);
}

export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index++) diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return diff === 0;
}
