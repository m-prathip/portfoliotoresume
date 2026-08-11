import { CrawlError, CrawlResult, assertSafePublicUrl } from "./types";

const USER_AGENT = "ResumePlatformBot/1.0 (+portfolio-to-resume; respects robots.txt)";
const FETCH_TIMEOUT_MS = 10_000;

/**
 * Plain HTTP fetch — fast, no JS execution. Works for static/server-rendered
 * portfolio sites. Flags itself as likely-insufficient when the returned
 * HTML looks like an empty SPA shell, so the caller knows to fall back.
 */
export async function fetchStrategy(rawUrl: string): Promise<CrawlResult> {
  const url = assertSafePublicUrl(rawUrl);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url.toString(), {
      headers: { "user-agent": USER_AGENT, accept: "text/html" },
      redirect: "follow",
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new CrawlError(`HTTP fetch failed with status ${res.status}`, rawUrl);
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      throw new CrawlError(`Unexpected content-type: ${contentType}`, rawUrl);
    }

    const html = await res.text();
    return { url: url.toString(), html, fetchedWith: "http", statusCode: res.status };
  } catch (err) {
    if (err instanceof CrawlError) throw err;
    throw new CrawlError("HTTP fetch failed", rawUrl, err);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Heuristic: does this HTML look like a client-rendered SPA shell with
 * little/no real content, i.e. does it need a headless browser instead?
 */
export function looksLikeEmptyShell(html: string): boolean {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyContent = (bodyMatch?.[1] ?? html).replace(/<script[\s\S]*?<\/script>/gi, "");
  const visibleTextLength = bodyContent.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length;

  // Root divs like <div id="root"></div> / <div id="__next"></div> with
  // almost nothing else are the classic unrendered-SPA signature.
  const hasEmptyRootDiv = /<div[^>]+id=["'](root|app|__next)["'][^>]*>\s*<\/div>/i.test(html);

  return hasEmptyRootDiv || visibleTextLength < 200;
}
