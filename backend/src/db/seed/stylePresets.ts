// Style preset data for the template variant-generation engine.
//
// Each preset is a bundle of values for the same five CSS custom
// properties every base template's stylesheet already reads
// (--user-font-heading, --user-font-body, --user-color-primary,
// --user-color-accent, --user-spacing-unit). No new HTML/CSS per
// preset — see templateRenderer.buildStyleVariables and
// services/templateVariants.ts.
//
// Fonts are all Google Fonts under the SIL Open Font License, so every
// combination here is safe for commercial use (blueprint section 18).
//
// 15 color families (section 5's list) x 3 typography styles = 45
// presets. Crossed with the 5 seeded base layouts that's 225 selectable
// gallery templates today; adding base layout #6 raises that to 270
// with zero changes to this file.

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

interface ColorFamily {
  key: string;
  label: string;
  primary: string;
  accent: string;
}

// Section 5's color list, mapped to a primary (headings/borders/name)
// and accent (role line, section rules) hex pair. Kept to readable,
// print-safe tones — no low-contrast combinations (section 5's "do not
// create visually poor combinations" rule).
const COLOR_FAMILIES: ColorFamily[] = [
  { key: "black-white", label: "Black & White", primary: "#111111", accent: "#404040" },
  { key: "navy", label: "Navy", primary: "#1e2a4a", accent: "#33477a" },
  { key: "blue", label: "Blue", primary: "#1d4ed8", accent: "#2563eb" },
  { key: "royal-blue", label: "Royal Blue", primary: "#1e3a8a", accent: "#3b5bdb" },
  { key: "indigo", label: "Indigo", primary: "#3730a3", accent: "#4f46e5" },
  { key: "purple", label: "Purple", primary: "#6b21a8", accent: "#7e22ce" },
  { key: "green", label: "Green", primary: "#166534", accent: "#15803d" },
  { key: "emerald", label: "Emerald", primary: "#065f46", accent: "#059669" },
  { key: "teal", label: "Teal", primary: "#0f766e", accent: "#0d9488" },
  { key: "red", label: "Red", primary: "#991b1b", accent: "#b91c1c" },
  { key: "burgundy", label: "Burgundy", primary: "#6b1024", accent: "#8a1538" },
  { key: "orange", label: "Orange", primary: "#9a3412", accent: "#c2410c" },
  { key: "brown", label: "Brown", primary: "#5c3a21", accent: "#78502c" },
  { key: "gray", label: "Gray", primary: "#374151", accent: "#4b5563" },
  { key: "charcoal", label: "Charcoal", primary: "#1f2937", accent: "#374151" },
];

interface TypographyStyleDef {
  key: "classic" | "modern" | "minimal";
  label: string;
  fontHeading: string;
  fontBody: string;
  spacingUnit: string;
}

// Three typography personalities, each a licensed Google Fonts pairing.
const TYPOGRAPHY_STYLES: TypographyStyleDef[] = [
  {
    key: "classic",
    label: "Classic",
    fontHeading: "'Merriweather', Georgia, serif",
    fontBody: "'Source Sans 3', 'Source Sans Pro', Helvetica, sans-serif",
    spacingUnit: "14px",
  },
  {
    key: "modern",
    label: "Modern",
    fontHeading: "'Poppins', sans-serif",
    fontBody: "'Inter', sans-serif",
    spacingUnit: "14px",
  },
  {
    key: "minimal",
    label: "Minimal",
    fontHeading: "'Inter', sans-serif",
    fontBody: "'Inter', sans-serif",
    spacingUnit: "12px",
  },
];

export const STYLE_PRESETS: StylePresetSeed[] = COLOR_FAMILIES.flatMap((color) =>
  TYPOGRAPHY_STYLES.map((typo) => ({
    slug: `${color.key}-${typo.key}`,
    name: `${color.label} ${typo.label}`,
    colorFamily: color.key,
    typographyStyle: typo.key,
    fontHeading: typo.fontHeading,
    fontBody: typo.fontBody,
    colorPrimary: color.primary,
    colorAccent: color.accent,
    spacingUnit: typo.spacingUnit,
  })),
);
