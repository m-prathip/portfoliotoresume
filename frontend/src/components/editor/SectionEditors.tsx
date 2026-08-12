"use client";
import React from "react";

import { useEditorStore } from "@/store/resumeStore";
import {
  Achievement,
  AchievementCategory,
  Activity,
  Certification,
  Education,
  Internship,
  Project,
} from "@/types/resume";

function Field({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-slate-600">
      {label}
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-slate-500"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-slate-500"
        />
      )}
    </label>
  );
}

function EntryCard({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <div className="relative rounded-md border border-slate-200 p-3">
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-2 top-2 text-xs text-slate-400 hover:text-red-500"
        aria-label="Remove entry"
      >
        ✕
      </button>
      <div className="grid grid-cols-2 gap-2 pr-5">{children}</div>
    </div>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-md border border-dashed border-slate-300 py-1.5 text-xs text-slate-500 hover:border-slate-400 hover:text-slate-700"
    >
      + {label}
    </button>
  );
}

export function EducationEditor() {
  const items = useEditorStore((s) => s.content.education);
  const updateContent = useEditorStore((s) => s.updateContent);
  const set = (i: number, patch: Partial<Education>) =>
    updateContent((c) => ({ ...c, education: c.education.map((e, idx) => (idx === i ? { ...e, ...patch } : e)) }));
  const remove = (i: number) => updateContent((c) => ({ ...c, education: c.education.filter((_, idx) => idx !== i) }));
  const add = () =>
    updateContent((c) => ({ ...c, education: [...c.education, { degree: "", college: "" }] }));

  return (
    <div className="flex flex-col gap-2">
      {items.map((e, i) => (
        <EntryCard key={i} onRemove={() => remove(i)}>
          <Field label="Degree" value={e.degree} onChange={(v) => set(i, { degree: v })} />
          <Field label="College" value={e.college} onChange={(v) => set(i, { college: v })} />
          <Field label="Start year" value={e.start_year ?? ""} onChange={(v) => set(i, { start_year: v })} />
          <Field label="Expected graduation" value={e.expected_graduation ?? ""} onChange={(v) => set(i, { expected_graduation: v })} />
          <Field label="CGPA / %" value={e.cgpa_or_percentage ?? ""} onChange={(v) => set(i, { cgpa_or_percentage: v })} />
        </EntryCard>
      ))}
      <AddButton onClick={add} label="Add education" />
    </div>
  );
}

function CsvField({ label, items, onChange }: { label: string; items: string[]; onChange: (items: string[]) => void }) {
  const [val, setVal] = React.useState(() => items.join(", "));

  React.useEffect(() => {
    const currentParsed = val.split(",").map(s => s.trim()).filter(Boolean);
    if (JSON.stringify(currentParsed) !== JSON.stringify(items)) {
      setVal(items.join(", "));
    }
  }, [items, val]);

  return (
    <label className="flex flex-col gap-1 text-xs text-slate-600">
      {label}
      <input
        type="text"
        value={val}
        onChange={(e) => {
          setVal(e.target.value);
          onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean));
        }}
        className="rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-slate-500"
      />
    </label>
  );
}

export function SkillsEditor() {
  const skills = useEditorStore((s) => s.content.skills);
  const updateContent = useEditorStore((s) => s.updateContent);
  const entries = Object.entries(skills);

  const setCategory = (oldKey: string, newKey: string) =>
    updateContent((c) => {
      if (oldKey === newKey || newKey.trim() === "") return c;
      const next: Record<string, string[]> = {};
      for (const [k, v] of Object.entries(c.skills)) {
        if (k === oldKey) {
          next[newKey] = v;
        } else {
          next[k] = v;
        }
      }
      return { ...c, skills: next };
    });

  const setItems = (key: string, items: string[]) =>
    updateContent((c) => ({
      ...c,
      skills: { ...c.skills, [key]: items },
    }));

  const remove = (key: string) =>
    updateContent((c) => {
      const next = { ...c.skills };
      delete next[key];
      return { ...c, skills: next };
    });

  const add = () => updateContent((c) => ({ ...c, skills: { ...c.skills, [`Category ${entries.length + 1}`]: [] } }));

  return (
    <div className="flex flex-col gap-2">
      {entries.map(([category, items], index) => (
        <EntryCard key={index} onRemove={() => remove(category)}>
          <Field label="Category" value={category} onChange={(v) => setCategory(category, v)} />
          <CsvField label="Skills (comma-separated)" items={items} onChange={(v) => setItems(category, v)} />
        </EntryCard>
      ))}
      <AddButton onClick={add} label="Add skill category" />
    </div>
  );
}

export function ProjectsEditor() {
  const items = useEditorStore((s) => s.content.projects);
  const updateContent = useEditorStore((s) => s.updateContent);
  const set = (i: number, patch: Partial<Project>) =>
    updateContent((c) => ({ ...c, projects: c.projects.map((p, idx) => (idx === i ? { ...p, ...patch } : p)) }));
  const remove = (i: number) => updateContent((c) => ({ ...c, projects: c.projects.filter((_, idx) => idx !== i) }));
  const add = () => updateContent((c) => ({ ...c, projects: [...c.projects, { name: "", technologies: [] }] }));

  return (
    <div className="flex flex-col gap-2">
      {items.map((p, i) => (
        <EntryCard key={i} onRemove={() => remove(i)}>
          <Field label="Project name" value={p.name} onChange={(v) => set(i, { name: v })} />
          <Field label="Technologies (comma-separated)" value={p.technologies.join(", ")} onChange={(v) => set(i, { technologies: v.split(",").map((s) => s.trim()).filter(Boolean) })} />
          <Field label="What it does / your solution" value={p.solution ?? ""} onChange={(v) => set(i, { solution: v })} textarea />
          <Field label="Result (must be evidence-backed)" value={p.result ?? ""} onChange={(v) => set(i, { result: v })} textarea />
          <Field label="GitHub URL" value={p.github_url ?? ""} onChange={(v) => set(i, { github_url: v })} />
          <Field label="Live demo URL" value={p.live_url ?? ""} onChange={(v) => set(i, { live_url: v })} />
        </EntryCard>
      ))}
      <AddButton onClick={add} label="Add project" />
    </div>
  );
}

export function InternshipsEditor() {
  const items = useEditorStore((s) => s.content.internships);
  const updateContent = useEditorStore((s) => s.updateContent);
  const set = (i: number, patch: Partial<Internship>) =>
    updateContent((c) => ({ ...c, internships: c.internships.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) }));
  const remove = (i: number) => updateContent((c) => ({ ...c, internships: c.internships.filter((_, idx) => idx !== i) }));
  const add = () =>
    updateContent((c) => ({ ...c, internships: [...c.internships, { company: "", role: "", duration: "", responsibilities: [] }] }));

  return (
    <div className="flex flex-col gap-2">
      {items.map((it, i) => (
        <EntryCard key={i} onRemove={() => remove(i)}>
          <Field label="Company" value={it.company} onChange={(v) => set(i, { company: v })} />
          <Field label="Role" value={it.role} onChange={(v) => set(i, { role: v })} />
          <Field label="Duration" value={it.duration} onChange={(v) => set(i, { duration: v })} />
          <Field
            label="Responsibilities (one per line)"
            value={it.responsibilities.join("\n")}
            onChange={(v) => set(i, { responsibilities: v.split("\n").filter(Boolean) })}
            textarea
          />
        </EntryCard>
      ))}
      <AddButton onClick={add} label="Add internship" />
    </div>
  );
}

export function CertificationsEditor() {
  const items = useEditorStore((s) => s.content.certifications);
  const updateContent = useEditorStore((s) => s.updateContent);
  const set = (i: number, patch: Partial<Certification>) =>
    updateContent((c) => ({ ...c, certifications: c.certifications.map((cert, idx) => (idx === i ? { ...cert, ...patch } : cert)) }));
  const remove = (i: number) => updateContent((c) => ({ ...c, certifications: c.certifications.filter((_, idx) => idx !== i) }));
  const add = () => updateContent((c) => ({ ...c, certifications: [...c.certifications, { certificate: "", issuer: "" }] }));

  return (
    <div className="flex flex-col gap-2">
      {items.map((cert, i) => (
        <EntryCard key={i} onRemove={() => remove(i)}>
          <Field label="Certificate" value={cert.certificate} onChange={(v) => set(i, { certificate: v })} />
          <Field label="Issuer" value={cert.issuer} onChange={(v) => set(i, { issuer: v })} />
          <Field label="Date" value={cert.date ?? ""} onChange={(v) => set(i, { date: v })} />
        </EntryCard>
      ))}
      <AddButton onClick={add} label="Add certification" />
    </div>
  );
}

const ACHIEVEMENT_CATEGORIES: AchievementCategory[] = [
  "hackathon", "competition", "award", "coding_contest", "academic", "open_source", "research",
];

export function AchievementsEditor() {
  const items = useEditorStore((s) => s.content.achievements);
  const updateContent = useEditorStore((s) => s.updateContent);
  const set = (i: number, patch: Partial<Achievement>) =>
    updateContent((c) => ({ ...c, achievements: c.achievements.map((a, idx) => (idx === i ? { ...a, ...patch } : a)) }));
  const remove = (i: number) => updateContent((c) => ({ ...c, achievements: c.achievements.filter((_, idx) => idx !== i) }));
  const add = () =>
    updateContent((c) => ({ ...c, achievements: [...c.achievements, { category: "award" as AchievementCategory, title: "" }] }));

  return (
    <div className="flex flex-col gap-2">
      {items.map((a, i) => (
        <EntryCard key={i} onRemove={() => remove(i)}>
          <label className="flex flex-col gap-1 text-xs text-slate-600">
            Category
            <select
              value={a.category}
              onChange={(e) => set(i, { category: e.target.value as AchievementCategory })}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-slate-500"
            >
              {ACHIEVEMENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.replace("_", " ")}</option>
              ))}
            </select>
          </label>
          <Field label="Title" value={a.title} onChange={(v) => set(i, { title: v })} />
          <Field label="Description" value={a.description ?? ""} onChange={(v) => set(i, { description: v })} textarea />
        </EntryCard>
      ))}
      <AddButton onClick={add} label="Add achievement" />
    </div>
  );
}

export function ActivitiesEditor() {
  const items = useEditorStore((s) => s.content.activities);
  const updateContent = useEditorStore((s) => s.updateContent);
  const set = (i: number, patch: Partial<Activity>) =>
    updateContent((c) => ({ ...c, activities: c.activities.map((act, idx) => (idx === i ? { ...act, ...patch } : act)) }));
  const remove = (i: number) => updateContent((c) => ({ ...c, activities: c.activities.filter((_, idx) => idx !== i) }));
  const add = () => updateContent((c) => ({ ...c, activities: [...c.activities, { organization: "", role: "" }] }));

  return (
    <div className="flex flex-col gap-2">
      {items.map((act, i) => (
        <EntryCard key={i} onRemove={() => remove(i)}>
          <Field label="Organization" value={act.organization} onChange={(v) => set(i, { organization: v })} />
          <Field label="Role" value={act.role} onChange={(v) => set(i, { role: v })} />
          <Field label="Description" value={act.description ?? ""} onChange={(v) => set(i, { description: v })} textarea />
        </EntryCard>
      ))}
      <AddButton onClick={add} label="Add activity" />
    </div>
  );
}
