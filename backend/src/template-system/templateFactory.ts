import { SectionKey } from "../types";

export type LayoutType = "single-column" | "two-column";
export type SidebarSide = "left" | "right" | "none";
export type HeaderVariant = "left" | "center" | "split" | "compact" | "hero";
export type SectionTitleVariant = "rule" | "caps" | "bar" | "underline" | "plain";

export interface BaseTemplateConfig {
  templateId: string;
  templateName: string;
  slug: string;
  category: string;
  subcategory: string;
  description: string;
  layoutType: LayoutType;
  sidebar: SidebarSide;
  sidebarWidth: number;
  headerVariant: HeaderVariant;
  sectionTitleVariant: SectionTitleVariant;
  sectionOrder: SectionKey[];
  sidebarSections: SectionKey[];
  atsLevel: "excellent" | "good" | "moderate" | "creative";
  recommendedRoles: string[];
  tags: string[];
  license: {
    source: "original";
    author: "Portfolio Resume Platform";
    commercialUseAllowed: true;
    modificationAllowed: true;
    redistributionAllowed: true;
    attributionRequired: false;
  };
}

interface FamilyDefinition {
  key: string;
  category: string;
  subcategory: string;
  label: string;
  layoutType: LayoutType;
  sidebar: SidebarSide;
  sidebarWidth: number;
  headers: HeaderVariant[];
  titles: SectionTitleVariant[];
  orders: SectionKey[][];
  atsLevel: BaseTemplateConfig["atsLevel"];
  roles: string[];
  tags: string[];
}

const commonOrders: SectionKey[][] = [
  ["education", "skills", "projects", "internships", "certifications", "achievements", "activities"],
  ["education", "internships", "projects", "skills", "certifications", "achievements", "activities"],
  ["skills", "projects", "internships", "education", "certifications", "achievements", "activities"],
  ["projects", "skills", "education", "internships", "certifications", "achievements", "activities"],
  ["internships", "projects", "skills", "education", "certifications", "achievements", "activities"],
];

const techOrders: SectionKey[][] = [
  ["skills", "projects", "internships", "education", "certifications", "achievements", "activities"],
  ["projects", "skills", "education", "internships", "certifications", "achievements", "activities"],
  ["internships", "projects", "skills", "education", "certifications", "achievements", "activities"],
  ["education", "projects", "skills", "internships", "certifications", "achievements", "activities"],
];

const families: FamilyDefinition[] = [
  { key: "ats-minimal", category: "ats", subcategory: "ATS Minimal", label: "ATS Minimal", layoutType: "single-column", sidebar: "none", sidebarWidth: 0, headers: ["left", "center", "compact", "split", "hero"], titles: ["rule", "caps", "underline", "plain", "bar"], orders: commonOrders, atsLevel: "excellent", roles: ["All entry-level roles", "Software Developer", "Data Analyst"], tags: ["ats", "minimal", "single-column"] },
  { key: "ats-professional", category: "ats", subcategory: "ATS Professional", label: "ATS Professional", layoutType: "single-column", sidebar: "none", sidebarWidth: 0, headers: ["split", "left", "compact", "center", "hero"], titles: ["underline", "rule", "caps", "bar", "plain"], orders: commonOrders, atsLevel: "excellent", roles: ["Corporate", "Business Analyst", "Software Engineer"], tags: ["ats", "professional"] },
  { key: "ats-compact", category: "ats", subcategory: "ATS Compact", label: "ATS Compact", layoutType: "single-column", sidebar: "none", sidebarWidth: 0, headers: ["compact", "left", "split", "center", "hero"], titles: ["plain", "caps", "rule", "underline", "bar"], orders: commonOrders, atsLevel: "excellent", roles: ["Students", "Freshers", "Internships"], tags: ["ats", "compact"] },
  { key: "ats-technical", category: "ats", subcategory: "ATS Technical", label: "ATS Technical", layoutType: "two-column", sidebar: "left", sidebarWidth: 30, headers: ["left", "compact", "split", "center", "hero"], titles: ["caps", "rule", "underline", "plain", "bar"], orders: techOrders, atsLevel: "good", roles: ["Software Developer", "AI Engineer", "Data Engineer"], tags: ["ats", "technical", "two-column"] },
  { key: "ats-corporate", category: "ats", subcategory: "ATS Corporate", label: "ATS Corporate", layoutType: "single-column", sidebar: "none", sidebarWidth: 0, headers: ["center", "split", "left", "compact", "hero"], titles: ["bar", "rule", "underline", "caps", "plain"], orders: commonOrders, atsLevel: "excellent", roles: ["Finance", "Marketing", "HR", "Operations"], tags: ["ats", "corporate"] },

  { key: "student-engineering", category: "student", subcategory: "Engineering Fresher", label: "Engineering Fresher", layoutType: "two-column", sidebar: "left", sidebarWidth: 32, headers: ["left", "hero", "compact", "split", "center"], titles: ["bar", "caps", "rule", "underline", "plain"], orders: commonOrders, atsLevel: "good", roles: ["Engineering Fresher", "Campus Placement"], tags: ["student", "engineering", "fresher"] },
  { key: "student-internship", category: "student", subcategory: "Internship Resume", label: "Internship Resume", layoutType: "single-column", sidebar: "none", sidebarWidth: 0, headers: ["left", "split", "compact", "hero", "center"], titles: ["rule", "underline", "caps", "plain", "bar"], orders: techOrders, atsLevel: "excellent", roles: ["Internship", "Summer Internship"], tags: ["student", "internship"] },
  { key: "student-campus", category: "student", subcategory: "Campus Placement", label: "Campus Placement", layoutType: "two-column", sidebar: "right", sidebarWidth: 31, headers: ["center", "left", "split", "compact", "hero"], titles: ["underline", "bar", "rule", "caps", "plain"], orders: commonOrders, atsLevel: "good", roles: ["Campus Placement", "Graduate"], tags: ["student", "campus"] },
  { key: "student-minimal", category: "student", subcategory: "College Minimal", label: "College Minimal", layoutType: "single-column", sidebar: "none", sidebarWidth: 0, headers: ["center", "left", "compact", "split", "hero"], titles: ["plain", "underline", "rule", "caps", "bar"], orders: commonOrders, atsLevel: "excellent", roles: ["College Student", "Graduate"], tags: ["student", "minimal"] },
  { key: "student-project", category: "student", subcategory: "Project First", label: "Project First", layoutType: "two-column", sidebar: "left", sidebarWidth: 34, headers: ["hero", "left", "split", "compact", "center"], titles: ["bar", "rule", "caps", "underline", "plain"], orders: techOrders, atsLevel: "good", roles: ["Project-heavy Fresher", "Hackathon Student"], tags: ["student", "projects"] },

  { key: "tech-software", category: "technology", subcategory: "Software Developer", label: "Software Developer", layoutType: "two-column", sidebar: "left", sidebarWidth: 30, headers: ["split", "left", "hero", "compact", "center"], titles: ["caps", "bar", "underline", "rule", "plain"], orders: techOrders, atsLevel: "good", roles: ["Software Developer", "Full Stack Developer", "Backend Developer"], tags: ["technology", "software"] },
  { key: "tech-ai", category: "technology", subcategory: "AI & ML", label: "AI & ML", layoutType: "two-column", sidebar: "right", sidebarWidth: 32, headers: ["left", "hero", "split", "center", "compact"], titles: ["rule", "bar", "caps", "underline", "plain"], orders: techOrders, atsLevel: "good", roles: ["AI Engineer", "Machine Learning Engineer", "Data Scientist"], tags: ["technology", "ai", "machine-learning"] },
  { key: "tech-data", category: "technology", subcategory: "Data Analytics", label: "Data Analytics", layoutType: "single-column", sidebar: "none", sidebarWidth: 0, headers: ["split", "left", "compact", "hero", "center"], titles: ["underline", "rule", "bar", "caps", "plain"], orders: techOrders, atsLevel: "excellent", roles: ["Data Analyst", "Data Scientist", "Business Analyst"], tags: ["technology", "data"] },
  { key: "tech-cloud", category: "technology", subcategory: "Cloud & DevOps", label: "Cloud & DevOps", layoutType: "two-column", sidebar: "left", sidebarWidth: 29, headers: ["compact", "split", "left", "hero", "center"], titles: ["caps", "underline", "rule", "bar", "plain"], orders: techOrders, atsLevel: "good", roles: ["Cloud Engineer", "DevOps Engineer", "Site Reliability Engineer"], tags: ["technology", "cloud", "devops"] },

  { key: "business-analyst", category: "business", subcategory: "Business Analyst", label: "Business Analyst", layoutType: "single-column", sidebar: "none", sidebarWidth: 0, headers: ["center", "split", "left", "hero", "compact"], titles: ["underline", "rule", "plain", "bar", "caps"], orders: commonOrders, atsLevel: "excellent", roles: ["Business Analyst", "Consulting", "Operations"], tags: ["business", "analyst"] },
  { key: "business-corporate", category: "business", subcategory: "Corporate Graduate", label: "Corporate Graduate", layoutType: "two-column", sidebar: "right", sidebarWidth: 30, headers: ["center", "left", "split", "hero", "compact"], titles: ["bar", "rule", "underline", "caps", "plain"], orders: commonOrders, atsLevel: "good", roles: ["Finance", "Marketing", "HR", "Management"], tags: ["business", "corporate"] },

  { key: "creative-modern", category: "creative", subcategory: "Modern Creative", label: "Modern Creative", layoutType: "two-column", sidebar: "left", sidebarWidth: 35, headers: ["hero", "center", "left", "split", "compact"], titles: ["bar", "plain", "caps", "underline", "rule"], orders: commonOrders, atsLevel: "moderate", roles: ["Designer", "UI/UX Designer", "Creative Professional"], tags: ["creative", "modern"] },
  { key: "creative-portfolio", category: "creative", subcategory: "Portfolio Style", label: "Portfolio Style", layoutType: "two-column", sidebar: "right", sidebarWidth: 33, headers: ["hero", "left", "center", "split", "compact"], titles: ["plain", "bar", "underline", "caps", "rule"], orders: commonOrders, atsLevel: "moderate", roles: ["UI/UX Designer", "Product Designer", "Creative Developer"], tags: ["creative", "portfolio"] },

  { key: "academic-research", category: "academic", subcategory: "Research", label: "Research", layoutType: "single-column", sidebar: "none", sidebarWidth: 0, headers: ["left", "center", "split", "compact", "hero"], titles: ["rule", "underline", "caps", "plain", "bar"], orders: [["education", "projects", "internships", "skills", "certifications", "achievements", "activities"], ["education", "skills", "projects", "achievements", "certifications", "internships", "activities"], ...commonOrders.slice(2)], atsLevel: "good", roles: ["Research Intern", "Graduate Researcher", "Academic"], tags: ["academic", "research"] },

  { key: "international-global", category: "international", subcategory: "International", label: "International", layoutType: "single-column", sidebar: "none", sidebarWidth: 0, headers: ["left", "center", "split", "hero", "compact"], titles: ["underline", "rule", "bar", "plain", "caps"], orders: commonOrders, atsLevel: "excellent", roles: ["International Graduate", "Global Entry-Level"], tags: ["international", "global"] },
];

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function escapeCss(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "");
}

function sectionLabel(key: SectionKey) {
  return ({ education: "Education", skills: "Skills", projects: "Projects", internships: "Experience & Internships", certifications: "Certifications", achievements: "Achievements", activities: "Leadership & Activities" } as Record<SectionKey, string>)[key];
}

function sectionMarkup(key: SectionKey) {
  const label = `{{lookup sectionLabels "${key}"}}`;
  if (key === "education") return `<section class="section"><h2>${label}</h2>{{#each education}}<article class="entry"><div class="entry-row"><strong>{{this.degree}}</strong><span class="dates">{{this.start_year}} – {{this.expected_graduation}}</span></div><div class="entry-sub">{{this.college}}{{#if this.university}}, {{this.university}}{{/if}}</div>{{#if this.department}}<div class="entry-detail">{{this.department}}</div>{{/if}}{{#if this.cgpa_or_percentage}}<div class="entry-detail">CGPA/Percentage: {{this.cgpa_or_percentage}}</div>{{/if}}</article>{{/each}}</section>`;
  if (key === "skills") return `<section class="section"><h2>${label}</h2>{{#each skillGroups}}<div class="skill-row"><strong>{{this.category}}</strong><span>{{this.items}}</span></div>{{/each}}</section>`;
  if (key === "projects") return `<section class="section"><h2>${label}</h2>{{#each projects}}<article class="entry"><div class="entry-row"><strong>{{this.name}}</strong>{{#if this.github_url}}<span class="dates">{{this.github_url}}</span>{{/if}}</div>{{#if this.solution}}<p class="entry-desc">{{this.solution}}</p>{{/if}}{{#if this.technologies.length}}<div class="entry-detail">{{join this.technologies ", "}}</div>{{/if}}{{#if this.result}}<div class="entry-detail">{{this.result}}</div>{{/if}}</article>{{/each}}</section>`;
  if (key === "internships") return `<section class="section"><h2>${label}</h2>{{#each internships}}<article class="entry"><div class="entry-row"><strong>{{this.role}}</strong><span class="dates">{{this.duration}}</span></div><div class="entry-sub">{{this.company}}</div><ul>{{#each this.responsibilities}}<li>{{this}}</li>{{/each}}</ul></article>{{/each}}</section>`;
  if (key === "certifications") return `<section class="section"><h2>${label}</h2>{{#each certifications}}<div class="entry-row"><span><strong>{{this.certificate}}</strong> — {{this.issuer}}</span><span class="dates">{{this.date}}</span></div>{{/each}}</section>`;
  if (key === "achievements") return `<section class="section"><h2>${label}</h2><ul>{{#each achievements}}<li><strong>{{this.title}}</strong>{{#if this.description}} — {{this.description}}{{/if}}</li>{{/each}}</ul></section>`;
  return `<section class="section"><h2>${label}</h2>{{#each activities}}<div class="entry-row"><strong>{{this.role}}</strong><span>{{this.organization}}</span></div>{{#if this.description}}<div class="entry-detail">{{this.description}}</div>{{/if}}{{/each}}</section>`;
}

function renderHeader(variant: HeaderVariant) {
  const base = `<h1 class="name">{{personal.full_name}}</h1>{{#if personal.target_role}}<div class="target-role">{{personal.target_role}}</div>{{/if}}<div class="contact-line">{{#if personal.email}}<span>{{personal.email}}</span>{{/if}}{{#if personal.phone}}<span>{{personal.phone}}</span>{{/if}}{{#if personal.location}}<span>{{personal.location}}</span>{{/if}}{{#if personal.linkedin}}<span>{{personal.linkedin}}</span>{{/if}}{{#if personal.github}}<span>{{personal.github}}</span>{{/if}}{{#if personal.portfolio}}<span>{{personal.portfolio}}</span>{{/if}}</div>`;
  return `<header class="header header-${variant}">${base}</header>`;
}

export function buildTemplateHtml(config: BaseTemplateConfig) {
  const sidebarSet = new Set(config.sidebarSections);
  const sidebarMarkup = config.sidebar === "none" ? "" : config.sidebarSections.map(sectionMarkup).join("\n");
  const mainMarkup = config.sectionOrder.filter((s) => !sidebarSet.has(s)).map(sectionMarkup).join("\n");

  if (config.layoutType === "two-column") {
    return `<div class="resume layout-two" data-template="${config.slug}">${renderHeader(config.headerVariant)}<div class="resume-grid ${config.sidebar === "right" ? "sidebar-right" : "sidebar-left"}"><aside class="sidebar">${sidebarMarkup}</aside><main class="main">${mainMarkup}</main></div></div>`;
  }
  return `<div class="resume layout-single" data-template="${config.slug}">${renderHeader(config.headerVariant)}<main class="main">${mainMarkup}</main></div>`;
}

export function buildTemplateCss(config: BaseTemplateConfig) {
  const id = escapeCss(config.slug);
  const width = config.layoutType === "two-column" ? config.sidebarWidth : 100;
  const title = config.sectionTitleVariant;
  return `
.resume[data-template="${id}"]{--font-heading:var(--user-font-heading,'Inter',Arial,sans-serif);--font-body:var(--user-font-body,'Inter',Arial,sans-serif);--color-primary:var(--user-color-primary,#111827);--color-accent:var(--user-color-accent,#2563eb);--color-muted:#64748b;--spacing-unit:var(--user-spacing-unit,12px);font-family:var(--font-body);color:var(--color-primary);max-width:820px;margin:0 auto;padding:var(--user-page-margin,30px);font-size:var(--user-body-size,12px);line-height:var(--user-line-height,1.42);background:var(--user-background,#fff);color:var(--user-text-color,var(--color-primary));}
.resume[data-template="${id}"] .header{margin-bottom:calc(var(--spacing-unit)*1.25);padding-bottom:10px;}
.resume[data-template="${id}"] .header-center{text-align:center}.resume[data-template="${id}"] .header-left{text-align:left}.resume[data-template="${id}"] .header-split .contact-line{max-width:80%}.resume[data-template="${id}"] .header-compact .name{font-size:22px}.resume[data-template="${id}"] .header-hero{padding:16px 0}.resume[data-template="${id}"] .name{font-family:var(--font-heading);font-size:var(--user-heading-size,27px);line-height:1.05;margin:0 0 4px;letter-spacing:-.3px}.resume[data-template="${id}"] .target-role{color:var(--color-accent);font-weight:700;margin-bottom:5px}.resume[data-template="${id}"] .contact-line{display:flex;flex-wrap:wrap;gap:4px 10px;color:var(--color-muted);font-size:10.5px}.resume[data-template="${id}"] .contact-line span:not(:last-child)::after{content:'•';margin-left:10px;color:var(--color-accent)}
.resume[data-template="${id}"] .resume-grid{display:grid;grid-template-columns:${width}% ${100-width}%;gap:22px}.resume[data-template="${id}"] .sidebar-right{grid-template-columns:${100-width}% ${width}%}.resume[data-template="${id}"] .sidebar-right .sidebar{order:2}.resume[data-template="${id}"] .sidebar-right .main{order:1}.resume[data-template="${id}"] .sidebar{padding-right:4px}.resume[data-template="${id}"] .main{min-width:0}
.resume[data-template="${id}"] .section{margin-bottom:var(--user-section-spacing,calc(var(--spacing-unit)*.95));break-inside:avoid}.resume[data-template="${id}"] .section h2{font-family:var(--font-heading);font-size:12.5px;margin:0 0 7px;color:var(--color-primary);font-weight:800;${title === "rule" ? "border-bottom:1.4px solid var(--color-primary);padding-bottom:3px;" : ""}${title === "underline" ? "text-decoration:underline;text-decoration-color:var(--color-accent);text-underline-offset:4px;" : ""}${title === "caps" ? "text-transform:uppercase;letter-spacing:1px;" : ""}${title === "bar" ? "border-left:4px solid var(--color-accent);padding-left:7px;" : ""}}
.resume[data-template="${id}"] .entry{margin-bottom:8px}.resume[data-template="${id}"] .entry-row{display:flex;justify-content:space-between;gap:12px;align-items:baseline}.resume[data-template="${id}"] .entry-sub{color:var(--color-muted);font-style:italic}.resume[data-template="${id}"] .entry-detail,.resume[data-template="${id}"] .dates{font-size:10.5px;color:var(--color-muted)}.resume[data-template="${id}"] .entry-desc{margin:3px 0}.resume[data-template="${id}"] ul{margin:4px 0;padding-left:16px}.resume[data-template="${id}"] li{margin-bottom:2px}.resume[data-template="${id}"] .skill-row{display:grid;grid-template-columns:minmax(70px,35%) 1fr;gap:6px;margin-bottom:4px;font-size:10.8px}
.resume[data-template="${id}"] .layout-two .header{margin-bottom:12px}.resume[data-template="${id}"] .layout-two .header + .layout-two{margin-top:0}.resume[data-template="${id}"] .sidebar .section h2{font-size:11px}.resume[data-template="${id}"] .sidebar .section{margin-bottom:10px}
@media print{.resume[data-template="${id}"]{width:100%;max-width:none;margin:0;padding:28px 30px}.resume[data-template="${id}"] .section,.resume[data-template="${id}"] .entry{break-inside:avoid}}
`;
}

export function generateBaseTemplateConfigs(): BaseTemplateConfig[] {
  const configs: BaseTemplateConfig[] = [];
  let sequence = 1;
  for (const family of families) {
    for (let variant = 0; variant < 10; variant += 1) {
      const headerVariant = family.headers[variant % family.headers.length];
      const titleVariant = family.titles[variant % family.titles.length];
      const order = family.orders[variant % family.orders.length];
      const sidebarSections = family.layoutType === "two-column"
        ? (variant % 3 === 0 ? ["skills", "certifications", "activities"] : variant % 3 === 1 ? ["skills", "achievements", "certifications"] : ["education", "skills", "certifications"]) as SectionKey[]
        : [];
      const ordinal = String(sequence).padStart(3, "0");
      const slug = `${family.key}-${String(variant + 1).padStart(2, "0")}`;
      configs.push({
        templateId: `BASE-${ordinal}`,
        templateName: `${family.label} ${variant + 1}`,
        slug,
        category: family.category,
        subcategory: family.subcategory,
        description: `Original ${family.label.toLowerCase()} layout with ${family.layoutType === "two-column" ? `${family.sidebarWidth}% sidebar` : "single-column"} hierarchy and ${titleVariant} section treatment.`,
        layoutType: family.layoutType,
        sidebar: family.sidebar,
        sidebarWidth: family.sidebarWidth,
        headerVariant,
        sectionTitleVariant: titleVariant,
        sectionOrder: order,
        sidebarSections,
        atsLevel: family.atsLevel,
        recommendedRoles: family.roles,
        tags: [...family.tags, `variant-${variant + 1}`],
        license: { source: "original", author: "Portfolio Resume Platform", commercialUseAllowed: true, modificationAllowed: true, redistributionAllowed: true, attributionRequired: false },
      });
      sequence += 1;
    }
  }
  return configs;
}

export function buildGeneratedTemplate(config: BaseTemplateConfig) {
  return { config, htmlTemplate: buildTemplateHtml(config), cssStyles: buildTemplateCss(config) };
}

export function expectedBaseTemplateCount() { return families.length * 10; }
