import "dotenv/config";
import cors from "cors";
import express from "express";

import { checkDbConnection } from "./db/pool";
import { errorHandler } from "./middleware/errorHandler";

import { usersRouter } from "./routes/users";
import { portfoliosRouter } from "./routes/portfolios";
import { resumesRouter } from "./routes/resumes";
import { templatesRouter } from "./routes/templates";
import { exportRouter } from "./routes/export";

const app = express();

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
const host = "0.0.0.0";

app.use(
  cors({
    origin:
      process.env.CORS_ORIGIN ??
      "http://localhost:3000",
  }),
);

app.use(express.json({ limit: "2mb" }));

// Health check
app.get("/health", async (_req, res) => {
  try {
    const dbOk = await checkDbConnection();

    res.status(dbOk ? 200 : 503).json({
      status: dbOk ? "ok" : "degraded",
      db: dbOk ? "connected" : "unreachable",
    });
  } catch {
    res.status(503).json({
      status: "degraded",
      db: "unreachable",
    });
  }
});

// API routes
app.use("/api/users", usersRouter);
app.use("/api/portfolios", portfoliosRouter);
app.use("/api/resumes", resumesRouter);
app.use("/api/resumes", exportRouter);
app.use("/api/templates", templatesRouter);

// Error handler must be last
app.use(errorHandler);

// Start server
app.listen(port, host, () => {
  console.log(`Backend listening on http://${host}:${port}`);
});