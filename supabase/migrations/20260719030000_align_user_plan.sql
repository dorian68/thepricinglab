-- Align legacy profile labels with the commercial plan vocabulary.
-- Paid access remains authoritative in the backend entitlement store; this
-- profile field is descriptive and must never grant frontend access by itself.
ALTER TYPE public.user_plan RENAME TO user_plan_legacy;

CREATE TYPE public.user_plan AS ENUM ('free', 'starter', 'student', 'pro');

ALTER TABLE public.profiles ALTER COLUMN plan DROP DEFAULT;
ALTER TABLE public.profiles
  ALTER COLUMN plan TYPE public.user_plan
  USING (
    CASE plan::text
      WHEN 'freemium' THEN 'free'
      WHEN 'basic' THEN 'starter'
      WHEN 'pro' THEN 'pro'
      WHEN 'admin' THEN 'pro'
      ELSE 'free'
    END
  )::public.user_plan;
ALTER TABLE public.profiles ALTER COLUMN plan SET DEFAULT 'free'::public.user_plan;

DROP TYPE public.user_plan_legacy;
