"use client";

import { useEditorStore } from "@/store/resumeStore";

const FONTS = [
  ["Inter", "'Inter', Arial, sans-serif"],
  ["Poppins", "'Poppins', Arial, sans-serif"],
  ["Merriweather", "'Merriweather', Georgia, serif"],
  ["Source Sans 3", "'Source Sans 3', Arial, sans-serif"],
  ["Roboto", "'Roboto', Arial, sans-serif"],
  ["Open Sans", "'Open Sans', Arial, sans-serif"],
  ["Lato", "'Lato', Arial, sans-serif"],
  ["IBM Plex Sans", "'IBM Plex Sans', Arial, sans-serif"],
] as const;

const SPACING = [["Tight", "9px"], ["Compact", "11px"], ["Standard", "13px"], ["Relaxed", "16px"], ["Airy", "20px"]];

export function StyleControls() {
  const style = useEditorStore((s) => s.styleOverrides);
  const set = useEditorStore((s) => s.setStyleOverride);
  const select = (key: keyof typeof style, value: string) => set(key, value);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-1 text-sm font-bold text-slate-900">Design editor</h3>
      <p className="mb-4 text-xs text-slate-500">Changes affect the editable visual layer, not your resume content.</p>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs text-slate-600">Heading font<select value={style.fontHeading ?? ""} onChange={(e) => select("fontHeading", e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"><option value="">Template default</option>{FONTS.map(([n,v]) => <option key={n} value={v}>{n}</option>)}</select></label>
        <label className="text-xs text-slate-600">Body font<select value={style.fontBody ?? ""} onChange={(e) => select("fontBody", e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"><option value="">Template default</option>{FONTS.map(([n,v]) => <option key={n} value={v}>{n}</option>)}</select></label>
        <label className="text-xs text-slate-600">Heading size<select value={style.headingSize ?? ""} onChange={(e) => select("headingSize", e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"><option value="">Default</option>{["22px","24px","26px","28px","30px","32px"].map((x) => <option key={x}>{x}</option>)}</select></label>
        <label className="text-xs text-slate-600">Body size<select value={style.bodySize ?? ""} onChange={(e) => select("bodySize", e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"><option value="">Default</option>{["10px","11px","12px","13px","14px"].map((x) => <option key={x}>{x}</option>)}</select></label>
        <label className="text-xs text-slate-600">Line height<select value={style.lineHeight ?? ""} onChange={(e) => select("lineHeight", e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"><option value="">Default</option>{["1.25","1.35","1.45","1.55","1.65"].map((x) => <option key={x}>{x}</option>)}</select></label>
        <label className="text-xs text-slate-600">Page margin<select value={style.pageMargin ?? ""} onChange={(e) => select("pageMargin", e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"><option value="">Default</option>{["20px","24px","28px","32px","38px"].map((x) => <option key={x}>{x}</option>)}</select></label>
      </div>
      <div className="mt-4"><span className="text-xs text-slate-600">Spacing</span><div className="mt-1 flex flex-wrap gap-2">{SPACING.map(([label,value]) => <button key={value} type="button" onClick={() => select("spacingUnit", value)} className={`rounded-md border px-2 py-1 text-[10px] ${style.spacingUnit === value ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 text-slate-600"}`}>{label}</button>)}</div></div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="text-xs text-slate-600">Accent<input type="color" value={style.colorAccent ?? "#2563eb"} onChange={(e) => select("colorAccent", e.target.value)} className="mt-1 h-8 w-full cursor-pointer rounded border border-slate-300" /></label>
        <label className="text-xs text-slate-600">Text<input type="color" value={style.textColor ?? "#111827"} onChange={(e) => select("textColor", e.target.value)} className="mt-1 h-8 w-full cursor-pointer rounded border border-slate-300" /></label>
      </div>
    </section>
  );
}
