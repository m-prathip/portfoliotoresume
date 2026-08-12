"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEditorStore } from "@/store/resumeStore";
import { ALL_SECTIONS, SECTION_LABELS, SectionKey } from "@/types/resume";
import {
  AchievementsEditor,
  ActivitiesEditor,
  CertificationsEditor,
  EducationEditor,
  InternshipsEditor,
  ProjectsEditor,
  SkillsEditor,
} from "./SectionEditors";

const SECTION_EDITORS: Record<SectionKey, React.ComponentType> = {
  education: EducationEditor,
  skills: SkillsEditor,
  projects: ProjectsEditor,
  internships: InternshipsEditor,
  certifications: CertificationsEditor,
  achievements: AchievementsEditor,
  activities: ActivitiesEditor,
};

function itemCount(content: ReturnType<typeof useEditorStore.getState>["content"], key: SectionKey): number {
  if (key === "skills") return Object.keys(content.skills).length;
  return (content[key] as unknown[]).length;
}

function SortableSectionRow({ sectionKey }: { sectionKey: SectionKey }) {
  const [expanded, setExpanded] = useState(false);
  const content = useEditorStore((s) => s.content);
  const count = itemCount(content, sectionKey);
  const label = content.sectionLabels?.[sectionKey] ?? SECTION_LABELS[sectionKey];

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sectionKey,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Editor = SECTION_EDITORS[sectionKey];

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center gap-2 p-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none px-1 text-slate-400 hover:text-slate-600 active:cursor-grabbing"
          aria-label={`Drag to reorder ${SECTION_LABELS[sectionKey]}`}
        >
          ⠿
        </button>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex flex-1 items-center justify-between text-left"
        >
          <span className="text-sm font-medium text-slate-800">{label}</span>
          <span className="text-xs text-slate-400 mr-16">{count} {count === 1 ? "item" : "items"} {expanded ? "▲" : "▼"}</span>
        </button>
      </div>
      {expanded && (
        <div className="border-t border-slate-100 p-3">
          <Editor />
        </div>
      )}
    </div>
  );
}

/**
 * The semantic-layer editing surface: drag handles reorder `sectionOrder`
 * (which the template's `{{#each sections}}` loop reads directly), while
 * each row expands into the section's own field editor. This is deliberately
 * separate from Canvas.tsx (the visual layer) — editing here never touches
 * template HTML/CSS, only ResumeContent.
 */
export function SectionList() {
  const sectionOrder = useEditorStore((s) => s.content.sectionOrder);
  const reorderSections = useEditorStore((s) => s.reorderSections);
  const updateContent = useEditorStore((s) => s.updateContent);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );


  const removeSection = (key: SectionKey) => updateContent((c) => ({ ...c, sectionOrder: c.sectionOrder.filter((x) => x !== key) }));
  const addSection = (key: SectionKey) => updateContent((c) => ({ ...c, sectionOrder: [...c.sectionOrder, key] }));
  const renameSection = (key: SectionKey, label: string) => updateContent((c) => ({ ...c, sectionLabels: { ...(c.sectionLabels ?? {}), [key]: label } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sectionOrder.indexOf(active.id as SectionKey);
    const newIndex = sectionOrder.indexOf(over.id as SectionKey);
    reorderSections(arrayMove(sectionOrder, oldIndex, newIndex));
  };

  const contentLabel = (key: SectionKey) => useEditorStore.getState().content.sectionLabels?.[key] ?? SECTION_LABELS[key];
  const hidden = ALL_SECTIONS.filter((key) => !sectionOrder.includes(key));

  return (
    <div className="flex flex-col gap-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {sectionOrder.map((key) => (
              <div key={key} className="relative">
                <SortableSectionRow sectionKey={key} />
                <div className="absolute right-10 top-3 flex gap-1">
                  <button type="button" className="text-[10px] text-slate-400 hover:text-slate-700" onClick={() => { const next = window.prompt("Section name", contentLabel(key)); if (next?.trim()) renameSection(key, next.trim()); }}>Rename</button>
                  <button type="button" className="text-[10px] text-slate-400 hover:text-red-600" onClick={() => removeSection(key)}>Hide</button>
                </div>
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {hidden.length > 0 && <div className="flex flex-wrap gap-2 rounded-lg border border-dashed border-slate-300 p-3">
        {hidden.map((key) => <button key={key} type="button" onClick={() => addSection(key)} className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:border-slate-500">+ {SECTION_LABELS[key]}</button>)}
      </div>}
    </div>
  );
}
