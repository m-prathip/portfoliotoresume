import Handlebars from "handlebars";
import { ALL_SECTIONS, ResumeContent, StyleOverrides, TemplateDetail } from "@/types/resume";

let helpersRegistered = false;

function registerHelpers() {
  if (helpersRegistered) return;
  Handlebars.registerHelper("eq", (a: unknown, b: unknown) => a === b);
  Handlebars.registerHelper("join", (arr: unknown, sep: string) => (Array.isArray(arr) ? arr.join(sep) : ""));
  helpersRegistered = true;
}

/**
 * Builds the data object passed into the Handlebars template. This is the
 * bridge between the semantic layer (ResumeContent, edited via forms/canvas)
 * and the visual layer (the template's HTML structure) — templates only
 * ever see this shape, never raw app state.
 */
function buildTemplateData(content: ResumeContent) {
  const skillGroups = Object.entries(content.skills || {}).map(([category, items]) => ({
    category,
    items: items.join(", "),
  }));

  return {
    personal: content.personal,
    education: content.education,
    skillGroups,
    projects: content.projects,
    internships: content.internships,
    certifications: content.certifications,
    achievements: content.achievements,
    activities: content.activities,
    sectionLabels: content.sectionLabels ?? { education: "Education", skills: "Skills", projects: "Projects", internships: "Experience & Internships", certifications: "Certifications", achievements: "Achievements", activities: "Leadership & Activities" },
    sections: content.sectionOrder?.length ? content.sectionOrder : ALL_SECTIONS,
  };
}

/** Converts StyleOverrides into inline CSS custom-property declarations. */
function buildStyleVariables(overrides: StyleOverrides): string {
  const vars: string[] = [];
  if (overrides.fontHeading) vars.push(`--user-font-heading: ${overrides.fontHeading};`);
  if (overrides.fontBody) vars.push(`--user-font-body: ${overrides.fontBody};`);
  if (overrides.colorPrimary) vars.push(`--user-color-primary: ${overrides.colorPrimary};`);
  if (overrides.colorAccent) vars.push(`--user-color-accent: ${overrides.colorAccent};`);
  if (overrides.spacingUnit) vars.push(`--user-spacing-unit: ${overrides.spacingUnit};`);
  if (overrides.headingSize) vars.push(`--user-heading-size: ${overrides.headingSize};`);
  if (overrides.bodySize) vars.push(`--user-body-size: ${overrides.bodySize};`);
  if (overrides.lineHeight) vars.push(`--user-line-height: ${overrides.lineHeight};`);
  if (overrides.sectionSpacing) vars.push(`--user-section-spacing: ${overrides.sectionSpacing};`);
  if (overrides.pageMargin) vars.push(`--user-page-margin: ${overrides.pageMargin};`);
  if (overrides.backgroundColor) vars.push(`--user-background: ${overrides.backgroundColor};`);
  if (overrides.textColor) vars.push(`--user-text-color: ${overrides.textColor};`);
  return vars.join(" ");
}

export interface RenderedResume {
  /** Full standalone HTML document, suitable for an iframe srcDoc or (Phase 4) headless-Chromium PDF rendering. */
  html: string;
}

/**
 * Renders a template + resume content + style overrides into a full HTML
 * document. This same function is the contract Phase 4's PDF pipeline will
 * reuse server-side — templates and the render call never change between
 * "live preview" and "final export", only the environment executing them.
 */
export function renderResume(
  template: TemplateDetail,
  content: ResumeContent,
  styleOverrides: StyleOverrides = {},
): RenderedResume {
  registerHelpers();

  const compiled = Handlebars.compile(template.html_template, { noEscape: false });
  const bodyHtml = compiled(buildTemplateData(content));
  const styleVarBlock = buildStyleVariables(styleOverrides);

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; background: #f1f5f9; }
      .resume-page-wrapper { background: #ffffff; ${styleVarBlock} }
      ${template.css_styles}
    </style>
  </head>
  <body>
    <div class="resume-page-wrapper">
      ${bodyHtml}
    </div>
  </body>
</html>`;

  return { html };
}
