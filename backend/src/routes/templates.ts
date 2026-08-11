import { Router } from "express";
import { pool } from "../db/pool";
import { ApiError } from "../middleware/errorHandler";
import { Template, StylePreset } from "../types";
import { generateVariantCatalog, resolveVariant, VariantCatalogFilters } from "../services/templateVariants";

export const templatesRouter = Router();

async function loadBasesAndPresets(): Promise<{ bases: Template[]; presets: StylePreset[] }> {
  const [basesRes, presetsRes] = await Promise.all([
    pool.query<Template>(
      `SELECT id, name, slug, category, subcategory, description, ''::text AS html_template, ''::text AS css_styles,
              is_ats_safe, is_active, ats_level, recommended_roles, tags, template_config, preview_url, thumbnail_url
       FROM templates WHERE is_active = true ORDER BY name`,
    ),
    pool.query<StylePreset>(
      `SELECT id, slug, name, color_family, typography_style, font_heading, font_body,
              color_primary, color_accent, spacing_unit, is_active
       FROM style_presets WHERE is_active = true ORDER BY name`,
    ),
  ]);
  return { bases: basesRes.rows, presets: presetsRes.rows };
}

async function loadBaseDetail(slug: string): Promise<Template | null> {
  const result = await pool.query<Template>(
    `SELECT id, name, slug, category, subcategory, description, html_template, css_styles, is_ats_safe, is_active,
            ats_level, recommended_roles, tags, template_config, preview_url, thumbnail_url
     FROM templates WHERE slug = $1 AND is_active = true LIMIT 1`,
    [slug],
  );
  return result.rows[0] ?? null;
}

// GET /api/templates — paginated, filterable gallery of base x preset
// variants. Lightweight: no html_template/css_styles on this list, so
// the picker UI can page through hundreds of entries cheaply (section 23
// of the blueprint — thumbnail-first, lazy full-config loading).
//
// Query params: category, colorFamily, typographyStyle, atsSafeOnly,
// page (1-indexed), pageSize.
templatesRouter.get("/", async (req, res, next) => {
  try {
    const { bases, presets } = await loadBasesAndPresets();

    const filters: VariantCatalogFilters = {
      category: typeof req.query.category === "string" ? req.query.category : undefined,
      colorFamily: typeof req.query.colorFamily === "string" ? req.query.colorFamily : undefined,
      typographyStyle:
        req.query.typographyStyle === "classic" ||
        req.query.typographyStyle === "modern" ||
        req.query.typographyStyle === "minimal"
          ? req.query.typographyStyle
          : undefined,
      atsSafeOnly: req.query.atsSafeOnly === "true",
      atsLevel:
        req.query.atsLevel === "excellent" || req.query.atsLevel === "good" || req.query.atsLevel === "moderate" || req.query.atsLevel === "creative"
          ? req.query.atsLevel
          : undefined,
      role: typeof req.query.role === "string" ? req.query.role : undefined,
      search: typeof req.query.search === "string" ? req.query.search : undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
    };

    const result = generateVariantCatalog(bases, presets, filters);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/templates/facets — distinct filter values for the gallery's
// filter UI (categories, color families, typography styles), derived
// from the same two small tables rather than a hand-maintained list.
templatesRouter.get("/facets", async (_req, res, next) => {
  try {
    const { bases, presets } = await loadBasesAndPresets();
    res.json({
      categories: [...new Set(bases.map((b) => b.category).filter(Boolean))],
      subcategories: [...new Set(bases.map((b) => b.subcategory).filter(Boolean))],
      roles: [...new Set(bases.flatMap((b) => b.recommended_roles ?? []))].sort(),
      atsLevels: [...new Set(bases.map((b) => b.ats_level).filter(Boolean))],
      colorFamilies: [...new Set(presets.map((p) => p.color_family))],
      typographyStyles: [...new Set(presets.map((p) => p.typography_style))],
      totalVariants: bases.length * presets.length,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/templates/:variantId — full detail for one variant
// ("TMP-{baseSlug}-{presetSlug}"). Returns the base layout's
// html_template/css_styles plus the preset's values as
// defaultStyleOverrides, ready to hand to templateRenderer or to seed
// resumes.style_overrides when the user starts a resume from this
// template.
//
// Also accepts a bare base template slug (e.g. "classic-fresher-ats")
// for backward compatibility with the pre-variant API.
templatesRouter.get("/:variantId", async (req, res, next) => {
  try {
    const { bases, presets } = await loadBasesAndPresets();
    const { variantId } = req.params;

    if (!variantId.startsWith("TMP-")) {
      const base = await loadBaseDetail(variantId);
      if (!base) return next(new ApiError(404, `Template '${variantId}' not found`));
      return res.json({ template: base });
    }

    const resolved = resolveVariant(variantId, bases, presets);
    if (!resolved) {
      return next(new ApiError(404, `Template variant '${variantId}' not found`));
    }
    const base = await loadBaseDetail(resolved.variant.baseSlug);
    if (!base) return next(new ApiError(404, `Base template '${resolved.variant.baseSlug}' not found`));

    res.json({
      variant: resolved.variant,
      template: {
        id: base.id,
        slug: base.slug,
        html_template: base.html_template,
        css_styles: base.css_styles,
      },
      defaultStyleOverrides: resolved.defaultStyleOverrides,
    });
  } catch (err) {
    next(err);
  }
});
