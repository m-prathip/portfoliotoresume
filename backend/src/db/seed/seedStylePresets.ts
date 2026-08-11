import "dotenv/config";
import { pool } from "../pool";

export interface StylePresetSeed {
  slug: string;
  name: string;
  colorFamily: string;
  typographyStyle: "classic" | "modern" | "minimal";
  fontHeading: string;
  fontBody: string;
  colorPrimary: string;
  colorAccent: string;
  spacingUnit: string;
}

const palettes = [
  ["black-white", "Black & White", "#111111", "#404040"],
  ["navy", "Navy", "#1e2a4a", "#33477a"],
  ["blue", "Blue", "#1d4ed8", "#2563eb"],
  ["royal-blue", "Royal Blue", "#1e3a8a", "#3b5bdb"],
  ["indigo", "Indigo", "#3730a3", "#4f46e5"],
  ["purple", "Purple", "#6b21a8", "#7e22ce"],
  ["green", "Green", "#166534", "#15803d"],
  ["emerald", "Emerald", "#065f46", "#059669"],
  ["teal", "Teal", "#0f766e", "#0d9488"],
  ["burgundy", "Burgundy", "#6b1024", "#8a1538"],
  ["charcoal", "Charcoal", "#1f2937", "#374151"],
  ["gray", "Gray", "#374151", "#4b5563"],
  ["orange", "Orange", "#9a3412", "#c2410c"],
  ["red", "Red", "#991b1b", "#b91c1c"],
  ["brown", "Brown", "#5c3a21", "#78502c"],
] as const;

const typography = {
  classic: { heading: "'Merriweather', Georgia, serif", body: "'Source Sans 3', Arial, sans-serif", spacing: "14px" },
  modern: { heading: "'Poppins', Arial, sans-serif", body: "'Inter', Arial, sans-serif", spacing: "13px" },
  minimal: { heading: "'Inter', Arial, sans-serif", body: "'Inter', Arial, sans-serif", spacing: "11px" },
};

// Curated 25-preset production set. 200 bases x 25 = exactly 5,000 variants.
const selected = [
  ["black-white", "classic"], ["navy", "classic"], ["blue", "classic"], ["royal-blue", "classic"], ["charcoal", "classic"],
  ["black-white", "modern"], ["navy", "modern"], ["blue", "modern"], ["indigo", "modern"], ["purple", "modern"],
  ["green", "modern"], ["emerald", "modern"], ["teal", "modern"], ["burgundy", "modern"], ["charcoal", "modern"],
  ["black-white", "minimal"], ["navy", "minimal"], ["blue", "minimal"], ["royal-blue", "minimal"], ["gray", "minimal"],
  ["indigo", "minimal"], ["green", "minimal"], ["teal", "minimal"], ["burgundy", "minimal"], ["charcoal", "minimal"],
] as const;

export const STYLE_PRESETS: StylePresetSeed[] = selected.map(([colorKey, type]) => {
  const palette = palettes.find((p) => p[0] === colorKey)!;
  const typo = typography[type];
  return {
    slug: `${colorKey}-${type}`,
    name: `${palette[1]} ${type[0].toUpperCase()}${type.slice(1)}`,
    colorFamily: colorKey,
    typographyStyle: type,
    fontHeading: typo.heading,
    fontBody: typo.body,
    colorPrimary: palette[2],
    colorAccent: palette[3],
    spacingUnit: typo.spacing,
  };
});

async function main() {
  if (STYLE_PRESETS.length !== 25) throw new Error(`Expected 25 presets, got ${STYLE_PRESETS.length}`);
  const activeSlugs = STYLE_PRESETS.map((p) => p.slug);
  await pool.query(`UPDATE style_presets SET is_active = false WHERE slug <> ALL($1::text[])`, [activeSlugs]);
  for (const preset of STYLE_PRESETS) {
    await pool.query(
      `INSERT INTO style_presets (slug,name,color_family,typography_style,font_heading,font_body,color_primary,color_accent,spacing_unit,is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true)
       ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name,color_family=EXCLUDED.color_family,
       typography_style=EXCLUDED.typography_style,font_heading=EXCLUDED.font_heading,font_body=EXCLUDED.font_body,
       color_primary=EXCLUDED.color_primary,color_accent=EXCLUDED.color_accent,spacing_unit=EXCLUDED.spacing_unit,updated_at=now()`,
      [preset.slug,preset.name,preset.colorFamily,preset.typographyStyle,preset.fontHeading,preset.fontBody,preset.colorPrimary,preset.colorAccent,preset.spacingUnit],
    );
  }
  console.log("Seeded 25 curated style presets; 200 bases will produce 5,000 variants.");
  await pool.end();
}
main().catch((err) => { console.error(err); process.exit(1); });
