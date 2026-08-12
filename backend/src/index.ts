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
    origin: process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(",") 
      : "*",
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

import fs from "fs";
import path from "path";
import { pool } from "./db/pool";

// Start server
const startServer = async () => {
  try {
    const schemaPath = path.join(process.cwd(), "src", "db", "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf-8");
    await pool.query(schema);
    console.log("Database schema initialized successfully.");

    // Auto-seed if templates are missing
    const res = await pool.query("SELECT COUNT(*) FROM templates");
    if (parseInt(res.rows[0].count) === 0) {
      console.log("Templates table is empty. Auto-seeding database...");
      const { execSync } = require("child_process");
      execSync("npx --yes tsx src/db/seed/seedTemplates.ts", { stdio: "inherit", cwd: process.cwd() });
      execSync("npx --yes tsx src/db/seed/seedStylePresets.ts", { stdio: "inherit", cwd: process.cwd() });
      execSync("npx --yes tsx src/db/seed/seedTemplateLibrary.ts", { stdio: "inherit", cwd: process.cwd() });
      console.log("Database seeded successfully.");
    }
  } catch (err) {
    console.error("Failed to initialize or seed schema:", err);
  }

  app.listen(port, host, () => {
    console.log(`Backend listening on http://${host}:${port}`);
  });
};

startServer();