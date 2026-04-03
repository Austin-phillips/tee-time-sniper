-- ============================================================
-- Initial schema: all tables, trigger, RLS policies
-- ============================================================

-- 1. Tables

CREATE TABLE public.users (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text NOT NULL UNIQUE,
  phone      text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.courses (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL UNIQUE,
  booking_platform text NOT NULL,
  booking_url      text NOT NULL,
  scraper_config   jsonb
);

CREATE TABLE public.preferences (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id       uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  days_of_week    int[] NOT NULL DEFAULT '{}',
  earliest_time   time NOT NULL DEFAULT '06:00:00',
  latest_time     time NOT NULL DEFAULT '18:00:00',
  num_players     int NOT NULL DEFAULT 1,
  look_ahead_days int NOT NULL DEFAULT 7,
  active          boolean NOT NULL DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  UNIQUE (user_id, course_id)
);

CREATE TABLE public.alerted_slots (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  tee_time    timestamptz NOT NULL,
  num_players int NOT NULL,
  alerted_at  timestamptz DEFAULT now(),
  booked      boolean NOT NULL DEFAULT false
);

CREATE TABLE public.platform_credentials (
  user_id            uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform           text NOT NULL,
  email              text NOT NULL,
  encrypted_password text NOT NULL,
  PRIMARY KEY (user_id, platform)
);

-- 2. Auth trigger: auto-create public.users on signup

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, phone)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'phone');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Enable RLS on all tables

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerted_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_credentials ENABLE ROW LEVEL SECURITY;

-- 4. Policies: users

CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- 5. Policies: preferences (full CRUD on own rows)

CREATE POLICY "Users can view own preferences"
  ON public.preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
  ON public.preferences FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Policies: courses (read-only for authenticated)

CREATE POLICY "Authenticated users can view courses"
  ON public.courses FOR SELECT
  USING (auth.role() = 'authenticated');

-- 7. Policies: alerted_slots (read-only for authenticated)

CREATE POLICY "Authenticated users can view alerted slots"
  ON public.alerted_slots FOR SELECT
  USING (auth.role() = 'authenticated');

-- 8. Policies: platform_credentials (full CRUD on own rows)

CREATE POLICY "Users can view own credentials"
  ON public.platform_credentials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credentials"
  ON public.platform_credentials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credentials"
  ON public.platform_credentials FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own credentials"
  ON public.platform_credentials FOR DELETE
  USING (auth.uid() = user_id);
