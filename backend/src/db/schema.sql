-- Portfolio-to-Fresher-Resume Platform
-- Phase 1 schema: users, portfolios, resumes, templates, resume_versions

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    full_name       TEXT,
    target_role     TEXT,
    phone           TEXT,
    location        TEXT,
    linkedin_url    TEXT,
    github_url      TEXT,
    portfolio_url   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- portfolios
-- Raw crawled/extracted evidence from a student's public portfolio URL.
-- Kept separate from the structured resume so Truth Guard can always
-- trace a resume claim back to its original source.
-- ============================================================
CREATE TABLE IF NOT EXISTS portfolios (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_url      TEXT NOT NULL,
    raw_content     JSONB NOT NULL,        -- crawler output, pre-AI-structuring
    crawl_status    TEXT NOT NULL DEFAULT 'pending'
                        CHECK (crawl_status IN ('pending', 'success', 'failed', 'partial')),
    crawled_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);

-- ============================================================
-- templates
-- The fresher-focused template library (Phase 3 renders against these).
-- ============================================================
CREATE TABLE IF NOT EXISTS templates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,             -- e.g. "Classic Fresher ATS"
    slug            TEXT NOT NULL UNIQUE,
    category        TEXT,
    subcategory     TEXT,
    description     TEXT,
    html_template   TEXT NOT NULL,              -- HTML w/ design tokens, semantic layer
    css_styles      TEXT NOT NULL,
    is_ats_safe     BOOLEAN NOT NULL DEFAULT true,
    ats_level       TEXT NOT NULL DEFAULT 'good' CHECK (ats_level IN ('excellent', 'good', 'moderate', 'creative')),
    recommended_roles TEXT[] NOT NULL DEFAULT '{}',
    tags            TEXT[] NOT NULL DEFAULT '{}',
    template_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    preview_url     TEXT,
    thumbnail_url   TEXT,
    license_source  TEXT NOT NULL DEFAULT 'original',
    license_author  TEXT NOT NULL DEFAULT 'Portfolio Resume Platform',
    license_url     TEXT,
    commercial_use_allowed BOOLEAN NOT NULL DEFAULT true,
    modification_allowed BOOLEAN NOT NULL DEFAULT true,
    redistribution_allowed BOOLEAN NOT NULL DEFAULT true,
    attribution_required BOOLEAN NOT NULL DEFAULT false,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- resumes
-- The current, editable structured Resume JSON for a user.
-- content follows the Student Information Model: personal, education,
-- skills, projects, internships, certifications, achievements, activities.
-- ============================================================
CREATE TABLE IF NOT EXISTS resumes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    portfolio_id    UUID REFERENCES portfolios(id) ON DELETE SET NULL,
    template_id     UUID REFERENCES templates(id) ON DELETE SET NULL,
    title           TEXT NOT NULL DEFAULT 'Untitled Resume',
    target_job_role TEXT,
    job_description TEXT,
    content         JSONB NOT NULL DEFAULT '{}'::jsonb,  -- structured Resume JSON
    style_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,  -- visual layer: font/color/spacing (Phase 3/4)
    ats_score       INTEGER,
    status          TEXT NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft', 'reviewed', 'finalized')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_portfolio_id ON resumes(portfolio_id);

-- ============================================================
-- resume_versions
-- Immutable snapshots of resume.content at each save/export, so Truth
-- Guard's evidence mapping and undo history always point at a fixed state.
-- ============================================================
CREATE TABLE IF NOT EXISTS resume_versions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id       UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    version_number  INTEGER NOT NULL,
    content_snapshot JSONB NOT NULL,
    change_summary  TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (resume_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_resume_versions_resume_id ON resume_versions(resume_id);

-- ============================================================
-- updated_at trigger helper
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_portfolios_updated_at ON portfolios;
CREATE TRIGGER trg_portfolios_updated_at BEFORE UPDATE ON portfolios
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_templates_updated_at ON templates;
CREATE TRIGGER trg_templates_updated_at BEFORE UPDATE ON templates
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_resumes_updated_at ON resumes;
CREATE TRIGGER trg_resumes_updated_at BEFORE UPDATE ON resumes
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- Phase 4 migration: style_overrides was added after some deployments may
-- have already run this file. IF NOT EXISTS keeps re-runs safe either way.
-- ============================================================
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS style_overrides JSONB NOT NULL DEFAULT '{}'::jsonb;

-- ============================================================
-- style_presets  (Phase 5: template variant-generation engine)
--
-- A preset is a bundle of the exact same design tokens templateRenderer's
-- buildStyleVariables() already knows how to inject as --user-* CSS
-- variables. It does NOT contain any HTML/CSS of its own — every base
-- template's stylesheet already reads these variables with fallbacks,
-- so a preset is just a named, curated set of values for them.
--
-- A "selectable template" in the gallery = one templates row (base layout)
-- crossed with one style_presets row (variant). That cross-product is
-- computed at request time by templateVariants.ts — nothing here stores
-- 2,000-5,000 duplicated rows or duplicated html_template/css_styles.
-- ============================================================
CREATE TABLE IF NOT EXISTS style_presets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            TEXT NOT NULL UNIQUE,       -- e.g. "navy-classic"
    name            TEXT NOT NULL,              -- e.g. "Navy Classic"
    color_family    TEXT NOT NULL,              -- e.g. "navy" (section 5 taxonomy)
    typography_style TEXT NOT NULL              -- "classic" | "modern" | "minimal"
                        CHECK (typography_style IN ('classic', 'modern', 'minimal')),
    font_heading    TEXT NOT NULL,
    font_body       TEXT NOT NULL,
    color_primary   TEXT NOT NULL,
    color_accent    TEXT NOT NULL,
    spacing_unit    TEXT NOT NULL DEFAULT '14px',
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_style_presets_updated_at ON style_presets;
CREATE TRIGGER trg_style_presets_updated_at BEFORE UPDATE ON style_presets
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- Template-library expansion migration; safe to run against existing installations.
ALTER TABLE templates ADD COLUMN IF NOT EXISTS subcategory TEXT;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS ats_level TEXT NOT NULL DEFAULT 'good';
ALTER TABLE templates ADD COLUMN IF NOT EXISTS recommended_roles TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE templates ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE templates ADD COLUMN IF NOT EXISTS template_config JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS preview_url TEXT;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS license_source TEXT NOT NULL DEFAULT 'original';
ALTER TABLE templates ADD COLUMN IF NOT EXISTS license_author TEXT NOT NULL DEFAULT 'Portfolio Resume Platform';
ALTER TABLE templates ADD COLUMN IF NOT EXISTS license_url TEXT;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS commercial_use_allowed BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS modification_allowed BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS redistribution_allowed BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS attribution_required BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_ats_level ON templates(ats_level);
CREATE INDEX IF NOT EXISTS idx_templates_tags ON templates USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_templates_recommended_roles ON templates USING GIN(recommended_roles);
