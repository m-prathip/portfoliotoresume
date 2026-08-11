import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";
import { pool } from "../pool";

interface TemplateSeed {
  name: string;
  slug: string;
  category: string;
  description: string;
  htmlFile: string;
  cssFile: string;
}

const TEMPLATES_DIR = join(__dirname, "templates");

const SEEDS: TemplateSeed[] = [
  {
    name: "Classic Fresher ATS",
    slug: "classic-fresher-ats",
    category: "general",
    description: "A single-column, maximally ATS-safe layout. Safe default for any discipline.",
    htmlFile: "classic-fresher-ats.hbs",
    cssFile: "classic-fresher-ats.css",
  },
  {
    name: "Software Developer Fresher",
    slug: "software-developer-fresher",
    category: "software",
    description: "Leads with Projects and technical skills; accent color and monospace details for tech roles.",
    htmlFile: "software-developer-fresher.hbs",
    cssFile: "software-developer-fresher.css",
  },
  {
    name: "Business Fresher",
    slug: "business-fresher",
    category: "business",
    description: "Formal, centered layout with generous whitespace for business/finance/management roles.",
    htmlFile: "business-fresher.hbs",
    cssFile: "business-fresher.css",
  },
  {
    name: "Design Fresher",
    slug: "design-fresher",
    category: "design",
    description: "Bold heading and accent color for design/creative roles, while staying fully text-based and ATS-parseable.",
    htmlFile: "design-fresher.hbs",
    cssFile: "design-fresher.css",
  },
  {
    name: "Data & Analytics Fresher",
    slug: "data-analytics-fresher",
    category: "data",
    description: "Clean, labeled sections suited to data/analytics/AI-ML roles.",
    htmlFile: "data-analytics-fresher.hbs",
    cssFile: "data-analytics-fresher.css",
  },
];

async function seedTemplates() {
  for (const seed of SEEDS) {
    const htmlTemplate = readFileSync(join(TEMPLATES_DIR, seed.htmlFile), "utf-8");
    const cssStyles = readFileSync(join(TEMPLATES_DIR, seed.cssFile), "utf-8");

    await pool.query(
      `INSERT INTO templates (name, slug, category, description, html_template, css_styles, is_ats_safe, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true, true)
       ON CONFLICT (slug) DO UPDATE SET
         name = EXCLUDED.name,
         category = EXCLUDED.category,
         description = EXCLUDED.description,
         html_template = EXCLUDED.html_template,
         css_styles = EXCLUDED.css_styles,
         updated_at = now()`,
      [seed.name, seed.slug, seed.category, seed.description, htmlTemplate, cssStyles],
    );
    console.log(`Seeded template: ${seed.slug}`);
  }

  await pool.end();
}

seedTemplates().catch((err) => {
  console.error("Failed to seed templates:", err);
  process.exit(1);
});
