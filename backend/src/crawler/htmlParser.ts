import * as cheerio from "cheerio";

export interface ExtractedPortfolioContent {
  title?: string;
  fullText: string; // cleaned visible text, fed to the AI structuring prompt
  links: { text: string; href: string }[]; // candidate GitHub/LinkedIn/project links
  headings: string[]; // h1-h3 text, helps the LLM find section boundaries
}

const NOISE_TAGS = ["script", "style", "noscript", "svg", "iframe"];

/**
 * Parses raw HTML down to the visible text + structural signals the AI
 * structuring prompt needs. Deliberately does NOT try to guess resume
 * fields here — that's the LLM's job downstream; this stays dumb and safe.
 */
export function parseHtml(html: string, baseUrl: string): ExtractedPortfolioContent {
  const $ = cheerio.load(html);

  NOISE_TAGS.forEach((tag) => $(tag).remove());

  const title = $("title").first().text().trim() || undefined;

  const headings: string[] = [];
  $("h1, h2, h3").each((_, el) => {
    const text = $(el).text().trim();
    if (text) headings.push(text);
  });

  const links: { text: string; href: string }[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    const text = $(el).text().trim();
    if (!href || !text) return;
    try {
      const resolved = new URL(href, baseUrl).toString();
      links.push({ text, href: resolved });
    } catch {
      // ignore unresolvable hrefs (mailto without scheme issues, etc.)
    }
  });

  const fullText = $("body")
    .text()
    .replace(/\s+/g, " ")
    .trim();

  return { title, fullText, links, headings };
}

/** Filters extracted links down to the ones the AI structuring step cares about. */
export function classifyLinks(links: { text: string; href: string }[]) {
  const isGithub = (href: string) => /github\.com/i.test(href);
  const isLinkedIn = (href: string) => /linkedin\.com/i.test(href);
  const isDemo = (href: string) =>
    /vercel\.app|netlify\.app|herokuapp\.com|\.app\b/i.test(href) && !isGithub(href);

  return {
    github: links.filter((l) => isGithub(l.href)),
    linkedin: links.filter((l) => isLinkedIn(l.href)),
    likelyDemos: links.filter((l) => isDemo(l.href)),
    other: links.filter((l) => !isGithub(l.href) && !isLinkedIn(l.href) && !isDemo(l.href)),
  };
}
