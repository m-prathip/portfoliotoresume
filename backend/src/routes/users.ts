import { Router } from "express";

export const usersRouter = Router();

// Phase 1: scaffold only. Auth + CRUD land alongside Phase 2 work.
usersRouter.get("/", (_req, res) => {
  res.json({ message: "users route placeholder" });
});
