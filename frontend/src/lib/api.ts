import {
  AtsReport,
  Resume,
  ResumeContent,
  StyleOverrides,
  TemplateFacets,
  TemplateVariantCatalog,
  TemplateVariantDetail,
} from "@/types/resume";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "content-type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface TemplateGalleryFilters {
  category?: string;
  colorFamily?: string;
  typographyStyle?: "classic" | "modern" | "minimal";
  atsSafeOnly?: boolean;
  atsLevel?: "excellent" | "good" | "moderate" | "creative";
  role?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export const api = {
  listTemplates: (filters: TemplateGalleryFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") params.set(key, String(value));
    });
    const query = params.toString();
    return request<TemplateVariantCatalog>(`/templates${query ? `?${query}` : ""}`);
  },

  getTemplateFacets: () => request<TemplateFacets>("/templates/facets"),

  getTemplate: (variantId: string) => request<TemplateVariantDetail>(`/templates/${variantId}`),

  createResume: (payload: {
    user_id: string;
    title: string;
    template_id?: string;
    portfolio_id?: string;
    target_job_role?: string;
    job_description?: string;
    content: ResumeContent;
  }) =>
    request<{ resume: Resume }>("/resumes", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getResume: (id: string) => request<{ resume: Resume }>(`/resumes/${id}`),

  patchResume: (
    id: string,
    payload: Partial<{
      title: string;
      template_id: string | null;
      target_job_role: string;
      job_description: string;
      content: ResumeContent;
      style_overrides: StyleOverrides;
      change_summary: string;
    }>,
  ) =>
    request<{ resume: Resume }>(`/resumes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  listVersions: (id: string) =>
    request<{ versions: { id: string; version_number: number; change_summary?: string; created_at: string }[] }>(
      `/resumes/${id}/versions`,
    ),

  getAtsReport: (id: string) => request<{ atsReport: AtsReport }>(`/resumes/${id}/ats-report`),

  /** Returns the download URL — actual download is a plain browser navigation/fetch, not JSON. */
  exportPdfUrl: (id: string) => `${API_BASE}/resumes/${id}/export`,
};
