// Mirrors backend/src/types/index.ts's ResumeContent. Frontend and backend
// are separate npm projects (no shared workspace set up yet), so this is
// intentionally a duplicate — keep the two in sync by hand for now.

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
  result?: string;
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
  evidence?: string;
}

export interface Certification {
  certificate: string;
  issuer: string;
  date?: string;
  credential_id?: string;
  credential_url?: string;
}

export type AchievementCategory =
  | "hackathon"
  | "competition"
  | "award"
  | "coding_contest"
  | "academic"
  | "open_source"
  | "research";

export interface Achievement {
  category: AchievementCategory;
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
  skills: Record<string, string[]>;
  projects: Project[];
  internships: Internship[];
  certifications: Certification[];
  achievements: Achievement[];
  activities: Activity[];

  /** Optional custom labels for resume sections. */
  sectionLabels?: Partial<Record<SectionKey, string>>;

  /** Display order of resume sections. */
  sectionOrder: SectionKey[];
}

export interface StyleOverrides {
  /** Heading font family. */
  fontHeading?: string;

  /** Body font family. */
  fontBody?: string;

  /** Resume heading font size, e.g. "22px"–"32px". */
  headingSize?: string;

  /** Resume body font size, e.g. "10px"–"14px". */
  bodySize?: string;

  /** Resume line height, e.g. "1.25"–"1.65". */
  lineHeight?: string;

  /** Spacing between resume sections, e.g. "12px"–"30px". */
  sectionSpacing?: string;

  /** Page margin, e.g. "20px"–"38px". */
  pageMargin?: string;

  /** Primary resume color. */
  colorPrimary?: string;

  /** Accent color. */
  colorAccent?: string;

  /** Main resume text color. */
  textColor?: string;

  /** Resume page background color. */
  backgroundColor?: string;

  /** Base spacing unit, e.g. "14px". */
  spacingUnit?: string;
}

export interface Resume {
  id: string;
  user_id: string;
  portfolio_id?: string | null;
  template_id?: string | null;
  title: string;
  target_job_role?: string | null;
  job_description?: string | null;
  content: ResumeContent;
  style_overrides?: StyleOverrides;
  ats_score?: number | null;
  status: "draft" | "reviewed" | "finalized";
}

export interface Template {
  id: string;
  name: string;
  slug: string;
  category?: string;
  description?: string;
  is_ats_safe: boolean;
}

// One selectable gallery item: a base layout x style preset combination.
// Returned by GET /api/templates (paginated/filtered) — never carries
// html/css, so the gallery can list hundreds of these cheaply.
export interface TemplateVariant {
  id: string;
  baseTemplateId: string;
  baseSlug: string;
  presetId: string;
  presetSlug: string;
  name: string;
  category?: string;
  colorFamily: string;
  typographyStyle: "classic" | "modern" | "minimal";
  isAtsSafe: boolean;
  atsLevel?: "excellent" | "good" | "moderate" | "creative";
  recommendedRoles?: string[];
  subcategory?: string;
  tags?: string[];
}

export interface TemplateVariantCatalog {
  variants: TemplateVariant[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TemplateFacets {
  categories: string[];
  subcategories: string[];
  roles: string[];
  atsLevels: string[];
  colorFamilies: string[];
  typographyStyles: string[];
  totalVariants: number;
}

// What Canvas.tsx actually renders — only ever html_template/css_styles.
export interface TemplateDetail {
  id: string;
  slug: string;
  html_template: string;
  css_styles: string;
}

// GET /api/templates/:variantId response
export interface TemplateVariantDetail {
  variant: TemplateVariant;
  template: TemplateDetail;
  defaultStyleOverrides: StyleOverrides;
}

export interface AtsFlag {
  code: string;
  severity: "error" | "warning" | "info";
  message: string;
}

export interface AtsReport {
  passed: boolean;
  score: number;
  pageCount: number;
  flags: AtsFlag[];
}

export function emptyResumeContent(): ResumeContent {
  return {
    personal: {
      full_name: "",
      email: "",
    },
    education: [],
    skills: {},
    projects: [],
    internships: [],
    certifications: [],
    achievements: [],
    activities: [],
    sectionLabels: {},
    sectionOrder: [...ALL_SECTIONS],
  };
}