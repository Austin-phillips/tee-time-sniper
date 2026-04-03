-- ============================================================
-- 1. Drop alerted_slots (replaced by matched_tee_times)
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can view alerted slots" ON public.alerted_slots;
DROP TABLE IF EXISTS public.alerted_slots;

-- ============================================================
-- 2. Create matched_tee_times (live inventory)
-- ============================================================
CREATE TABLE public.matched_tee_times (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  preference_id     uuid NOT NULL REFERENCES public.preferences(id) ON DELETE CASCADE,
  course_id         uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  course_name       text NOT NULL,
  tee_time          timestamptz NOT NULL,
  players_available int NOT NULL,
  price             numeric(8,2) NOT NULL DEFAULT 0,
  booking_url       text NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (preference_id, tee_time)
);

CREATE INDEX idx_matched_tee_times_user
  ON public.matched_tee_times (user_id, tee_time ASC);

ALTER TABLE public.matched_tee_times ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own matched tee times"
  ON public.matched_tee_times FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================
-- 3. Revise notifications: replace tee-time columns with title/body
-- ============================================================
ALTER TABLE public.notifications
  DROP COLUMN tee_time,
  DROP COLUMN players_available,
  DROP COLUMN price,
  DROP COLUMN booking_url,
  ADD COLUMN title text NOT NULL DEFAULT '',
  ADD COLUMN body  text NOT NULL DEFAULT '';
