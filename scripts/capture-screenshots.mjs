import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";

const base = "http://127.0.0.1:3000";
const outDir = join(process.cwd(), "docs", "screenshots");
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

await page.goto(`${base}/login`, { waitUntil: "networkidle" });
await page.locator('input[type="email"]').fill("manager@demo.local");
await page.locator('input[type="password"]').fill("demo12345");
await page.locator('button[type="submit"]').click();
await page.waitForURL("**/tickets**", { timeout: 30_000 });

for (const [name, path] of [
  ["tickets", "/tickets"],
  ["tickets-new", "/tickets/new"],
]) {
  await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: join(outDir, `${name}.png`), fullPage: true });
  console.log("saved", name);
}

await browser.close();
