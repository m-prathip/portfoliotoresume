import { createHash } from "crypto";
import { generateBaseTemplateConfigs, buildGeneratedTemplate } from "../src/template-system/templateFactory";

const bases = generateBaseTemplateConfigs();
const hashes = new Map<string, string>();
const duplicateGroups: string[][] = [];

for (const base of bases) {
  const generated = buildGeneratedTemplate(base);
  const normalized = JSON.stringify({
    layoutType: base.layoutType,
    sidebar: base.sidebar,
    sidebarWidth: base.sidebarWidth,
    headerVariant: base.headerVariant,
    sectionTitleVariant: base.sectionTitleVariant,
    sectionOrder: base.sectionOrder,
    sidebarSections: base.sidebarSections,
    html: generated.htmlTemplate.replace(/data-template="[^"]+"/g, 'data-template="BASE"'),
    css: generated.cssStyles.replace(/data-template="[^"]+"/g, 'data-template="BASE"'),
  });
  const hash = createHash("sha256").update(normalized).digest("hex");
  const previous = hashes.get(hash);
  if (previous) {
    duplicateGroups.push([previous, base.slug]);
  } else {
    hashes.set(hash, base.slug);
  }
}

if (duplicateGroups.length) {
  console.error("Duplicate base-layout groups detected:", JSON.stringify(duplicateGroups, null, 2));
  process.exit(1);
}
console.log(`Duplicate detection passed: ${bases.length} structurally unique bases.`);
