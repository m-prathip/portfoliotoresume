"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useEditorStore } from "@/store/resumeStore";
import { TemplateFacets } from "@/types/resume";

const PAGE_SIZE = 24;

export function TemplatePicker() {
  const availableVariants = useEditorStore((s) => s.availableVariants);
  const total = useEditorStore((s) => s.variantCatalogTotal);
  const setAvailableVariants = useEditorStore((s) => s.setAvailableVariants);
  const selectedVariantId = useEditorStore((s) => s.selectedVariantId);
  const selectTemplateVariant = useEditorStore((s) => s.selectTemplateVariant);
  const [facets, setFacets] = useState<TemplateFacets | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [role, setRole] = useState("");
  const [atsLevel, setAtsLevel] = useState("");
  const [colorFamily, setColorFamily] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.getTemplateFacets().then(setFacets).catch(console.error); }, []);

  useEffect(() => {
    setLoading(true);
    api.listTemplates({ search: search || undefined, category: category || undefined, role: role || undefined, atsLevel: (atsLevel || undefined) as any, colorFamily: colorFamily || undefined, page, pageSize: PAGE_SIZE })
      .then(({ variants, total: count }) => setAvailableVariants(variants, count))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, category, role, atsLevel, colorFamily, page, setAvailableVariants]);

  const choose = async (id: string) => {
    const detail = await api.getTemplate(id);
    selectTemplateVariant(id, detail.template, detail.defaultStyleOverrides);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const reset = () => { setSearch(""); setCategory(""); setRole(""); setAtsLevel(""); setColorFamily(""); setPage(1); };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div><h3 className="text-sm font-bold text-slate-900">Template Library</h3><p className="text-xs text-slate-500">{total.toLocaleString()} selectable designs</p></div>
        <button onClick={reset} className="text-xs text-slate-500 hover:text-slate-900">Reset</button>
      </div>
      <input value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} placeholder="Search AI Engineer, fresher, ATS, data..." className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-700" />
      {facets && <div className="grid grid-cols-2 gap-2">
        <select value={category} onChange={(e) => { setPage(1); setCategory(e.target.value); }} className="rounded-lg border border-slate-200 px-2 py-2 text-xs"><option value="">All categories</option>{facets.categories.map((x) => <option key={x}>{x}</option>)}</select>
        <select value={role} onChange={(e) => { setPage(1); setRole(e.target.value); }} className="rounded-lg border border-slate-200 px-2 py-2 text-xs"><option value="">All roles</option>{facets.roles.map((x) => <option key={x}>{x}</option>)}</select>
        <select value={atsLevel} onChange={(e) => { setPage(1); setAtsLevel(e.target.value); }} className="rounded-lg border border-slate-200 px-2 py-2 text-xs"><option value="">All ATS levels</option>{facets.atsLevels.map((x) => <option key={x}>{x}</option>)}</select>
        <select value={colorFamily} onChange={(e) => { setPage(1); setColorFamily(e.target.value); }} className="rounded-lg border border-slate-200 px-2 py-2 text-xs"><option value="">All colors</option>{facets.colorFamilies.map((x) => <option key={x}>{x}</option>)}</select>
      </div>}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {availableVariants.map((v) => <button key={v.id} onClick={() => choose(v.id)} className={`group overflow-hidden rounded-xl border text-left transition hover:-translate-y-0.5 hover:shadow-md ${selectedVariantId === v.id ? "border-slate-900 ring-2 ring-slate-900/10" : "border-slate-200"}`}>
          <div className="flex h-28 items-center justify-center bg-slate-50 p-3"><div className="h-20 w-28 rounded-sm border border-slate-200 bg-white p-2 shadow-sm"><div className="h-1.5 w-12 rounded bg-slate-800"/><div className="mt-1 h-1 w-8 rounded bg-slate-400"/><div className="mt-3 space-y-1"><div className="h-1 w-full bg-slate-200"/><div className="h-1 w-10/12 bg-slate-200"/><div className="h-1 w-8/12 bg-slate-200"/><div className="h-1 w-full bg-slate-200"/></div></div></div>
          <div className="p-3"><div className="line-clamp-1 text-xs font-semibold text-slate-900">{v.name}</div><div className="mt-1 text-[10px] text-slate-500">{v.subcategory ?? v.category} · {v.colorFamily}</div><div className="mt-2 flex items-center justify-between"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] uppercase tracking-wide text-slate-600">{v.atsLevel ?? (v.isAtsSafe ? "good" : "creative")}</span><span className="text-[10px] font-semibold text-slate-700">Use</span></div></div>
        </button>)}
      </div>
      {!loading && availableVariants.length === 0 && <p className="py-8 text-center text-xs text-slate-400">No templates match these filters.</p>}
      {loading && <p className="py-6 text-center text-xs text-slate-500">Loading templates…</p>}
      {total > PAGE_SIZE && <div className="mt-4 flex items-center justify-between text-xs text-slate-500"><button disabled={page === 1} onClick={() => setPage(page - 1)} className="disabled:opacity-30">Previous</button><span>{page} / {totalPages}</span><button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="disabled:opacity-30">Next</button></div>}
    </section>
  );
}
