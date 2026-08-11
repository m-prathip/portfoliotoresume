import { ResumeContent } from "../types";
import { LlmAdapter } from "../llm/types";

export interface TruthGuardFlag {
  path: string; // e.g. "projects[0].result"
  claim: string;
  reason: "no_lexical_overlap" | "contains_unverifiable_metric" | "llm_flagged_unsupported";
  detail?: string;
}

export interface TruthGuardReport {
  passed: boolean;
  flags: TruthGuardFlag[];
  checkedClaims: number;
}

const METRIC_PATTERN = /\b\d+(\.\d+)?\s*(%|percent|x\b|users?|customers?|requests?\/s|ms\b|rps\b)/i;

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "of", "to", "for", "with", "on", "in", "at",
  "by", "is", "was", "were", "are", "be", "this", "that", "it", "as", "from",
]);

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w)),
  );
}

/**
 * Fast heuristic check: does this claim share enough vocabulary with the
 * source text to plausibly be derived from it, rather than invented?
 * This is deliberately cheap (no LLM call) so it can run on every claim.
 */
function hasLexicalOverlap(claim: string, sourceTokens: Set<string>): boolean {
  const claimTokens = tokenize(claim);
  if (claimTokens.size === 0) return true; // nothing substantive to check
  let overlap = 0;
  claimTokens.forEach((t) => {
    if (sourceTokens.has(t)) overlap += 1;
  });
  return overlap / claimTokens.size >= 0.4;
}

function checkClaim(
  path: string,
  claim: string | undefined,
  sourceTokens: Set<string>,
  flags: TruthGuardFlag[],
): void {
  if (!claim || !claim.trim()) return;

  if (METRIC_PATTERN.test(claim)) {
    flags.push({
      path,
      claim,
      reason: "contains_unverifiable_metric",
      detail: "Contains a specific number/metric — must be explicitly present in source evidence, not inferred.",
    });
  }

  if (!hasLexicalOverlap(claim, sourceTokens)) {
    flags.push({
      path,
      claim,
      reason: "no_lexical_overlap",
      detail: "Claim shares little vocabulary with the source portfolio text — possible fabrication.",
    });
  }
}

/**
 * Heuristic pass (no LLM call): walks every free-text claim in the
 * structured resume and flags anything that doesn't lexically trace back
 * to the crawled source text, plus any unexplained numeric metrics.
 * Fast enough to run synchronously on every AI-structuring result.
 */
export function runHeuristicTruthGuard(content: ResumeContent, sourceText: string): TruthGuardReport {
  const sourceTokens = tokenize(sourceText);
  const flags: TruthGuardFlag[] = [];
  let checkedClaims = 0;

  content.projects.forEach((p, i) => {
    const fields: [string, string | undefined][] = [
      ["problem", p.problem],
      ["solution", p.solution],
      ["result", p.result],
    ];
    fields.forEach(([field, value]) => {
      if (value) checkedClaims += 1;
      checkClaim(`projects[${i}].${field}`, value, sourceTokens, flags);
    });
    (p.features ?? []).forEach((f, j) => {
      checkedClaims += 1;
      checkClaim(`projects[${i}].features[${j}]`, f, sourceTokens, flags);
    });
  });

  content.internships.forEach((it, i) => {
    (it.achievements ?? []).forEach((a, j) => {
      checkedClaims += 1;
      checkClaim(`internships[${i}].achievements[${j}]`, a, sourceTokens, flags);
    });
    it.responsibilities.forEach((r, j) => {
      checkedClaims += 1;
      checkClaim(`internships[${i}].responsibilities[${j}]`, r, sourceTokens, flags);
    });
  });

  content.achievements.forEach((a, i) => {
    checkedClaims += 1;
    checkClaim(`achievements[${i}].description`, a.description, sourceTokens, flags);
  });

  return { passed: flags.length === 0, flags, checkedClaims };
}

/**
 * Optional deeper pass: asks the LLM itself to verify each already-flagged
 * (or, budget permitting, every) claim against the raw source text and
 * explain whether it's actually supported. Use for claims the heuristic
 * pass flags, rather than the whole resume, to keep cost down.
 */
export async function runLlmTruthGuard(
  llm: LlmAdapter,
  sourceText: string,
  candidateFlags: TruthGuardFlag[],
): Promise<TruthGuardFlag[]> {
  if (candidateFlags.length === 0) return [];

  const prompt = `SOURCE TEXT:
"""
${sourceText.slice(0, 8000)}
"""

For each CLAIM below, answer strictly "SUPPORTED" or "UNSUPPORTED" — supported
means the claim (or a reasonable paraphrase of it) is actually present in the
source text; unsupported means it appears to be invented or not stated.

Respond as a JSON array of {"index": number, "verdict": "SUPPORTED"|"UNSUPPORTED"}.

CLAIMS:
${candidateFlags.map((f, i) => `${i}. ${f.claim}`).join("\n")}`;

  const raw = await llm.complete({
    messages: [
      { role: "system", content: "You are a strict fact-checking assistant. Output only JSON." },
      { role: "user", content: prompt },
    ],
    maxTokens: 1500,
    temperature: 0,
    jsonMode: true,
  });

  try {
    const trimmed = raw.trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
    const verdicts = JSON.parse(trimmed) as { index: number; verdict: "SUPPORTED" | "UNSUPPORTED" }[];
    return verdicts
      .filter((v) => v.verdict === "UNSUPPORTED")
      .map((v) => ({ ...candidateFlags[v.index], reason: "llm_flagged_unsupported" as const }));
  } catch {
    // If the LLM verification pass itself fails to parse, fail safe:
    // keep the original heuristic flags rather than silently dropping them.
    return candidateFlags;
  }
}
