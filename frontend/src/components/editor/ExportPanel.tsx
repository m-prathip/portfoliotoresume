"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useEditorStore } from "@/store/resumeStore";
import { AtsReport } from "@/types/resume";

const SEVERITY_STYLES: Record<string, string> = {
  error: "border-red-200 bg-red-50 text-red-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  info: "border-slate-200 bg-slate-50 text-slate-600",
};

/**
 * Runs Phase 4's ATS diagnostics (GET /resumes/:id/ats-report) on demand —
 * not on every keystroke, since it renders through headless Chromium on the
 * backend — and downloads the final PDF via GET /resumes/:id/export.
 */
export function ExportPanel() {
  const resumeId = useEditorStore((s) => s.resumeId);
  const isDirty = useEditorStore((s) => s.isDirty);
  const [report, setReport] = useState<AtsReport | null>(null);
  const [checking, setChecking] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runCheck = async () => {
    if (!resumeId) return;
    setChecking(true);
    setError(null);
    try {
      const { atsReport } = await api.getAtsReport(resumeId);
      setReport(atsReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ATS check failed");
    } finally {
      setChecking(false);
    }
  };

  const downloadPdf = async () => {
    if (!resumeId) return;
    setExporting(true);
    setError(null);
    try {
      const res = await fetch(api.exportPdfUrl(resumeId));
      if (!res.ok) throw new Error(`Export failed: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "resume.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-700">ATS Check &amp; Export</h3>

      {isDirty && (
        <p className="mb-2 text-xs text-amber-600">Save in progress — results reflect the last saved version.</p>
      )}

      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={runCheck}
          disabled={!resumeId || checking}
          className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400 disabled:opacity-50"
        >
          {checking ? "Checking…" : "Run ATS check"}
        </button>
        <button
          type="button"
          onClick={downloadPdf}
          disabled={!resumeId || exporting}
          className="flex-1 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {exporting ? "Exporting…" : "Download PDF"}
        </button>
      </div>

      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}

      {report && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700">
              Score: {report.score}/100 · {report.pageCount} page{report.pageCount === 1 ? "" : "s"}
            </span>
            <span className={report.passed ? "text-emerald-600" : "text-red-600"}>
              {report.passed ? "No blocking issues" : "Needs attention"}
            </span>
          </div>
          {report.flags.length === 0 ? (
            <p className="text-xs text-slate-500">No issues found.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {report.flags.map((f, i) => (
                <li key={i} className={`rounded-md border px-2 py-1.5 text-xs ${SEVERITY_STYLES[f.severity]}`}>
                  {f.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
