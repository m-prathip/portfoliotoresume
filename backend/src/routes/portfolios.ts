import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/pool";
import { runPortfolioPipeline } from "../services/portfolioPipeline";
import { ApiError } from "../middleware/errorHandler";
import { CrawlError } from "../crawler/types";
import { AiStructuringError } from "../services/aiStructuring";

export const portfoliosRouter = Router();

const createPortfolioSchema = z.object({
  user_id: z.string().uuid(),
  portfolio_url: z.string().url(),
});

/**
 * POST /api/portfolios
 * Runs the full Phase 2 pipeline: crawl -> parse -> AI structure -> Truth Guard.
 * Persists the raw crawl + Truth Guard outcome to `portfolios`. The caller
 * (Phase 3 editor) is responsible for reviewing flagged claims before saving
 * a `resumes` row from `structured`.
 */
portfoliosRouter.post("/", async (req, res, next) => {
  try {
    const { user_id, portfolio_url } = createPortfolioSchema.parse(req.body);

    const pipelineResult = await runPortfolioPipeline(portfolio_url);

    const { rows } = await pool.query(
      `INSERT INTO portfolios (user_id, source_url, raw_content, crawl_status, crawled_at)
       VALUES ($1, $2, $3, 'success', now())
       RETURNING id, user_id, source_url, crawl_status, crawled_at, created_at`,
      [
        user_id,
        portfolio_url,
        JSON.stringify({
          fullText: pipelineResult.rawContent.fullText,
          headings: pipelineResult.rawContent.headings,
          links: pipelineResult.rawContent.links,
          fetchedWith: pipelineResult.fetchedWith,
        }),
      ],
    );

    res.status(201).json({
      portfolio: rows[0],
      structured: pipelineResult.structured,
      truthGuard: pipelineResult.truthGuard,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new ApiError(400, `Invalid request body: ${err.message}`));
    }
    if (err instanceof CrawlError) {
      return next(new ApiError(422, `Could not crawl portfolio: ${err.message}`));
    }
    if (err instanceof AiStructuringError) {
      return next(new ApiError(422, `Could not structure resume data: ${err.message}`));
    }
    next(err);
  }
});
