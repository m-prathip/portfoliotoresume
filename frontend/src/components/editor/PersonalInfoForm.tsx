"use client";

import { useEditorStore } from "@/store/resumeStore";

const FIELDS: { key: keyof ReturnType<typeof useEditorStore.getState>["content"]["personal"]; label: string; placeholder: string }[] = [
  { key: "full_name", label: "Full name", placeholder: "Priya Sharma" },
  { key: "target_role", label: "Target role", placeholder: "Frontend Developer" },
  { key: "email", label: "Email", placeholder: "priya@email.com" },
  { key: "phone", label: "Phone", placeholder: "+91 98765 43210" },
  { key: "location", label: "Location", placeholder: "Bengaluru, India" },
  { key: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/priya" },
  { key: "github", label: "GitHub", placeholder: "github.com/priya" },
  { key: "portfolio", label: "Portfolio URL", placeholder: "priya.dev" },
];

export function PersonalInfoForm() {
  const personal = useEditorStore((s) => s.content.personal);
  const updateContent = useEditorStore((s) => s.updateContent);

  const setField = (key: string, value: string) => {
    updateContent((content) => ({
      ...content,
      personal: { ...content.personal, [key]: value },
    }));
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-700">Personal Info</h3>
      <div className="grid grid-cols-2 gap-3">
        {FIELDS.map((f) => (
          <label key={f.key} className="flex flex-col gap-1 text-xs text-slate-600">
            {f.label}
            <input
              type="text"
              value={(personal[f.key] as string) ?? ""}
              placeholder={f.placeholder}
              onChange={(e) => setField(f.key, e.target.value)}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-slate-500"
            />
          </label>
        ))}
      </div>
    </div>
  );
}
