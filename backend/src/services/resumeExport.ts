import { pool } from "../db/pool";
import { ApiError } from "../middleware/errorHandler";
import { renderResumeHtml } from "./templateRenderer";
import { renderHtmlToPdf } from "./pdfRenderer";
import { runStaticAtsChecks, buildAtsReport, AtsReport } from "./atsValidator";
import { ResumeContent, StyleOverrides } from "../types";

interface ResumeRow {
  id: string;
  content: ResumeContent;
  style_overrides: StyleOverrides;
  template_id: string | null;
}

interface TemplateRow {
  html_template: string;
  css_styles: string;
}

async function loadResumeAndTemplate(resumeId: string): Promise<{ resume: ResumeRow; template: TemplateRow }> {
  const { rows: resumeRows } = await pool.query(
    `SELECT id, content, style_overrides, template_id FROM resumes WHERE id = $1`,
    [resumeId],
  );
  if (resumeRows.length === 0) throw new ApiError(404, "Resume not found");
  const resume = resumeRows[0] as ResumeRow;

  if (!resume.template_id) {
    throw new ApiError(422, "Resume has no template selected — pick a template in the editor first");
  }

  const { rows: templateRows } = await pool.query(
    `SELECT html_template, css_styles FROM templates WHERE id = $1 AND is_active = true`,
    [resume.template_id],
  );
  if (templateRows.length === 0) throw new ApiError(404, "Resume's template not found or inactive");

  return { resume, template: templateRows[0] as TemplateRow };
}

/**
 * Renders the resume + runs headless-Chromium PDF generation in one pass,
 * then builds the full ATS report using that same render's page count —
 * avoids rendering twice for the common "download" case.
 */
export async function exportResumeToPdf(resumeId: string): Promise<{ buffer: Buffer; atsReport: AtsReport }> {
  const { resume, template } = await loadResumeAndTemplate(resumeId);

  const html = renderResumeHtml(template, resume.content, resume.style_overrides ?? {});
  const staticFlags = runStaticAtsChecks(html, resume.content);
  const { buffer, pageCount } = await renderHtmlToPdf(html);
  const atsReport = buildAtsReport(staticFlags, pageCount);

  // Persist the latest score for quick display elsewhere (resume list, etc.)
  await pool.query(`UPDATE resumes SET ats_score = $1 WHERE id = $2`, [atsReport.score, resumeId]);

  return { buffer, atsReport };
}

/**
 * ATS diagnostics without downloading a PDF. Still renders through headless
 * Chromium to get an accurate page count — for an MVP this is an acceptable
 * cost; a production version would cache the last render or debounce calls.
 */
export async function getAtsReport(resumeId: string): Promise<AtsReport> {
  const { resume, template } = await loadResumeAndTemplate(resumeId);

  const html = renderResumeHtml(template, resume.content, resume.style_overrides ?? {});
  const staticFlags = runStaticAtsChecks(html, resume.content);
  const { pageCount } = await renderHtmlToPdf(html);

  return buildAtsReport(staticFlags, pageCount);
}
