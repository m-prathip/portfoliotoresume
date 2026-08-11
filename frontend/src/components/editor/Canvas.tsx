"use client";

import { useEffect, useMemo, useRef } from "react";
import { useEditorStore } from "@/store/resumeStore";
import { renderResume } from "@/lib/templateRenderer";

/**
 * Renders the current resume into an isolated iframe so the template's own
 * CSS never leaks into (or is affected by) the editor chrome around it —
 * this is the "visual layer" half of the hybrid editor. Direct text editing
 * happens in the structured field panels (SectionList's item editors), not
 * inside this iframe, since contentEditable inside a cross-document iframe
 * is unreliable to sync back into React state; the live preview here always
 * reflects the semantic layer a moment after each edit.
 */
export function Canvas() {
  const content = useEditorStore((s) => s.content);
  const templateDetail = useEditorStore((s) => s.templateDetail);
  const styleOverrides = useEditorStore((s) => s.styleOverrides);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const rendered = useMemo(() => {
    if (!templateDetail) return null;
    try {
      return renderResume(templateDetail, content, styleOverrides);
    } catch (err) {
      console.error("Template render failed", err);
      return null;
    }
  }, [templateDetail, content, styleOverrides]);

  useEffect(() => {
    if (!rendered || !iframeRef.current) return;
    iframeRef.current.srcdoc = rendered.html;
  }, [rendered]);

  if (!templateDetail) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-500">
        Pick a template to see the live preview
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <iframe
        ref={iframeRef}
        title="Resume preview"
        className="h-full w-full"
        sandbox="allow-same-origin"
      />
    </div>
  );
}
