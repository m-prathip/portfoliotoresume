import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/pool";
import { ApiError } from "../middleware/errorHandler";

export const resumesRouter = Router();

const resumeContentSchema = z.record(z.any()); // validated more strictly by aiStructuring's zResumeContent at creation time

const createResumeSchema = z.object({
  user_id: z.string().uuid(),
  title: z.string().min(1).default("Untitled Resume"),
  template_id: z.string().uuid().optional(),
  portfolio_id: z.string().uuid().optional(),
  target_job_role: z.string().optional(),
  job_description: z.string().optional(),
  content: resumeContentSchema,
  style_overrides: z.record(z.any()).optional(),
});

// POST /api/resumes — create a resume (typically from the Phase 2 pipeline's
// `structured` output, once the student has reviewed/accepted it).
resumesRouter.post("/", async (req, res, next) => {
  try {
    const body = createResumeSchema.parse(req.body);

    const { rows } = await pool.query(
      `INSERT INTO resumes (user_id, portfolio_id, template_id, title, target_job_role, job_description, content, style_overrides)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        body.user_id,
        body.portfolio_id ?? null,
        body.template_id ?? null,
        body.title,
        body.target_job_role ?? null,
        body.job_description ?? null,
        JSON.stringify(body.content),
        JSON.stringify(body.style_overrides ?? {}),
      ],
    );

    const resume = rows[0];
    await pool.query(
      `INSERT INTO resume_versions (resume_id, version_number, content_snapshot, change_summary)
       VALUES ($1, 1, $2, 'Initial version')`,
      [resume.id, JSON.stringify(body.content)],
    );

    res.status(201).json({ resume });
  } catch (err) {
    if (err instanceof z.ZodError) return next(new ApiError(400, `Invalid request body: ${err.message}`));
    next(err);
  }
});

// GET /api/resumes/:id
resumesRouter.get("/:id", async (req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM resumes WHERE id = $1`, [req.params.id]);
    if (rows.length === 0) return next(new ApiError(404, "Resume not found"));
    res.json({ resume: rows[0] });
  } catch (err) {
    next(err);
  }
});

const patchResumeSchema = z.object({
  title: z.string().min(1).optional(),
  template_id: z.string().uuid().nullable().optional(),
  target_job_role: z.string().optional(),
  job_description: z.string().optional(),
  content: resumeContentSchema.optional(),
  style_overrides: z.record(z.any()).optional(),
  change_summary: z.string().optional(),
});

// PATCH /api/resumes/:id — the debounced-autosave endpoint the editor calls
// on every edit. Updates the live `resumes` row and, when `content` changed,
// appends a new `resume_versions` snapshot so history is never lost.
resumesRouter.patch("/:id", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const body = patchResumeSchema.parse(req.body);

    await client.query("BEGIN");

    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (body.title !== undefined) { fields.push(`title = $${idx++}`); values.push(body.title); }
    if (body.template_id !== undefined) { fields.push(`template_id = $${idx++}`); values.push(body.template_id); }
    if (body.target_job_role !== undefined) { fields.push(`target_job_role = $${idx++}`); values.push(body.target_job_role); }
    if (body.job_description !== undefined) { fields.push(`job_description = $${idx++}`); values.push(body.job_description); }
    if (body.content !== undefined) { fields.push(`content = $${idx++}`); values.push(JSON.stringify(body.content)); }
    if (body.style_overrides !== undefined) { fields.push(`style_overrides = $${idx++}`); values.push(JSON.stringify(body.style_overrides)); }

    if (fields.length === 0) {
      await client.query("ROLLBACK");
      return next(new ApiError(400, "No updatable fields provided"));
    }

    values.push(req.params.id);
    const { rows } = await client.query(
      `UPDATE resumes SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
      values,
    );

    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return next(new ApiError(404, "Resume not found"));
    }

    const resume = rows[0];

    if (body.content !== undefined) {
      const { rows: versionRows } = await client.query(
        `SELECT COALESCE(MAX(version_number), 0) + 1 AS next FROM resume_versions WHERE resume_id = $1`,
        [resume.id],
      );
      await client.query(
        `INSERT INTO resume_versions (resume_id, version_number, content_snapshot, change_summary)
         VALUES ($1, $2, $3, $4)`,
        [resume.id, versionRows[0].next, JSON.stringify(body.content), body.change_summary ?? "Autosave"],
      );
    }

    await client.query("COMMIT");
    res.json({ resume });
  } catch (err) {
    await client.query("ROLLBACK");
    if (err instanceof z.ZodError) return next(new ApiError(400, `Invalid request body: ${err.message}`));
    next(err);
  } finally {
    client.release();
  }
});

// GET /api/resumes/:id/versions — version history, most recent first.
resumesRouter.get("/:id/versions", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, version_number, change_summary, created_at
       FROM resume_versions WHERE resume_id = $1 ORDER BY version_number DESC`,
      [req.params.id],
    );
    res.json({ versions: rows });
  } catch (err) {
    next(err);
  }
});
