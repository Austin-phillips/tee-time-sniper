-- Add holes column to preferences: 0 = both, 9 = 9 holes only, 18 = 18 holes only
ALTER TABLE public.preferences ADD COLUMN holes int NOT NULL DEFAULT 0;

-- Add holes column to matched_tee_times
ALTER TABLE public.matched_tee_times ADD COLUMN holes int NOT NULL DEFAULT 18;
