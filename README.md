# Portfolio-to-Fresher-Resume Platform — Phase 1 Scaffold

This is the Phase 1 foundation from the technical roadmap: repo structure,
backend/frontend init, and the initial Postgres schema
(`users`, `portfolios`, `resumes`, `templates`, `resume_versions`).

## Structure

```
portfolio-resume-platform/
├── backend/            Node + Express + TypeScript API
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.sql       Initial table definitions
│   │   │   └── pool.ts          Postgres connection pool
│   │   ├── routes/              Route handlers (empty stubs, Phase 2+)
│   │   ├── services/            Business logic (empty stubs, Phase 2+)
│   │   ├── middleware/
│   │   │   └── errorHandler.ts
│   │   ├── types/
│   │   │   └── index.ts         Shared TS interfaces mirroring the schema
│   │   └── index.ts             Express app entrypoint
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/           Next.js + TypeScript + Tailwind
│   ├── src/app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── postcss.config.js
├── docker-compose.yml  Local Postgres instance
└── README.md
```

## Setup

### 1. Database

```bash
docker compose up -d db
```

This starts Postgres on `localhost:5432` (db: `resume_platform`, user/pass: `postgres`/`postgres`).

Apply the schema:

```bash
psql postgresql://postgres:postgres@localhost:5432/resume_platform -f backend/src/db/schema.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Runs on `http://localhost:4000`. `GET /health` should return `{ "status": "ok" }`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:3000`.

## Phase 2: crawler + AI structuring pipeline

`POST /api/portfolios` with `{ "user_id": "<uuid>", "portfolio_url": "https://..." }`
runs the full pipeline and returns the structured resume JSON plus a Truth
Guard report, without yet saving a `resumes` row (Phase 3's editor is where
the student reviews/accepts the extraction before it becomes a resume).

- **`src/crawler/`** — `fetchStrategy.ts` (plain HTTP fetch, fast) tries first;
  if the HTML looks like an unrendered SPA shell (or the fetch fails outright),
  `browserStrategy.ts` (Playwright/Chromium) takes over. `htmlParser.ts`
  (cheerio) reduces either result to visible text + headings + classified
  links (GitHub/LinkedIn/demo). `types.ts` has a basic SSRF guard blocking
  localhost/private-IP targets.
- **`src/llm/`** — provider-agnostic `LlmAdapter` interface. `adapters/`
  has Anthropic and OpenAI implementations; `getLlmAdapter()` in `index.ts`
  is the single switch point (`LLM_PROVIDER=anthropic|openai` in `.env`).
  Swapping providers, or adding a third, never touches `services/`.
- **`src/services/aiStructuring.ts`** — prompts the LLM to convert crawled
  text into the `ResumeContent` schema, with a zod schema validating the
  response shape before it's trusted anywhere downstream.
- **`src/services/truthGuard.ts`** — the "never fabricate" layer from the
  blueprint. A cheap heuristic pass (lexical overlap + a regex for
  suspicious unexplained metrics like "40% faster") flags claims; flagged
  claims get a second, LLM-based verification pass to cut heuristic false
  positives. Nothing here silently drops a flag — the report is always
  returned to the caller.
- **`src/services/portfolioPipeline.ts`** — wires crawl → structure → Truth
  Guard into one function the route calls.

### Additional setup for Phase 2

```bash
cd backend
npm install
npx playwright install --with-deps chromium   # only needed for the browser fallback
```

Set in `.env`: `LLM_PROVIDER`, `LLM_MODEL`, and either `ANTHROPIC_API_KEY`
or `OPENAI_API_KEY` depending on provider.

## Phase 3: the hybrid Canva-style editor

Visit `http://localhost:3000/editor/<resumeId>` for an existing resume
(create one first via `POST /api/resumes`, typically seeded from Phase 2's
pipeline output once the student accepts it).

**Architecture — visual layer vs. semantic layer, as the blueprint specifies:**
- **Semantic layer** = `ResumeContent` (education, skills, projects, etc.)
  plus `sectionOrder`, held in `frontend/src/store/resumeStore.ts` (Zustand).
  Editing happens through the structured field panels in
  `components/editor/SectionEditors.tsx` and `PersonalInfoForm.tsx` — never
  by touching template markup.
- **Visual layer** = the selected template's `html_template`/`css_styles`
  (fetched from `GET /api/templates/:slug`) plus `StyleOverrides` (font,
  color, spacing), applied as CSS custom properties. `StyleControls.tsx`
  only ever writes to `styleOverrides`, never to `ResumeContent`.
- **`lib/templateRenderer.ts`** is the bridge: it compiles the template's
  Handlebars HTML against the semantic data and injects the visual layer's
  CSS variables. This exact function's output contract (a full standalone
  HTML document) is what Phase 4's Headless Chromium PDF step will reuse
  server-side — "live preview" and "final export" render through the same
  templates, just in different environments.
- **`components/editor/Canvas.tsx`** renders that HTML into a sandboxed
  iframe for live preview.
- **`components/editor/SectionList.tsx`** is the drag-and-drop reordering
  (dnd-kit) — dragging updates `content.sectionOrder`, which every template's
  `{{#each sections}}` loop reads directly, so reordering works identically
  across all 5 templates.
- **`hooks/useAutosave.ts`** debounces edits (1.2s) and calls
  `PATCH /api/resumes/:id`, which both updates the live row and appends a
  `resume_versions` snapshot (see Phase 2 route work).

**Note on "direct text editing on the canvas":** rather than making the
iframe's rendered HTML itself contentEditable (unreliable to sync back into
React state across a cross-document boundary), typing happens in the
structured field panels and the canvas re-renders live a moment later. This
keeps the semantic layer authoritative and avoids a whole class of
sync/undo bugs a truly-in-canvas contentEditable approach would introduce.
Swapping to true in-canvas editing later is possible without changing the
data model — only `Canvas.tsx` would need to change.

### Template library

Five fresher templates live in `backend/src/db/seed/templates/` as
Handlebars HTML + CSS pairs, seeded into the `templates` table:

```bash
cd backend
npm run seed:templates
```

- `classic-fresher-ats` — Classic Fresher ATS (single column, safest default)
- `software-developer-fresher` — leads with Projects, monospace accents
- `business-fresher` — centered/formal, navy & gold
- `design-fresher` — bold heading, accent color, still fully text-based
- `data-analytics-fresher` — labeled section headers, teal accent

All five are plain HTML/CSS (no locked images) and share the same
`{{#each sections}}` structure, so section reordering and style overrides
work consistently across every template.

### Additional setup for Phase 3

```bash
cd frontend
npm install   # adds zustand, @dnd-kit/*, handlebars
```

## Phase 4: ATS diagnostics + PDF export

- **`backend/src/services/templateRenderer.ts`** — server-side twin of the
  frontend's `lib/templateRenderer.ts`. Same Handlebars template, same data
  contract; kept in sync by hand since frontend/backend are separate npm
  projects. This is deliberate: "live preview" and "final export" must
  always look identical, so both render the exact same template with the
  exact same data-shaping logic.
- **`backend/src/services/pdfRenderer.ts`** — launches headless Chromium
  (Playwright, same lazy-import pattern as the Phase 2 crawler fallback),
  renders the HTML at Letter dimensions, and returns both the PDF buffer and
  an estimated page count (content height ÷ one page's height). That page
  count feeds the ATS "one-page overflow" check without a second render.
- **`backend/src/services/atsValidator.ts`** — static (cheerio-based) checks
  — exactly one `<h1>`, a `<h2>` for every non-empty section, minimum text
  density, contact info present, image usage flagged as informational —
  plus the overflow flag once page count is known. Produces a 0-100
  informational score; only "error"-severity flags block `passed`.
- **`backend/src/services/resumeExport.ts`** — orchestrates both: renders
  once, generates the PDF, and builds the ATS report from that same render
  so downloading doesn't pay for two headless-Chromium passes.
- **Routes** (`backend/src/routes/export.ts`):
  - `GET /api/resumes/:id/ats-report` — diagnostics only, JSON.
  - `GET /api/resumes/:id/export` — streams the PDF; also sets
    `X-Ats-Passed` / `X-Ats-Score` / `X-Ats-Page-Count` headers so the client
    gets a quick summary without a second request.
- **Frontend** (`components/editor/ExportPanel.tsx`) — "Run ATS check" and
  "Download PDF" buttons in the editor sidebar, with flags shown inline.

**Bug fixed while wiring this up:** Phase 3's `StyleOverrides` (font/color/
spacing) were only ever kept in frontend local state — never sent to the
backend — so a PDF export would have ignored any styling the student chose.
Fixed by adding a `style_overrides JSONB` column to `resumes` (migration is
idempotent — safe to re-run `schema.sql` against a DB that already has
Phase 1-3's tables), persisting it through the same autosave PATCH, and
having `renderResumeHtml`/PDF export read it back.

### Additional setup for Phase 4

No new setup beyond Phase 2/3's `npx playwright install --with-deps chromium`
— the same headless Chromium install is reused for both crawling fallback
and PDF rendering.

## What's intentionally NOT here yet

- True in-canvas contentEditable text editing (see Phase 3 note above)
- Auth (routes assume a `user_id` is already known/passed in)
- Caching the ATS-report render (currently launches headless Chromium on
  every `GET /ats-report` call — fine for MVP usage, worth debouncing or
  caching by content hash for production)

## Schema notes

- `resume_versions` stores immutable snapshots of a resume's JSON at each
  save/export, so edits are never destructive and the Truth Guard evidence
  mapping in Phase 2 can point at a specific version.
- `resumes.content` is `JSONB` — this holds the structured Resume JSON
  (Personal, Education, Skills, Projects, etc.) described in the blueprint's
  Student Information Model.
- `portfolios` stores the raw crawled/extracted data separately from the
  structured resume, so Truth Guard can always trace a resume claim back to
  the original portfolio evidence.


## Production Template Ecosystem Blueprint

The requested 2,000–5,000-template ecosystem is documented in:

- `docs/MASTER_IMPLEMENTATION_BLUEPRINT.md` — complete architecture and 30-deliverable implementation contract.
- `docs/IMPLEMENTATION_GAP_REPORT.md` — audit of the uploaded project against the supplied master prompt.
- `backend/src/template-system/template.schema.json` — versioned generated-template JSON schema.
- `backend/src/template-system/taxonomy.json` — canonical categories, roles, styles and ATS levels.
- `backend/src/template-system/licenseRegistry.ts` — licensing publication gate.
- `backend/src/template-system/templateGenerator.ts` — compatibility-aware generation contract.
- `backend/scripts/validateTemplates.ts` — validation worker entry point.
- `backend/scripts/detectDuplicates.ts` — duplicate-detection worker entry point.
- `backend/scripts/generatePreviews.ts` — preview-generation worker entry point.

### Current library audit

The uploaded implementation currently seeds **5 base layouts × 45 style presets = 225 selectable variants**. This is an early implementation and is not yet the requested 200-base / 2,000–5,000-variant production library.

Do not solve the gap by copying commercial resume templates. Expand the library with original layouts and legally compatible assets, then publish variants only after validation, licensing and duplicate checks.

## Production Template Library Implementation

The template system now contains a deterministic, configuration-driven library generator:

- **200 original base layouts** across ATS, Student/Fresher, Technology, Business, Creative, Academic and International categories.
- **25 curated style presets** covering professional color families and typography systems.
- **5,000 selectable variants** (`200 × 25`) without duplicating HTML/CSS codebases.
- Base layouts are generated by `backend/src/template-system/templateFactory.ts`.
- Database seeding is handled by `npm run seed:library` and `npm run seed:presets`.
- Static metadata can be generated with `npm run generate:manifest`.
- Structural validation: `npm run validate:library`.
- Duplicate detection: `npm run detect:duplicates`.

### First production setup

1. Apply `backend/src/db/schema.sql` to PostgreSQL.
2. Run `npm run seed:presets`.
3. Run `npm run seed:library`.
4. Run `npm run generate:manifest` if a static catalog artifact is desired.
5. Start the backend and open the template picker.

The gallery only loads lightweight metadata. Full HTML/CSS is fetched only after a user selects a template variant.
