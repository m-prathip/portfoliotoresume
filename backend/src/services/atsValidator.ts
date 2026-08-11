import * as cheerio from "cheerio";
import { ALL_SECTIONS, ResumeContent, SECTION_LABELS, SectionKey } from "../types";

export type AtsSeverity = "error" | "warning" | "info";

export interface AtsFlag {
  code: string;
  severity: AtsSeverity;
  message: string;
}

export interface AtsReport {
  passed: boolean; // no "error"-severity flags
  score: number; // 0-100, informational only
  pageCount: number;
  flags: AtsFlag[];
}

/**
 * Static (no-browser) checks against the rendered HTML: semantic headings,
 * text density, and image usage. Cheap enough to run on every keystroke if
 * a caller wants live feedback — the page-count/overflow check is the only
 * part that needs headless Chromium (see pdfRenderer.ts).
 */
export function runStaticAtsChecks(html: string, content: ResumeContent): AtsFlag[] {
  const $ = cheerio.load(html);
  const flags: AtsFlag[] = [];

  // 1. Exactly one <h1> — should be the candidate's name, so ATS parsers
  // can reliably identify who the resume belongs to.
  const h1Count = $("h1").length;
  if (h1Count !== 1) {
    flags.push({
      code: "h1_count",
      severity: "error",
      message: `Expected exactly one <h1> (the candidate's name), found ${h1Count}.`,
    });
  }

  // 2. Every non-empty section has a matching <h2> — ATS parsers commonly
  // split resumes into sections by heading text.
  const h2Texts = $("h2").map((_, el) => $(el).text().trim().toLowerCase()).get();
  const sections: SectionKey[] = content.sectionOrder && content.sectionOrder.length > 0 ? content.sectionOrder : ALL_SECTIONS;

  for (const key of sections) {
    const hasItems = key === "skills" ? Object.keys(content.skills || {}).length > 0 : ((content[key] as unknown[]) || []).length > 0;
    if (!hasItems) continue;

    const label = SECTION_LABELS[key];
    const firstWord = label.split(" ")[0].toLowerCase();
    const found = h2Texts.some((t) => t.includes(firstWord));
    if (!found) {
      flags.push({
        code: "missing_heading",
        severity: "warning",
        message: `Section "${label}" has content but no matching heading was found in the rendered output — some ATS parsers may miss it.`,
      });
    }
  }

  // 3. Text density — near-empty resumes give ATS keyword matchers nothing to work with.
  const visibleText = $("body").text().replace(/\s+/g, " ").trim();
  if (visibleText.length < 200) {
    flags.push({
      code: "low_text_content",
      severity: "warning",
      message: "Very little extractable text on the resume — this may be too sparse for ATS keyword matching.",
    });
  }

  // 4. Images — not blocking (our templates never put resume text inside an
  // image), but flag as info so a template author swapping in a logo etc.
  // gets a nudge that any text inside it won't be machine-readable.
  if ($("img").length > 0) {
    flags.push({
      code: "contains_images",
      severity: "info",
      message: "This resume contains image elements. Any text baked into an image cannot be read by ATS parsers.",
    });
  }

  // 5. Contact info present — email/phone missing is a hard usability issue.
  if (!content.personal?.email) {
    flags.push({ code: "missing_email", severity: "error", message: "No email address found in Personal Info." });
  }

  return flags;
}

/**
 * Combines the static checks with the page-overflow check (which requires
 * an already-computed pageCount from pdfRenderer.renderHtmlToPdf) into a
 * final report + a simple informational score.
 */
export function buildAtsReport(staticFlags: AtsFlag[], pageCount: number): AtsReport {
  const flags = [...staticFlags];

  if (pageCount > 1) {
    flags.push({
      code: "overflow",
      severity: "warning",
      message: `Content spans an estimated ${pageCount} pages. Fresher resumes should typically fit on a single page — consider trimming descriptions or removing lower-priority items.`,
    });
  }

  const errorCount = flags.filter((f) => f.severity === "error").length;
  const warningCount = flags.filter((f) => f.severity === "warning").length;
  const score = Math.max(0, 100 - errorCount * 25 - warningCount * 10);

  return { passed: errorCount === 0, score, pageCount, flags };
}
