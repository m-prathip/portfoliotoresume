import { StyleOverrides, StylePreset, Template, TemplateVariant } from "../types";
import { TemplateRecord } from "./templateRenderer";

/**
 * Template variant-generation engine.
 *
 * Design: a base `templates` row already contains a fully self-sufficient
 * layout (structure + section arrangement + a stylesheet that reads
 * --user-font-heading / --user-font-body / --user-color-primary /
 * --user-color-accent / --user-spacing-unit with fallbacks — see
 * templateRenderer.buildStyleVariables). A `style_presets` row is nothing
 * but a named bundle of values for those same five variables.
 *
 * So a gallery-selectable "template" is the cross-product of one base
 * layout and one style preset. We never materialize that cross-product
 * as rows: it's generated in memory from two small tables, which is how
 * 200 base layouts x 25 curated presets yields exactly 5,000 selectable templates
 * today, and why adding base layout #201 doesn't require touching this
 * file or re-seeding thousands of rows — it just widens the product.
 *
 * Uniqueness/duplicate-detection (section 19 of the blueprint) falls out
 * for free: variant IDs are deterministic ("TMP-{baseSlug}-{presetSlug}"),
 * so two variants can only collide if a base slug or preset slug is
 * reused, which the DB's UNIQUE constraints on `templates.slug` and
 * `style_presets.slug` already prevent.
 */

export function buildVariantId(baseSlug: string, presetSlug: string): string {
  return `TMP-${baseSlug}-${presetSlug}`;
}

export interface ParsedVariantId {
  baseSlug: string;
  presetSlug: string;
}

/**
 * Reverses buildVariantId. Base and preset slugs are themselves
 * hyphenated, so we resolve the split against the known slug lists
 * rather than guessing where "TMP-" ends and the preset begins.
 */
export function parseVariantId(
  variantId: string,
  knownBaseSlugs: string[],
  knownPresetSlugs: string[],
): ParsedVariantId | null {
  if (!variantId.startsWith("TMP-")) return null;
  const rest = variantId.slice(4);

  // Try every base slug that is a prefix of `rest`; the remainder (minus
  // the joining hyphen) must be an exact known preset slug. Longest base
  // slug first avoids a short base slug swallowing part of the preset.
  const candidates = knownBaseSlugs
    .filter((slug) => rest === slug || rest.startsWith(`${slug}-`))
    .sort((a, b) => b.length - a.length);

  for (const baseSlug of candidates) {
    const presetSlug = rest === baseSlug ? "" : rest.slice(baseSlug.length + 1);
    if (knownPresetSlugs.includes(presetSlug)) {
      return { baseSlug, presetSlug };
    }
  }
  return null;
}

export interface VariantCatalogFilters {
  category?: string;
  colorFamily?: string;
  typographyStyle?: "classic" | "modern" | "minimal";
  atsSafeOnly?: boolean;
  atsLevel?: "excellent" | "good" | "moderate" | "creative";
  role?: string;
  search?: string;
  page?: number; // 1-indexed
  pageSize?: number;
}

export interface VariantCatalogResult {
  variants: TemplateVariant[];
  total: number;
  page: number;
  pageSize: number;
}

function toVariant(base: Template, preset: StylePreset): TemplateVariant {
  return {
    id: buildVariantId(base.slug, preset.slug),
    baseTemplateId: base.id,
    baseSlug: base.slug,
    presetId: preset.id,
    presetSlug: preset.slug,
    name: `${base.name} — ${preset.name}`,
    category: base.category,
    colorFamily: preset.color_family,
    typographyStyle: preset.typography_style,
    isAtsSafe: base.is_ats_safe,
    atsLevel: base.ats_level,
    recommendedRoles: base.recommended_roles,
    subcategory: base.subcategory,
    tags: base.tags,
  } as TemplateVariant;
}

/**
 * Generates the full base x preset cross-product, applies gallery
 * filters, and paginates. Bases and presets are the only DB reads this
 * needs (both cheap, both cacheable) — nothing per-variant is fetched
 * until the user selects one and hits resolveVariant.
 */
export function generateVariantCatalog(
  bases: Template[],
  presets: StylePreset[],
  filters: VariantCatalogFilters = {},
): VariantCatalogResult {
  const activeBases = bases.filter((b) => b.is_active);
  const activePresets = presets.filter((p) => p.is_active);

  let all: TemplateVariant[] = [];
  for (const base of activeBases) {
    for (const preset of activePresets) {
      all.push(toVariant(base, preset));
    }
  }

  if (filters.category) {
    all = all.filter((v) => v.category === filters.category);
  }
  if (filters.colorFamily) {
    all = all.filter((v) => v.colorFamily === filters.colorFamily);
  }
  if (filters.typographyStyle) {
    all = all.filter((v) => v.typographyStyle === filters.typographyStyle);
  }
  if (filters.atsSafeOnly) {
    all = all.filter((v) => v.isAtsSafe);
  }
  if (filters.atsLevel) {
    all = all.filter((v) => (v as TemplateVariant & { atsLevel?: string }).atsLevel === filters.atsLevel);
  }
  if (filters.role) {
    const q = filters.role.toLowerCase();
    all = all.filter((v) => ((v as TemplateVariant & { recommendedRoles?: string[] }).recommendedRoles ?? []).some((r) => r.toLowerCase().includes(q)));
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    all = all.filter((v) => [v.name, v.category, v.colorFamily, v.typographyStyle, (v as TemplateVariant & { subcategory?: string }).subcategory, ...((v as TemplateVariant & { tags?: string[] }).tags ?? [])].filter(Boolean).some((value) => String(value).toLowerCase().includes(q)));
  }

  const total = all.length;
  const pageSize = filters.pageSize && filters.pageSize > 0 ? filters.pageSize : 60;
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const start = (page - 1) * pageSize;
  const variants = all.slice(start, start + pageSize);

  return { variants, total, page, pageSize };
}

/**
 * Turns a preset into the StyleOverrides shape templateRenderer already
 * consumes, so resolving a variant needs no new rendering code path.
 */
export function presetToStyleOverrides(preset: StylePreset): StyleOverrides {
  return {
    fontHeading: preset.font_heading,
    fontBody: preset.font_body,
    colorPrimary: preset.color_primary,
    colorAccent: preset.color_accent,
    spacingUnit: preset.spacing_unit,
  };
}

export interface ResolvedVariant {
  variant: TemplateVariant;
  template: TemplateRecord;
  defaultStyleOverrides: StyleOverrides;
}

/**
 * Resolves a variant ID against the actual base template + preset rows.
 * This is the only point where html_template/css_styles get fetched —
 * the gallery listing never carries them.
 */
export function resolveVariant(
  variantId: string,
  bases: Template[],
  presets: StylePreset[],
): ResolvedVariant | null {
  const parsed = parseVariantId(
    variantId,
    bases.map((b) => b.slug),
    presets.map((p) => p.slug),
  );
  if (!parsed) return null;

  const base = bases.find((b) => b.slug === parsed.baseSlug);
  const preset = presets.find((p) => p.slug === parsed.presetSlug);
  if (!base || !preset) return null;

  return {
    variant: toVariant(base, preset),
    template: { html_template: base.html_template, css_styles: base.css_styles },
    defaultStyleOverrides: presetToStyleOverrides(preset),
  };
}

/**
 * Quality control (blueprint section 19): confirms the catalog has no
 * duplicate IDs and no preset/base referencing a slug that doesn't
 * exist. Cheap enough to run on every catalog build; cheap because the
 * catalog is generated, not hand-maintained, so this mostly guards
 * against a future bug in the generator rather than bad seed data.
 */
export function validateCatalog(bases: Template[], presets: StylePreset[]): string[] {
  const errors: string[] = [];
  const baseSlugs = new Set<string>();
  for (const b of bases) {
    if (baseSlugs.has(b.slug)) errors.push(`Duplicate base template slug: ${b.slug}`);
    baseSlugs.add(b.slug);
  }
  const presetSlugs = new Set<string>();
  for (const p of presets) {
    if (presetSlugs.has(p.slug)) errors.push(`Duplicate style preset slug: ${p.slug}`);
    presetSlugs.add(p.slug);
  }

  const { variants } = generateVariantCatalog(bases, presets, { pageSize: Number.MAX_SAFE_INTEGER });
  const ids = new Set<string>();
  for (const v of variants) {
    if (ids.has(v.id)) errors.push(`Duplicate variant id: ${v.id}`);
    ids.add(v.id);
  }
  return errors;
}
