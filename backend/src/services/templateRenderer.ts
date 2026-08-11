import Handlebars from "handlebars";
import { ALL_SECTIONS, ResumeContent, SectionKey, StyleOverrides } from "../types";

export interface TemplateRecord {
  html_template: string;
  css_styles: string;
}

let helpersRegistered = false;

function registerHelpers() {
  if (helpersRegistered) return;
  Handlebars.registerHelper("eq", (a: unknown, b: unknown) => a === b);
  Handlebars.registerHelper("join", (arr: unknown, sep: string) => (Array.isArray(arr) ? arr.join(sep) : ""));
  helpersRegistered = true;
}

/**
 * Same bridge as frontend/src/lib/templateRenderer.ts's buildTemplateData —
 * kept in sync by hand since frontend/backend are separate npm projects.
 * Any template change must be mirrored in both.
 */
function buildTemplateData(content: ResumeContent) {
  const skillGroups = Object.entries(content.skills || {}).map(([category, items]) => ({
    category,
    items: items.join(", "),
  }));

  const sections: SectionKey[] = content.sectionOrder && content.sectionOrder.length > 0 ? content.sectionOrder : ALL_SECTIONS;

  return {
    personal: content.personal,
    education: content.education,
    skillGroups,
    projects: content.projects,
    internships: content.internships,
    certifications: content.certifications,
    achievements: content.achievements,
    activities: content.activities,
    sectionLabels: content.sectionLabels ?? {
      education: "Education", skills: "Skills", projects: "Projects", internships: "Experience & Internships",
      certifications: "Certifications", achievements: "Achievements", activities: "Leadership & Activities",
    },
    sections,
  };
}

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

/**
 * Renders template + content + style overrides into a full, print-ready
 * HTML document. Adds @page/print CSS on top of what the browser-preview
 * version needs, since this output feeds Headless Chromium's page.pdf(),
 * not an iframe. Keep this function's *data contract* identical to the
 * frontend renderer — same template, same output shape, different consumer.
 */
export function renderResumeHtml(
  template: TemplateRecord,
  content: ResumeContent,
  styleOverrides: StyleOverrides = {},
): string {
  registerHelpers();

  const compiled = Handlebars.compile(template.html_template, { noEscape: false });
  const bodyHtml = compiled(buildTemplateData(content));
  const styleVarBlock = buildStyleVariables(styleOverrides);

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      * { box-sizing: border-box; }
      @page { size: Letter; margin: 0; }
      html, body { margin: 0; padding: 0; background: #ffffff; }
      .resume-page-wrapper { ${styleVarBlock} }
      ${template.css_styles}
    </style>
  </head>
  <body>
    <div class="resume-page-wrapper">
      ${bodyHtml}
    </div>
  </body>
</html>`;
}
