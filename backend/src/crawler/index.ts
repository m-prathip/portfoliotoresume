import { fetchStrategy, looksLikeEmptyShell } from "./fetchStrategy";
import { browserStrategy } from "./browserStrategy";
import { parseHtml, classifyLinks } from "./htmlParser";
import type { ExtractedPortfolioContent } from "./htmlParser";
import { CrawlError } from "./types";
import type { CrawlResult } from "./types";

export * from "./types";
export type { ExtractedPortfolioContent };

export interface CrawlOutcome {
  result: CrawlResult;
  content: ExtractedPortfolioContent;
  links: ReturnType<typeof classifyLinks>;
}

/**
 * Orchestrates the crawl: try the fast HTTP fetch first; only pay for a
 * headless browser if the fetched HTML looks like an unrendered SPA shell
 * or the fetch itself fails outright.
 */
export async function crawlPortfolio(url: string): Promise<CrawlOutcome> {
  let result: CrawlResult;

  try {
    result = await fetchStrategy(url);
    if (looksLikeEmptyShell(result.html)) {
      result = await browserStrategy(url);
    }
  } catch (fetchErr) {
    try {
      result = await browserStrategy(url);
    } catch (browserErr) {
      throw new CrawlError(
        "Both HTTP fetch and headless browser failed to retrieve the portfolio",
        url,
        { fetchErr, browserErr },
      );
    }
  }

  const content = parseHtml(result.html, result.url);
  const links = classifyLinks(content.links);

  return { result, content, links };
}
