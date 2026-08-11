import "dotenv/config";
import { pool } from "../pool";
import { buildGeneratedTemplate, generateBaseTemplateConfigs, expectedBaseTemplateCount } from "../../template-system/templateFactory";

async function main() {
  const configs = generateBaseTemplateConfigs();
  if (configs.length !== expectedBaseTemplateCount() || configs.length !== 200) {
    throw new Error(`Expected 200 generated base layouts, got ${configs.length}`);
  }

  for (const config of configs) {
    const generated = buildGeneratedTemplate(config);
    await pool.query(
      `INSERT INTO templates
       (name, slug, category, subcategory, description, html_template, css_styles, is_ats_safe, ats_level,
        recommended_roles, tags, template_config, license_source, license_author, commercial_use_allowed,
        modification_allowed, redistribution_allowed, attribution_required, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'original',$13,true,true,true,false,true)
       ON CONFLICT (slug) DO UPDATE SET
         name=EXCLUDED.name, category=EXCLUDED.category, subcategory=EXCLUDED.subcategory,
         description=EXCLUDED.description, html_template=EXCLUDED.html_template, css_styles=EXCLUDED.css_styles,
         is_ats_safe=EXCLUDED.is_ats_safe, ats_level=EXCLUDED.ats_level, recommended_roles=EXCLUDED.recommended_roles,
         tags=EXCLUDED.tags, template_config=EXCLUDED.template_config, updated_at=now()`,
      [
        config.templateName, config.slug, config.category, config.subcategory, config.description,
        generated.htmlTemplate, generated.cssStyles, config.atsLevel === "excellent" || config.atsLevel === "good",
        config.atsLevel, config.recommendedRoles, config.tags, JSON.stringify(config), config.license.author,
      ],
    );
  }

  console.log(`Seeded ${configs.length} original base layouts.`);
  console.log("With 25 curated style presets this produces exactly 5,000 selectable variants.");
  await pool.end();
}

main().catch((error) => { console.error(error); process.exit(1); });
