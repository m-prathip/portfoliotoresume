import { crawlPortfolio, CrawlOutcome } from "../crawler";
import { getLlmAdapter } from "../llm";
import { structurePortfolioContent, AiStructuringError } from "./aiStructuring";
import { runHeuristicTruthGuard, runLlmTruthGuard, TruthGuardReport } from "./truthGuard";
import { ResumeContent } from "../types";

export interface PipelineResult {
  sourceUrl: string;
  fetchedWith: "http" | "browser";
  rawContent: {
    fullText: string;
    headings: string[];
    links: CrawlOutcome["links"];
  };
  structured: ResumeContent;
  truthGuard: TruthGuardReport;
}

/**
 * End-to-end Phase 2 pipeline: crawl -> parse -> AI structure -> Truth Guard.
 * Any unsupported claims flagged by the heuristic pass are re-checked by an
 * LLM verification call before being surfaced, to cut down false positives
 * from the cheap lexical-overlap heuristic.
 */
export async function runPortfolioPipeline(portfolioUrl: string): Promise<PipelineResult> {
  const { result, content, links } = await crawlPortfolio(portfolioUrl);

  if (content.fullText.length < 50) {
    throw new AiStructuringError(
      "Crawled page had almost no visible text — cannot structure a resume from it.",
    );
  }

  const llm = getLlmAdapter();

  const structured = await structurePortfolioContent(llm, content, links);

  const heuristicReport = runHeuristicTruthGuard(structured, content.fullText);
  let finalFlags = heuristicReport.flags;

  if (heuristicReport.flags.length > 0) {
    try {
      finalFlags = await runLlmTruthGuard(llm, content.fullText, heuristicReport.flags);
    } catch {
      // LLM verification failed (e.g. rate limit) — fail safe and keep the
      // heuristic flags rather than silently accepting unverified claims.
      finalFlags = heuristicReport.flags;
    }
  }

  return {
    sourceUrl: result.url,
    fetchedWith: result.fetchedWith,
    rawContent: { fullText: content.fullText, headings: content.headings, links },
    structured,
    truthGuard: {
      passed: finalFlags.length === 0,
      flags: finalFlags,
      checkedClaims: heuristicReport.checkedClaims,
    },
  };
}
