import { generateBaseTemplateConfigs, buildGeneratedTemplate } from "../src/template-system/templateFactory";
import { STYLE_PRESETS } from "../src/db/seed/seedStylePresets";

const bases = generateBaseTemplateConfigs();
const errors: string[] = [];
const slugs = new Set<string>();
const ids = new Set<string>();

for (const base of bases) {
  if (slugs.has(base.slug)) errors.push(`Duplicate base slug: ${base.slug}`);
  slugs.add(base.slug);
  const generated = buildGeneratedTemplate(base);
  if (!generated.htmlTemplate.includes(`data-template="${base.slug}"`)) errors.push(`Missing template marker: ${base.slug}`);
  if (!generated.cssStyles.includes(`data-template="${base.slug}"`)) errors.push(`Missing scoped CSS: ${base.slug}`);
  if (base.layoutType === "two-column" && base.sidebar === "none") errors.push(`Two-column base without sidebar: ${base.slug}`);
}

for (const base of bases) for (const preset of STYLE_PRESETS) {
  const id = `TMP-${base.slug}-${preset.slug}`;
  if (ids.has(id)) errors.push(`Duplicate variant id: ${id}`);
  ids.add(id);
}

if (bases.length !== 200) errors.push(`Expected 200 bases, got ${bases.length}`);
if (STYLE_PRESETS.length !== 25) errors.push(`Expected 25 presets, got ${STYLE_PRESETS.length}`);
if (ids.size !== 5000) errors.push(`Expected 5,000 variants, got ${ids.size}`);

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("Template validation passed: 200 bases, 25 presets, 5,000 unique variants.");
