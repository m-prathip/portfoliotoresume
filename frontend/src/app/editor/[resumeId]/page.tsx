"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useEditorStore } from "@/store/resumeStore";
import { useAutosave } from "@/hooks/useAutosave";
import { PersonalInfoForm } from "@/components/editor/PersonalInfoForm";
import { SectionList } from "@/components/editor/SectionList";
import { StyleControls } from "@/components/editor/StyleControls";
import { TemplatePicker } from "@/components/editor/TemplatePicker";
import { Canvas } from "@/components/editor/Canvas";
import { ExportPanel } from "@/components/editor/ExportPanel";

export default function EditorPage() {
  const params = useParams<{ resumeId: string }>();
  const router = useRouter();
  const loadResume = useEditorStore((s) => s.loadResume);
  const setTitle = useEditorStore((s) => s.setTitle);
  const title = useEditorStore((s) => s.title);
  const isSaving = useEditorStore((s) => s.isSaving);
  const isDirty = useEditorStore((s) => s.isDirty);
  const lastSavedAt = useEditorStore((s) => s.lastSavedAt);

  useAutosave();

  useEffect(() => {
    if (!params.resumeId) return;

    if (params.resumeId === "new") {
      const stored = window.sessionStorage.getItem("portfolio2resume_analysis");
      const userId = window.localStorage.getItem("portfolio2resume_user_id");
      const portfolioId = window.sessionStorage.getItem("portfolio2resume_portfolio_id");

      if (stored && userId) {
        try {
          const data = JSON.parse(stored);
          api
            .createResume({
              user_id: userId,
              portfolio_id: portfolioId ?? undefined,
              title: "Untitled Resume",
              content: data.structured,
            })
            .then(({ resume }) => {
              loadResume(resume);
              router.replace(`/editor/${resume.id}`);
            })
            .catch((err) => console.error("Failed to create resume", err));
        } catch (e) {
          console.error("Failed to parse mock data");
        }
      }
      return;
    }

    api
      .getResume(params.resumeId)
      .then(({ resume }) => loadResume(resume))
      .catch((err) => console.error("Failed to load resume", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.resumeId]);

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-md border border-transparent px-2 py-1 text-lg font-semibold text-slate-800 hover:border-slate-200 focus:border-slate-400 focus:outline-none"
        />
        <span className="text-xs text-slate-400">
          {isSaving ? "Saving…" : isDirty ? "Unsaved changes" : lastSavedAt ? `Saved` : ""}
        </span>
      </header>

      <div className="grid flex-1 grid-cols-[360px_1fr] gap-4 overflow-hidden p-4">
        <div className="flex flex-col gap-3 overflow-y-auto pr-1">
          <TemplatePicker />
          <StyleControls />
          <PersonalInfoForm />
          <SectionList />
          <ExportPanel />
        </div>

        <div className="overflow-hidden">
          <Canvas />
        </div>
      </div>
    </div>
  );
}
