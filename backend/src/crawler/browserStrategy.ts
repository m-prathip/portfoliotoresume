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

  try {
    const res = await fetch(`https://r.jina.ai/${url.toString()}`, {
      headers: { "user-agent": "ResumePlatformBot/1.0" },
    });

    if (!res.ok) {
      throw new CrawlError(`Jina Reader failed with status ${res.status}`, rawUrl);
    }

    const markdown = await res.text();
    return { url: url.toString(), html: markdown, fetchedWith: "browser", statusCode: res.status };
  } catch (err) {
    if (err instanceof CrawlError) throw err;
    throw new CrawlError("Jina Reader fetch failed", rawUrl, err);
  }
}
