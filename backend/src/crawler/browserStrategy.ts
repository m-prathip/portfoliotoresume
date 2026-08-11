import { CrawlError, CrawlResult, assertSafePublicUrl } from "./types";

const NAV_TIMEOUT_MS = 15_000;

/**
 * Headless-browser fallback for JS-rendered portfolios (React/Vue/Next SPA
 * shells that fetchStrategy can't see through). Only invoked when the plain
 * HTTP fetch looks insufficient — Playwright is much heavier per request.
 *
 * Lazily imports `playwright` so environments that never trigger the
 * fallback don't pay the startup/browser-binary cost.
 */
export async function browserStrategy(rawUrl: string): Promise<CrawlResult> {
  const url = assertSafePublicUrl(rawUrl);

  let chromium: typeof import("playwright").chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch (err) {
    throw new CrawlError(
      "Playwright is not installed. Run `npx playwright install --with-deps chromium`.",
      rawUrl,
      err,
    );
  }

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      userAgent: "ResumePlatformBot/1.0 (+portfolio-to-resume; respects robots.txt)",
    });
    const page = await context.newPage();

    const response = await page.goto(url.toString(), {
      waitUntil: "networkidle",
      timeout: NAV_TIMEOUT_MS,
    });

    if (!response || !response.ok()) {
      throw new CrawlError(`Browser navigation failed with status ${response?.status()}`, rawUrl);
    }

    const html = await page.content();
    return { url: url.toString(), html, fetchedWith: "browser", statusCode: response.status() };
  } catch (err) {
    if (err instanceof CrawlError) throw err;
    throw new CrawlError("Headless browser fetch failed", rawUrl, err);
  } finally {
    await browser.close();
  }
}
