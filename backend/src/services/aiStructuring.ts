import { z } from "zod";
import { LlmAdapter } from "../llm/types";
import { ExtractedPortfolioContent } from "../crawler/htmlParser";
import { ResumeContent } from "../types";

// Zod mirror of ResumeContent (backend/src/types/index.ts) used to validate
// and safely parse whatever JSON the LLM returns. Keep in sync with that file.
const zSkills = z.record(z.array(z.string()));

const zEducation = z.object({
  degree: z.string(),
  college: z.string(),
  department: z.string().optional(),
  university: z.string().optional(),
  location: z.string().optional(),
  start_year: z.string().optional(),
  expected_graduation: z.string().optional(),
  cgpa_or_percentage: z.string().optional(),
  relevant_coursework: z.array(z.string()).optional(),
});

const zProject = z.object({
  name: z.string(),
  problem: z.string().optional(),
  solution: z.string().optional(),
  technologies: z.array(z.string()),
  contribution: z.string().optional(),
  features: z.array(z.string()).optional(),
  result: z.string().optional(),
  github_url: z.string().optional(),
  live_url: z.string().optional(),
});

const zInternship = z.object({
  company: z.string(),
  role: z.string(),
  duration: z.string(),
  responsibilities: z.array(z.string()),
  technologies: z.array(z.string()).optional(),
  achievements: z.array(z.string()).optional(),
  evidence: z.string().optional(),
});

const zCertification = z.object({
  certificate: z.string(),
  issuer: z.string(),
  date: z.string().optional(),
  credential_id: z.string().optional(),
  credential_url: z.string().optional(),
});

const zAchievement = z.object({
  category: z.enum(["hackathon", "competition", "award", "coding_contest", "academic", "open_source", "research"]),
  title: z.string(),
  description: z.string().optional(),
  date: z.string().optional(),
});

const zActivity = z.object({
  organization: z.string(),
  role: z.string(),
  description: z.string().optional(),
});

export const zResumeContent = z.object({
  personal: z.object({
    full_name: z.string(),
    target_role: z.string().optional(),
    email: z.string(),
    phone: z.string().optional(),
    location: z.string().optional(),
    linkedin: z.string().optional(),
    github: z.string().optional(),
    portfolio: z.string().optional(),
    other_links: z.array(z.string()).optional(),
  }),
  education: z.array(zEducation),
  skills: zSkills,
  projects: z.array(zProject),
  internships: z.array(zInternship),
  certifications: z.array(zCertification),
  achievements: z.array(zAchievement),
  activities: z.array(zActivity),
});

export class AiStructuringError extends Error {}

const SYSTEM_PROMPT = `You convert a student's public portfolio page content into a structured resume JSON.

STRICT RULES:
1. Output ONLY valid JSON matching the given schema. No prose, no markdown fences.
2. NEVER invent facts. Only include information that is explicitly present in the
   provided source text. If a field is not mentioned, omit it or leave the array empty.
3. NEVER invent metrics, percentages, user counts, revenue figures, or performance
   improvements that are not explicitly stated in the source text.
4. For every project, internship, and achievement, the "evidence" or the item's own
   text must be traceable to a substring that actually appears in the source text
   (paraphrasing is fine; fabricating new facts is not).
5. If you are unsure whether something is true, omit it rather than guess.`;

function buildUserPrompt(content: ExtractedPortfolioContent, links: Record<string, { text: string; href: string }[]>) {
  return `SOURCE TEXT (from the student's public portfolio):
"""
${content.fullText.slice(0, 12000)}
"""

DETECTED HEADINGS: ${content.headings.join(" | ") || "(none)"}

DETECTED LINKS:
GitHub: ${links.github?.map((l) => l.href).join(", ") || "(none)"}
LinkedIn: ${links.linkedin?.map((l) => l.href).join(", ") || "(none)"}
Likely live demos: ${links.likelyDemos?.map((l) => l.href).join(", ") || "(none)"}

Convert the source text above into JSON matching this TypeScript shape exactly:

{
  "personal": { "full_name": string, "target_role"?: string, "email": string, "phone"?: string, "location"?: string, "linkedin"?: string, "github"?: string, "portfolio"?: string, "other_links"?: string[] },
  "education": [{ "degree": string, "college": string, "department"?: string, "university"?: string, "location"?: string, "start_year"?: string, "expected_graduation"?: string, "cgpa_or_percentage"?: string, "relevant_coursework"?: string[] }],
  "skills": { "<category>": string[] },
  "projects": [{ "name": string, "problem"?: string, "solution"?: string, "technologies": string[], "contribution"?: string, "features"?: string[], "result"?: string, "github_url"?: string, "live_url"?: string }],
  "internships": [{ "company": string, "role": string, "duration": string, "responsibilities": string[], "technologies"?: string[], "achievements"?: string[], "evidence"?: string }],
  "certifications": [{ "certificate": string, "issuer": string, "date"?: string, "credential_id"?: string, "credential_url"?: string }],
  "achievements": [{ "category": "hackathon"|"competition"|"award"|"coding_contest"|"academic"|"open_source"|"research", "title": string, "description"?: string, "date"?: string }],
  "activities": [{ "organization": string, "role": string, "description"?: string }]
}

Return ONLY the JSON object.`;
}

/**
 * Converts crawled/parsed portfolio content into a validated ResumeContent
 * object. Does not itself enforce evidence-mapping beyond the prompt's
 * instructions — that enforcement (rejecting unsupported claims) is
 * truthGuard.ts's job, run as a separate pass on the output of this function.
 */
export async function structurePortfolioContent(
  llm: LlmAdapter,
  content: ExtractedPortfolioContent,
  links: Record<string, { text: string; href: string }[]>,
): Promise<ResumeContent> {
  const raw = await llm.complete({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(content, links) },
    ],
    maxTokens: 4000,
    temperature: 0,
    jsonMode: true,
  });

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(stripCodeFences(raw));
  } catch (err) {
    throw new AiStructuringError(`LLM (${llm.name}) did not return valid JSON: ${(err as Error).message}`);
  }

  const validated = zResumeContent.safeParse(parsedJson);
  if (!validated.success) {
    throw new AiStructuringError(`Structured output failed schema validation: ${validated.error.message}`);
  }

  return validated.data as ResumeContent;
}

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenceMatch ? fenceMatch[1] : trimmed;
}
