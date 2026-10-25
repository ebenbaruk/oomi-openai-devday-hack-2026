import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import assert from "node:assert/strict";

await mkdir("tmp", { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: "reduce" });
  const errors = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto(process.env.OOMI_TEST_URL ?? "http://localhost:3000", { waitUntil: "networkidle" });
  assert.match(await page.title(), /Oomi/);
  const expressions = page.locator(".expression-button"); assert.equal(await expressions.count(), 8);
  for (let i = 0; i < 8; i++) {
    const expression = expressions.nth(i); await expression.click(); assert.equal(await expression.getAttribute("aria-pressed"), "true");
    assert.equal(await page.getByLabel("Microphone coupé", { exact: true }).count(), 1);
  }
  await expressions.first().click();
  await page.screenshot({ path: "tmp/oomi-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, "Mobile overflow");
  await page.screenshot({ path: "tmp/oomi-mobile.png", fullPage: true });
  const health = await page.request.get("/api/health"); assert.equal(health.status(), 200);
  assert.equal(errors.length, 0, errors.join("\n"));
  console.log("UI verified: 8 expressions, muted preview, mobile layout, health endpoint, no browser exceptions.");
} finally { await browser.close(); }
