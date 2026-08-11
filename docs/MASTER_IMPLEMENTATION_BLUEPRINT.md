# Resume Builder Template Ecosystem — Production Implementation Blueprint

## 0. Purpose

This document is the implementation contract for turning the current Portfolio Resume Platform into a student-first, Canva-like resume builder with **200+ original base layouts** and **2,000–5,000+ selectable variations**.

The current repository already contains a strong Phase 1–4 foundation:
- Next.js + TypeScript frontend
- Express + TypeScript backend
- PostgreSQL
- structured `ResumeContent`
- Handlebars-based rendering
- style presets / base × preset variant generation
- drag-and-drop section ordering
- autosave/versioning
- ATS diagnostics
- Playwright PDF export
- portfolio crawler + AI structuring + Truth Guard

It is **not yet a complete implementation of the requested 30-deliverable template ecosystem**. The main gaps are called out in `IMPLEMENTATION_GAP_REPORT.md`.

---

# 1. Product Architecture

```text
Browser
  │
  ├── Template Gallery
  │     ├── Search
  │     ├── Facets
  │     ├── Role recommendations
  │     └── Thumbnail-first cards
  │
  ├── Resume Editor
  │     ├── Semantic data editor
  │     ├── Visual style controls
  │     ├── Section drag/drop
  │     ├── Undo/redo history
  │     └── Live canvas
  │
  └── Export
        ├── ATS diagnostics
        ├── PDF
        └── Print

Next.js API client
        │
        ▼
Express API
  ├── Resume service
  ├── Template catalog service
  ├── Recommendation service
  ├── ATS service
  ├── Admin template service
  ├── License registry
  └── Preview service
        │
        ├── PostgreSQL
        │     ├── templates
        │     ├── template_variants (optional materialized cache)
        │     ├── style_presets
        │     ├── template_licenses
        │     ├── template_tags
        │     └── template_audits
        │
        └── Object storage / CDN
              ├── thumbnails
              ├── previews
              └── generated exports
```

## Architectural rule

A template is **data + reusable renderer configuration**, never arbitrary executable JavaScript.

---

# 2. Template Architecture

Use five layers:

1. **Base layout** — information hierarchy and page geometry.
2. **Design tokens** — fonts, colors, spacing, borders, radii.
3. **Section configuration** — which sections appear and where.
4. **Variation profile** — controlled combination of tokens and layout knobs.
5. **Runtime user overrides** — user-specific changes.

```text
BaseLayout
 + LayoutProfile
 + TypographyTheme
 + ColorTheme
 + SpacingTheme
 + SectionProfile
 = GeneratedTemplateVariant
```

Base layouts must be genuinely different. Color-only duplicates do not count as new base layouts.

---

# 3. 200-Base-Layout Strategy

Target exactly:

| Family | Base layouts |
|---|---:|
| ATS | 50 |
| Student / Fresher | 50 |
| Technology | 40 |
| Business | 20 |
| Creative | 20 |
| Academic | 10 |
| International | 10 |
| **Total** | **200** |

### ATS 50
Create variations around:
- single-column hierarchy
- compact single-column
- classic corporate
- technical ATS
- chronological
- skills-first
- education-first
- project-first
- summary-first
- hybrid ATS
- no-sidebar two-column only where reading order remains linear

### Student/Fresher 50
Prioritize:
- engineering
- internship
- campus placement
- project-heavy
- education-heavy
- CGPA-forward
- certification-forward
- hackathon-forward
- leadership-forward
- portfolio-forward

### Technology 40
Include:
- software
- frontend
- backend
- full stack
- AI
- ML
- data science
- data analytics
- data engineering
- cloud
- DevOps
- cybersecurity
- UI/UX

### Business 20
Include:
- business analyst
- finance
- marketing
- sales
- HR
- operations
- management

### Creative 20
Include:
- modern
- minimal
- portfolio
- designer
- editorial
- restrained creative

### Academic 10
Include:
- research
- academic CV
- undergraduate
- postgraduate
- research internship

### International 10
Create localized but non-legal-advice layouts for:
- India
- US
- UK
- Canada
- Europe
- international/general

Regional variants must not insert prohibited or unnecessary personal data by default.

---

# 4. 2,000–5,000 Generation Strategy

Do not write 5,000 independent files.

A practical production target:

```text
200 base layouts
× 5 typography profiles
× 4 color profiles
× 2 spacing profiles
= 8,000 theoretical combinations
```

Use a **curated selection registry** to publish the best 2,000 initially and expand to 5,000 later.

A combination is publishable only when:
- it passes schema validation
- it passes visual rendering checks
- it has adequate contrast
- it does not duplicate another combination
- the base layout supports the chosen theme
- ATS classification is consistent
- licensing metadata is complete
- its role/category tags are meaningful

The current repository's 5 bases × 45 presets = 225 variants is therefore a prototype, not the final 2,000–5,000 library.

---

# 5. Category Taxonomy

Canonical taxonomy:

```text
ATS
Student
Technology
Business
Creative
Academic
International
```

Role tags:

```text
AI Engineer
Machine Learning Engineer
Data Scientist
Data Analyst
Data Engineer
Software Developer
Frontend Developer
Backend Developer
Full Stack Developer
Cloud Engineer
DevOps Engineer
Cybersecurity
UI/UX Designer
Business Analyst
Finance
Marketing
Sales
HR
Operations
Researcher
Intern
Graduate
```

Education tags:

```text
AI & Data Science
Computer Science
Information Technology
Electronics
Electrical
Mechanical
Civil
Business
Finance
Design
```

Style tags:

```text
minimal
modern
professional
corporate
creative
technical
academic
compact
project-focused
education-focused
ATS
```

---

# 6. Template JSON Schema

Canonical generated template shape:

```json
{
  "schemaVersion": "1.0.0",
  "templateId": "TMP-000001",
  "baseTemplateId": "tech-fresher-017",
  "name": "Tech Fresher Minimal Navy",
  "category": "Technology",
  "subcategory": "Software Developer",
  "layout": {
    "type": "two-column",
    "readingOrder": "main-then-sidebar",
    "sidebar": "left",
    "sidebarWidth": 32,
    "page": {
      "size": "A4",
      "margin": {
        "top": 18,
        "right": 18,
        "bottom": 18,
        "left": 18
      }
    }
  },
  "tokens": {
    "fontHeading": "Inter",
    "fontBody": "Inter",
    "fontSizeBody": 10,
    "fontSizeHeading": 15,
    "lineHeight": 1.4,
    "letterSpacing": 0,
    "accentColor": "#1D4ED8",
    "textColor": "#111827",
    "mutedColor": "#4B5563",
    "backgroundColor": "#FFFFFF",
    "sectionSpacing": 12,
    "itemSpacing": 6
  },
  "header": {
    "variant": "left-name-role-contact-row"
  },
  "sections": [
    {
      "id": "summary",
      "component": "ProfileSection",
      "enabled": true,
      "column": "main",
      "order": 10,
      "title": "Professional Summary"
    },
    {
      "id": "education",
      "component": "EducationSection",
      "enabled": true,
      "column": "main",
      "order": 20,
      "title": "Education"
    },
    {
      "id": "projects",
      "component": "ProjectSection",
      "enabled": true,
      "column": "main",
      "order": 30,
      "title": "Projects"
    }
  ],
  "metadata": {
    "atsLevel": "excellent",
    "recommendedRoles": ["Software Developer", "Full Stack Developer"],
    "experienceLevel": ["Fresher", "Intern"],
    "tags": ["student", "technical", "project-focused", "ats"],
    "isPremium": false
  },
  "license": {
    "type": "original",
    "source": "internal",
    "commercialUseAllowed": true,
    "modificationAllowed": true,
    "redistributionAllowed": true,
    "attributionRequired": false
  }
}
```

The JSON Schema is also provided as `backend/src/template-system/template.schema.json`.

---

# 7. React Component Architecture

The visual renderer should use reusable components:

```text
ResumeRenderer
ResumePage
ResumeHeader
ProfileSection
EducationSection
ExperienceSection
InternshipSection
ProjectSection
SkillsSection
CertificationSection
AchievementSection
LanguageSection
LeadershipSection
PublicationSection
CourseSection
ContactSection
SocialLinks
SectionTitle
Timeline
Divider
Icon
SkillChip
SkillList
Sidebar
```

The semantic data remains separate from the visual template.

## Important editor principle

The current application uses structured forms + preview. That is a sound semantic architecture, but it is not yet a full Canva-style direct manipulation editor.

For the production editor, introduce an editor document model:

```text
ResumeDocument
 ├── pages
 │    ├── nodes
 │    │    ├── section
 │    │    ├── text
 │    │    ├── shape
 │    │    ├── icon
 │    │    └── image
 │    └── constraints
 ├── theme
 └── metadata
```

Use stable node IDs and commands for:
- insert
- update
- delete
- duplicate
- move
- resize
- reorder

The semantic resume remains the source for ATS/exportable text.

---

# 8. Database Schema

Production tables:

```text
users
portfolios
resumes
resume_versions

templates
style_presets
template_variants          optional materialized catalog
template_tags
template_roles
template_licenses
template_assets
template_validation_runs
template_duplicate_checks
template_versions
template_audit_log
template_favorites
template_usage
```

Recommended template columns:

```text
id
template_id
base_template_id
name
slug
category
subcategory
layout_type
template_config JSONB
style_config JSONB
section_config JSONB
ats_level
ats_score
recommended_roles TEXT[]
tags TEXT[]
preview_url
thumbnail_url
is_free
is_premium
is_active
license_id
version
created_at
updated_at
```

Use JSONB for flexible configuration but keep high-volume search fields as indexed columns.

---

# 9. Template Generation Algorithm

```text
load active base layouts
load approved typography profiles
load approved color themes
load spacing profiles
load section profiles

for each base:
    enumerate compatible combinations
    build normalized configuration
    calculate deterministic fingerprint
    validate
    calculate ATS classification
    check license
    check duplicate fingerprint
    enqueue preview render
    publish only if all gates pass
```

Deterministic ID:

```text
SHA-256(
  baseTemplateId +
  typographyId +
  colorId +
  spacingId +
  layoutProfileId +
  sectionProfileId
)
```

Human-readable ID:

```text
TMP-000001
```

The database stores both the public ID and immutable configuration hash.

---

# 10. Variation-Generation Algorithm

Variation dimensions:

```text
Typography:
  family
  pairing
  size
  weight
  line-height
  letter-spacing

Color:
  primary
  accent
  muted
  background
  divider

Layout:
  one-column
  two-column
  sidebar position
  sidebar width
  header position
  section ordering

Spacing:
  compact
  normal
  spacious

Header:
  large-name
  compact
  centered
  role-under-name
  contact-row

Section:
  title style
  divider style
  timeline
  cards
  bullets
  chips
```

Never combine incompatible options blindly. Each base layout declares a compatibility matrix.

---

# 11. Preview-Generation System

Pipeline:

```text
TemplateConfig
    ↓
Render sample resume
    ↓
Playwright Chromium
    ↓
A4 / Letter screenshot
    ↓
thumbnail.webp
preview.webp
    ↓
object storage
    ↓
CDN URL
```

Generate:
- 320px thumbnail
- 768px preview
- optional 1200px high-quality preview

Do not store large preview blobs in PostgreSQL.

---

# 12. Search / Filter System

Required filters:

```text
q
category
subcategory
role
education
experienceLevel
atsLevel
color
layout
columns
style
isFree
isPremium
sort
page
pageSize
```

Recommended backend endpoint:

```http
GET /api/templates
GET /api/templates/facets
GET /api/templates/:id
GET /api/templates/recommended
```

Use PostgreSQL indexes and, at larger scale, PostgreSQL full-text search or a search engine.

---

# 13. Recommendation System

Input:

```json
{
  "role": "AI Engineer",
  "experienceLevel": "Fresher",
  "education": "AI & Data Science",
  "atsRequired": true
}
```

Scoring:

```text
role match                 30
experience match           20
education match            10
ATS match                  20
style preference           10
popularity / quality       10
```

Return top 5–20 templates.

Never recommend a template merely because it has a high usage count if it fails the user's ATS/style constraints.

---

# 14. ATS Classification

Classification:

```text
ATS Excellent
ATS Good
ATS Moderate
Creative
```

Checks:

```text
semantic headings
reading order
text extractability
image dependence
contrast
font availability
column complexity
tables
decorative elements
overflow
contact information
```

The application must display:

> ATS compatibility is an estimate based on structural checks. No template can guarantee compatibility with every ATS.

Never market an internal numeric score as a guaranteed employer ATS score.

---

# 15. License Tracking System

Every non-original asset/design must have:

```text
source
author
repository
license
licenseUrl
commercialUseAllowed
modificationAllowed
redistributionAllowed
attributionRequired
attributionText
reviewedBy
reviewedAt
evidenceUrl
```

Preferred:
- Original internal designs
- MIT
- Apache-2.0
- BSD
- CC0
- licenses explicitly allowing commercial modification and redistribution

Do not import a design simply because it is downloadable for free.

---

# 16. Duplicate Detection

Use two levels:

### Exact/config duplicate

Normalize JSON and hash it.

### Visual duplicate

Render preview → perceptual hash / image similarity.

A variant is rejected if:
- normalized config is identical
- visual similarity exceeds the configured threshold without meaningful structural difference

Keep duplicate-check results in the database for auditability.

---

# 17. Quality Validation

Automated gates:

### JSON
- schema valid
- required fields
- unique IDs
- known component names
- valid colors
- valid fonts

### Rendering
- no clipping
- no overflow
- no overlap
- valid page dimensions
- minimum text contrast
- stable page count

### Resume quality
- readable hierarchy
- sensible section spacing
- no fake skill bars for ATS templates
- no critical content embedded in images

### Accessibility
- contrast checks
- semantic headings
- keyboard-accessible editor controls
- meaningful labels

---

# 18. Folder Structure

Target structure:

```text
resume-builder/
├── docs/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── editor/
│       │   ├── resume/
│       │   └── templates/
│       ├── store/
│       ├── hooks/
│       ├── lib/
│       └── types/
│
├── backend/
│   ├── src/
│   │   ├── db/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── template-system/
│   │   ├── middleware/
│   │   ├── crawler/
│   │   └── llm/
│   └── scripts/
│
└── storage/
    └── template-previews/
```

---

# 19. API Design

### Public catalog

```http
GET    /api/templates
GET    /api/templates/facets
GET    /api/templates/:templateId
GET    /api/templates/recommended
POST   /api/templates/:templateId/favorite
DELETE /api/templates/:templateId/favorite
```

### Admin

```http
POST   /api/admin/templates
PATCH  /api/admin/templates/:id
DELETE /api/admin/templates/:id
POST   /api/admin/templates/generate
POST   /api/admin/templates/:id/validate
POST   /api/admin/templates/:id/preview
POST   /api/admin/templates/duplicates
GET    /api/admin/templates/licenses
POST   /api/admin/templates/licenses
```

Admin routes must require authenticated admin authorization.

---

# 20. Admin Template Management

Admin dashboard should provide:

```text
Draft
Review
Validation failed
Preview queued
Approved
Published
Archived
```

Admin actions:
- create base
- edit configuration
- clone base
- generate variations
- validate
- preview
- inspect license
- compare duplicates
- publish/unpublish
- version
- rollback

No template should become public solely because it was inserted into the database.

---

# 21. Performance Optimization

For 5,000+ templates:

- paginate API results
- virtualize gallery
- lazy-load thumbnails
- CDN cache previews
- cache facets
- cache active template metadata
- load full config only after selection
- avoid rendering all 5,000 templates
- pre-generate thumbnails
- background preview jobs
- use immutable asset URLs
- use database indexes

The current base × preset approach is a good starting point, but 200 bases should not be expanded into 5,000 large HTML/CSS blobs.

---

# 22. Security Architecture

Template configurations are data.

Never evaluate:
- JavaScript
- arbitrary JSX
- arbitrary Node code
- unsafe SVG scripts
- untrusted CSS expressions

Sanitize user resume content before rendering.

Use:
- strict CSP
- sandboxed preview iframe
- output escaping
- allowlisted component IDs
- allowlisted fonts
- allowlisted CSS tokens
- SSRF protection for external imports
- authenticated admin routes
- rate limiting
- audit logs

---

# 23. Deployment Architecture

Recommended:

```text
Vercel
  └── Next.js frontend

Render / Railway / Fly.io
  └── Node + Express backend

Managed PostgreSQL
  └── application database

Object Storage + CDN
  └── template thumbnails/previews

Background worker
  └── preview generation / duplicate checks / batch generation
```

For the existing project, keep Vercel + Render + PostgreSQL if operationally suitable rather than rewriting infrastructure.

---

# 24. Development Roadmap

### Phase A — Foundation
- schema
- template registry
- design tokens
- base layout contracts
- licensing

### Phase B — Library
- first 25 bases
- 100–250 curated variants
- preview pipeline

### Phase C — Student-first expansion
- 50 student/fresher bases
- role taxonomy
- recommendation engine

### Phase D — Full library
- 200 bases
- 2,000 curated variants
- quality gates

### Phase E — Scale
- 5,000 variants
- CDN
- background workers
- admin moderation

### Phase F — Advanced editor
- direct canvas editing
- node selection
- resize/move
- undo/redo command history
- multi-page layout controls

---

# 25. Sample Base Template

```json
{
  "baseTemplateId": "student-project-001",
  "name": "Student Project Focus",
  "category": "Student",
  "layoutType": "single-column",
  "atsLevel": "excellent",
  "headerVariant": "large-left",
  "sectionProfile": [
    "summary",
    "education",
    "projects",
    "skills",
    "internships",
    "certifications",
    "achievements"
  ],
  "compatibility": {
    "sidebar": false,
    "timeline": false,
    "skillBars": false,
    "photo": false
  }
}
```

---

# 26. Sample Generated Variation

```json
{
  "templateId": "TMP-000742",
  "baseTemplateId": "student-project-001",
  "name": "Student Project Focus — Navy Inter",
  "variation": {
    "typography": "modern-inter",
    "color": "navy",
    "spacing": "compact",
    "header": "large-left"
  },
  "metadata": {
    "atsLevel": "excellent",
    "roles": [
      "Software Developer",
      "AI Engineer",
      "Data Analyst"
    ]
  }
}
```

---

# 27. Example Database Record

```json
{
  "template_id": "TMP-000742",
  "base_template_id": "student-project-001",
  "name": "Student Project Focus — Navy Inter",
  "category": "Student",
  "subcategory": "Engineering Fresher",
  "layout_type": "single-column",
  "ats_level": "excellent",
  "tags": ["fresher", "projects", "engineering", "ats"],
  "is_free": true,
  "is_premium": false,
  "license_id": "LIC-ORIGINAL-INTERNAL",
  "version": 1
}
```

---

# 28. Example API

```http
GET /api/templates?role=AI%20Engineer&experienceLevel=Fresher&atsLevel=excellent&page=1&pageSize=24
```

Example response:

```json
{
  "items": [],
  "page": 1,
  "pageSize": 24,
  "total": 2000,
  "filters": {
    "role": "AI Engineer",
    "experienceLevel": "Fresher",
    "atsLevel": "excellent"
  }
}
```

---

# 29. Testing Strategy

### Unit
- schema validation
- ID generation
- variation compatibility
- recommendation scoring
- license gates
- duplicate hashes
- ATS classification

### Integration
- template catalog API
- template resolution
- resume save
- preview generation
- PDF export
- admin authorization

### Visual regression
- render every published base
- render representative variants
- screenshot compare
- fail on unexpected layout shift

### Security
- XSS payloads in every editable field
- unsafe SVG
- malicious template config
- SSRF
- unauthorized admin requests
- rate limiting

### Load
Benchmark:
- 5,000 catalog records
- concurrent gallery requests
- concurrent preview generation
- concurrent PDF export

---

# 30. Existing Project Integration Rules

Before changing code:

1. Inspect the existing architecture.
2. Reuse Next.js.
3. Reuse Express.
4. Reuse PostgreSQL.
5. Reuse current `ResumeContent`.
6. Reuse Handlebars rendering where appropriate.
7. Reuse Zustand.
8. Reuse dnd-kit.
9. Reuse Playwright for rendering.
10. Preserve current portfolio crawler / Truth Guard.
11. Preserve existing authentication when it is introduced.
12. Avoid replacing working infrastructure.

The current repository already follows this philosophy and should be extended rather than rewritten.

---

# Final Acceptance Criteria

The system is considered ready for the 2,000-template target only when:

- 200 real base layouts exist
- each base has documented structure and compatibility
- at least 2,000 curated variants pass all validation gates
- no variant relies on unauthorized copyrighted material
- all externally sourced assets have license records
- template search/filtering works server-side
- previews are CDN-backed
- full configurations are lazy-loaded
- recommendations work for student/fresher roles
- ATS classification is clearly labeled as an estimate
- admin approval is required before publication
- duplicate detection runs automatically
- unsafe template code cannot execute
- resume content remains editable and structured
- export uses the same rendering contract as preview
- versioning and rollback are available
- the editor remains usable on mobile/tablet/desktop
