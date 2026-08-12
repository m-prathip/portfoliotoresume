import { Router } from "express";
import { query } from "../db/pool";
import crypto from "crypto";

export const usersRouter = Router();

// Phase 1: scaffold only. Auth + CRUD land alongside Phase 2 work.
usersRouter.get("/", (_req, res) => {
  res.json({ message: "users route placeholder" });
});

usersRouter.post("/", async (req, res, next) => {
  try {
    const { email, full_name } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    
    // For MVP guest access, generate a dummy password
    const dummyPasswordHash = crypto.randomBytes(16).toString("hex");

    const result = await query(
      `INSERT INTO users (email, password_hash, full_name) 
       VALUES ($1, $2, $3) 
       RETURNING id, email, full_name, created_at`,
      [email, dummyPasswordHash, full_name || ""]
    );
    
    res.json({ user: result.rows[0] });
  } catch (err: any) {
    // If unique constraint violation, try to fetch the existing user
    if (err.code === '23505') {
       try {
         const result = await query(
           `SELECT id, email, full_name, created_at FROM users WHERE email = $1`,
           [req.body.email]
         );
         return res.json({ user: result.rows[0] });
       } catch (findErr) {
         return next(findErr);
       }
    }
    next(err);
  }
});
