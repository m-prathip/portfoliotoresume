import { Router } from "express";
import { exportResumeToPdf, getAtsReport } from "../services/resumeExport";
import { PdfRenderError } from "../services/pdfRenderer";
import { ApiError } from "../middleware/errorHandler";

export const exportRouter = Router();

// GET /api/resumes/:id/ats-report — diagnostics only, no file produced.
exportRouter.get("/:id/ats-report", async (req, res, next) => {
  try {
    const report = await getAtsReport(req.params.id);
    res.json({ atsReport: report });
  } catch (err) {
    if (err instanceof PdfRenderError) return next(new ApiError(500, err.message));
    next(err);
  }
});

// GET /api/resumes/:id/export — renders + downloads the final PDF.
// ATS summary is attached as response headers so the client doesn't need a
// second request to show a quick pass/fail + score after download.
exportRouter.get("/:id/export", async (req, res, next) => {
  try {
    const { buffer, atsReport } = await exportResumeToPdf(req.params.id);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="resume.pdf"`);
    res.setHeader("X-Ats-Passed", String(atsReport.passed));
    res.setHeader("X-Ats-Score", String(atsReport.score));
    res.setHeader("X-Ats-Page-Count", String(atsReport.pageCount));
    res.setHeader("Access-Control-Expose-Headers", "X-Ats-Passed, X-Ats-Score, X-Ats-Page-Count");
    res.send(buffer);
  } catch (err) {
    if (err instanceof PdfRenderError) return next(new ApiError(500, err.message));
    next(err);
  }
});
