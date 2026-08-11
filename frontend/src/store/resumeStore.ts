import { create } from "zustand";
import {
  Resume,
  ResumeContent,
  SectionKey,
  StyleOverrides,
  TemplateDetail,
  TemplateVariant,
  emptyResumeContent,
} from "@/types/resume";

interface EditorState {
  resumeId: string | null;
  title: string;
  content: ResumeContent;
  templateId: string | null; // base template UUID — what resumes.template_id stores
  selectedVariantId: string | null; // "TMP-{base}-{preset}" — for highlighting the picked gallery card
  templateDetail: TemplateDetail | null;
  availableVariants: TemplateVariant[];
  variantCatalogTotal: number;
  styleOverrides: StyleOverrides;
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: string | null;

  loadResume: (resume: Resume) => void;
  setAvailableVariants: (variants: TemplateVariant[], total: number) => void;
  /**
   * Applies a picked gallery variant: swaps in its base layout for
   * rendering AND replaces styleOverrides with the preset's values, so
   * selecting "Navy Classic" actually looks navy/classic immediately.
   * The user can still hand-tune font/color/spacing afterward via the
   * existing style controls — this only sets the starting point.
   */
  selectTemplateVariant: (variantId: string, template: TemplateDetail, defaultStyleOverrides: StyleOverrides) => void;
  setTitle: (title: string) => void;
  updateContent: (updater: (content: ResumeContent) => ResumeContent) => void;
  reorderSections: (order: SectionKey[]) => void;
  setStyleOverride: (key: keyof StyleOverrides, value: string) => void;
  markSaving: () => void;
  markSaved: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  resumeId: null,
  title: "Untitled Resume",
  content: emptyResumeContent(),
  templateId: null,
  selectedVariantId: null,
  templateDetail: null,
  availableVariants: [],
  variantCatalogTotal: 0,
  styleOverrides: {},
  isDirty: false,
  isSaving: false,
  lastSavedAt: null,

  loadResume: (resume) =>
    set({
      resumeId: resume.id,
      title: resume.title,
      content: resume.content,
      templateId: resume.template_id ?? null,
      styleOverrides: resume.style_overrides ?? {},
      // A saved resume doesn't remember which gallery variant it came
      // from (only the base template + its own style_overrides), so we
      // don't try to guess which card should show as "selected" here.
      selectedVariantId: null,
      isDirty: false,
    }),

  setAvailableVariants: (variants, total) => set({ availableVariants: variants, variantCatalogTotal: total }),

  selectTemplateVariant: (variantId, template, defaultStyleOverrides) =>
    set({
      templateDetail: template,
      templateId: template.id,
      selectedVariantId: variantId,
      styleOverrides: defaultStyleOverrides,
      isDirty: true,
    }),

  setTitle: (title) => set({ title, isDirty: true }),

  updateContent: (updater) =>
    set((state) => ({ content: updater(state.content), isDirty: true })),

  reorderSections: (order) =>
    set((state) => ({ content: { ...state.content, sectionOrder: order }, isDirty: true })),

  setStyleOverride: (key, value) =>
    set((state) => ({ styleOverrides: { ...state.styleOverrides, [key]: value }, isDirty: true })),

  markSaving: () => set({ isSaving: true }),
  markSaved: () => set({ isSaving: false, isDirty: false, lastSavedAt: new Date().toISOString() }),
}));
