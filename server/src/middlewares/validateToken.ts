import { NextFunction, Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    "https://yvieqjqbspmtoabaozog.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2aWVxanFic3BtdG9hYmFvem9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ4Njg2NTEsImV4cCI6MjA1MDQ0NDY1MX0.Qs0P1Gj0UeLcuODk3HZ0BaftDeelU96zYdxQNx1hFC8"
);

export const validateToken = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            res.status(401).json({ msg: "Authorization token is required" });
            return;
        }

        const { data: user, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            res.status(401).json({ error: "Invalid or expired token" });
            return;
        }

        req.body.user = user;
        next(); // Call next() to pass control to the next middleware or route handler
    } catch (err) {
        res.status(500).json({ msg: "Internal server error" });
    }
};