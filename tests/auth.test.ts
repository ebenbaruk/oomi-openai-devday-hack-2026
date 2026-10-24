import { expect, it } from "vitest";
import { getConfig } from "../src/server/config";
import { authenticated, accessCodeMatches, cookieHeader, makeSessionToken, trustedOrigin } from "../src/server/auth";
import { vi } from "vitest";
it("rejects tampered, expired, absent cookies and unexpected origins", () => {
  vi.stubEnv("OPENAI_API_KEY", "test-key"); vi.stubEnv("DATABASE_URL", "postgres://localhost/test"); vi.stubEnv("OOMI_ACCESS_CODE", "test-access-code-long"); vi.stubEnv("OOMI_SESSION_SECRET", "test-secret-1234567890123456789012345"); vi.stubEnv("APP_ORIGIN", "https://oomi.example");
  try {
    const c = getConfig(); const token = makeSessionToken(c, 1000); const cookie = cookieHeader(token, c);
    expect(authenticated(cookie, c, 1001)).toBe(true); expect(authenticated(cookie, c, 30_000_000)).toBe(false);
    expect(authenticated(cookie.replace(token, `a${token}`), c, 1001)).toBe(false); expect(authenticated(null, c)).toBe(false);
    expect(cookie).toContain("HttpOnly; SameSite=Strict"); expect(cookie).toContain("Secure");
    expect(trustedOrigin("https://oomi.example.evil.test", c)).toBe(false); expect(trustedOrigin(null, c)).toBe(false); expect(trustedOrigin("https://oomi.example", c)).toBe(true);
    expect(accessCodeMatches("wrong", c)).toBe(false); expect(accessCodeMatches(c.OOMI_ACCESS_CODE, c)).toBe(true);
  } finally { vi.unstubAllEnvs(); }
});
