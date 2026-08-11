import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { generateBaseTemplateConfigs } from "../src/template-system/templateFactory";
import { STYLE_PRESETS } from "../src/db/seed/seedStylePresets";
import { buildVariantId } from "../src/services/templateVariants";

const bases = generateBaseTemplateConfigs();
const variants = bases.flatMap((base) => STYLE_PRESETS.map((preset) => ({
  id: buildVariantId(base.slug, preset.slug),
  baseTemplateId: base.templateId,
  baseSlug: base.slug,
  name: `${base.templateName} — ${preset.name}`,
  category: base.category,
  subcategory: base.subcategory,
  colorFamily: preset.colorFamily,
  typographyStyle: preset.typographyStyle,
  atsLevel: base.atsLevel,
  isAtsSafe: base.atsLevel === "excellent" || base.atsLevel === "good",
  recommendedRoles: base.recommendedRoles,
  tags: [...base.tags, preset.colorFamily, preset.typographyStyle],
})));

if (bases.length !== 200 || variants.length !== 5000) {
  throw new Error(`Expected 200 bases and 5,000 variants; got ${bases.length} and ${variants.length}`);
}

const out = join(process.cwd(), "public", "template-manifests");
mkdirSync(out, { recursive: true });
writeFileSync(join(out, "base-templates.json"), JSON.stringify(bases, null, 2));
writeFileSync(join(out, "templates.json"), JSON.stringify({ generatedAt: new Date().toISOString(), total: variants.length, variants }, null, 2));
console.log(`Generated ${bases.length} base configs and ${variants.length} selectable variants.`);
