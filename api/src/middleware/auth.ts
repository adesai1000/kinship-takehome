import { Request, Response, NextFunction } from "express";
import { db } from "../db";

// extend res.locals so TypeScript knows about userId downstream
declare global {
  namespace Express {
    interface Locals {
      userId: string;
    }
  }
}

// pull user from the Supabase JWT and attach to res.locals
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = req.headers.authorization?.replace("Bearer ", "").trim();

  if (!token) {
    res.status(401).json({ error: "Authorization header required" });
    return;
  }

  const { data, error } = await db.auth.getUser(token);

  if (error || !data.user) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  res.locals.userId = data.user.id;
  next();
}
