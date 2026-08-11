/**
 * Compatibility-aware template generation reference implementation.
 *
 * This is intentionally pure: it produces JSON configuration, not executable
 * code. A production worker can call it for batch generation and then pass
 * each result through schema/render/license/duplicate gates.
 */

export interface GenerationDimension {
  id: string;
  values: string[];
}

export interface BaseTemplateDefinition {
  id: string;
  name: string;
  category: string;
  supportedLayouts: string[];
  supportedTypography: string[];
  supportedColors: string[];
  supportedSpacing: string[];
}

export interface GeneratedTemplate {
  templateId: string;
  baseTemplateId: string;
  name: string;
  combination: Record<string, string>;
  configHash: string;
}

export function buildCombinationKey(
  base: BaseTemplateDefinition,
  combination: Record<string, string>,
): string {
  return [
    base.id,
    combination.typography,
    combination.color,
    combination.spacing,
    combination.layout,
    combination.header,
    combination.sections,
  ].join("|");
}

export function generateCombinations(
  bases: BaseTemplateDefinition[],
  dimensions: Record<string, string[]>,
): GeneratedTemplate[] {
  const result: GeneratedTemplate[] = [];
  const seen = new Set<string>();
  let sequence = 1;

  for (const base of bases) {
    for (const typography of base.supportedTypography) {
      for (const color of base.supportedColors) {
        for (const spacing of base.supportedSpacing) {
          for (const layout of base.supportedLayouts) {
            const combination = {
              typography,
              color,
              spacing,
              layout,
              header: "default",
              sections: "default",
            };

            const key = buildCombinationKey(base, combination);
            if (seen.has(key)) continue;
            seen.add(key);

            result.push({
              templateId: `TMP-${String(sequence++).padStart(6, "0")}`,
              baseTemplateId: base.id,
              name: `${base.name} — ${typography} ${color}`,
              combination,
              configHash: key,
            });
          }
        }
      }
    }
  }

  return result;
}
