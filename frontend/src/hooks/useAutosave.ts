import { useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { useEditorStore } from "@/store/resumeStore";

const AUTOSAVE_DEBOUNCE_MS = 1200;

/**
 * Watches the editor store and PATCHes the backend `AUTOSAVE_DEBOUNCE_MS`
 * after the last edit, so rapid typing/reordering collapses into one save
 * instead of one request per keystroke. Every content-changing save also
 * creates a `resume_versions` snapshot (see backend/src/routes/resumes.ts).
 */
export function useAutosave() {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resumeId = useEditorStore((s) => s.resumeId);
  const title = useEditorStore((s) => s.title);
  const content = useEditorStore((s) => s.content);
  const templateId = useEditorStore((s) => s.templateId);
  const styleOverrides = useEditorStore((s) => s.styleOverrides);
  const isDirty = useEditorStore((s) => s.isDirty);
  const markSaving = useEditorStore((s) => s.markSaving);
  const markSaved = useEditorStore((s) => s.markSaved);

  useEffect(() => {
    if (!resumeId || !isDirty) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      markSaving();
      try {
        await api.patchResume(resumeId, {
          title,
          content,
          template_id: templateId ?? undefined,
          style_overrides: styleOverrides,
          change_summary: "Autosave",
        });
      } catch (err) {
        console.error("Autosave failed", err);
      } finally {
        markSaved();
      }
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId, title, content, templateId, styleOverrides, isDirty]);
}
