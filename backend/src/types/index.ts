// Shared types mirroring db/schema.sql and the blueprint's
// Student Information Model. These describe the shape of `resumes.content`.

export interface User {
  id: string;
  email: string;
  full_name?: string;
  target_role?: string;
  phone?: string;
  location?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Portfolio {
  id: string;
  user_id: string;
  source_url: string;
  raw_content: unknown; // crawler output, pre-AI-structuring (Phase 2)
  crawl_status: "pending" | "success" | "failed" | "partial";
  crawled_at?: string;
}

export interface Template {
  id: string;
  name: string;
  slug: string;
  category?: string;
  subcategory?: string;
  description?: string;
  html_template: string;
  css_styles: string;
  is_ats_safe: boolean;
  is_active: boolean;
  ats_level?: "excellent" | "good" | "moderate" | "creative";
  recommended_roles?: string[];
  tags?: string[];
  template_config?: Record<string, unknown>;
  preview_url?: string;
  thumbnail_url?: string;
}

export interface StylePreset {
  id: string;
  slug: string;
  name: string;
  color_family: string;
  typography_style: "classic" | "modern" | "minimal";
  font_heading: string;
  font_body: string;
  color_primary: string;
  color_accent: string;
  spacing_unit: string;
  is_active: boolean;
}

// A gallery-selectable "template" = one base Template x one StylePreset,
// computed by templateVariants.ts. Lightweight (no html/css) so the
// gallery can list hundreds of these without shipping template bodies.
export interface TemplateVariant {
  id: string; // "TMP-{baseSlug}-{presetSlug}", stable + human-readable
  baseTemplateId: string;
  baseSlug: string;
  presetId: string;
  presetSlug: string;
  name: string; // e.g. "Software Developer Fresher — Navy Classic"
  category?: string;
  colorFamily: string;
  typographyStyle: "classic" | "modern" | "minimal";
  isAtsSafe: boolean;
  atsLevel?: "excellent" | "good" | "moderate" | "creative";
  recommendedRoles?: string[];
  subcategory?: string;
  tags?: string[];
}

// ---- Student Information Model (resumes.content) ----

export interface PersonalInfo {
  full_name: string;
  target_role?: string;
  email: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  other_links?: string[];
}

export interface Education {
  degree: string;
  college: string;
  department?: string;
  university?: string;
  location?: string;
  start_year?: string;
  expected_graduation?: string;
  cgpa_or_percentage?: string;
  relevant_coursework?: string[];
}

export interface Project {
  name: string;
  problem?: string;
  solution?: string;
  technologies: string[];
  contribution?: string;
  features?: string[];
  result?: string; // must be evidence-backed — Truth Guard enforces this
  github_url?: string;
  live_url?: string;
}

export interface Internship {
  company: string;
  role: string;
  duration: string;
  responsibilities: string[];
  technologies?: string[];
  achievements?: string[];
  evidence?: string; // link/reference back to portfolio source
}

export interface Certification {
  certificate: string;
  issuer: string;
  date?: string;
  credential_id?: string;
  credential_url?: string;
}

export interface Achievement {
  category: "hackathon" | "competition" | "award" | "coding_contest" | "academic" | "open_source" | "research";
  title: string;
  description?: string;
  date?: string;
}

export interface Activity {
  organization: string;
  role: string;
  description?: string;
}

export type SectionKey =
  | "education"
  | "skills"
  | "projects"
  | "internships"
  | "certifications"
  | "achievements"
  | "activities";

export const ALL_SECTIONS: SectionKey[] = [
  "education",
  "skills",
  "projects",
  "internships",
  "certifications",
  "achievements",
  "activities",
];

export const SECTION_LABELS: Record<SectionKey, string> = {
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  internships: "Internships",
  certifications: "Certifications",
  achievements: "Achievements",
  activities: "Leadership & Activities",
};

export interface ResumeContent {
  personal: PersonalInfo;
  education: Education[];
  skills: Record<string, string[]>; // category -> skills, e.g. "programming": ["Python"]
  projects: Project[];
  internships: Internship[];
  certifications: Certification[];
  achievements: Achievement[];
  activities: Activity[];
  /** Section display order (added in Phase 3 for drag-and-drop reordering); optional
   * so pre-Phase-3 rows / freshly AI-structured content without it still validate. */
  sectionOrder?: SectionKey[];
  sectionLabels?: Partial<Record<SectionKey, string>>;
}

export interface StyleOverrides {
  fontHeading?: string;
  fontBody?: string;
  colorPrimary?: string;
  colorAccent?: string;
  spacingUnit?: string;
  headingSize?: string;
  bodySize?: string;
  lineHeight?: string;
  sectionSpacing?: string;
  pageMargin?: string;
  backgroundColor?: string;
  textColor?: string;
}

export interface Resume {
  id: string;
  user_id: string;
  portfolio_id?: string;
  template_id?: string;
  title: string;
  target_job_role?: string;
  job_description?: string;
  content: ResumeContent;
  style_overrides?: StyleOverrides;
  ats_score?: number;
  status: "draft" | "reviewed" | "finalized";
}

export interface ResumeVersion {
  id: string;
  resume_id: string;
  version_number: number;
  content_snapshot: ResumeContent;
  change_summary?: string;
  created_at: string;
}
