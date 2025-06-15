
-- Create admin courses table
CREATE TABLE public.admin_courses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content_md text,
  tags text[],
  level text,
  description text,
  duration text,
  image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create admin exercises table
CREATE TABLE public.admin_exercises (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  question_md text NOT NULL,
  solution_md text,
  course_id uuid REFERENCES admin_courses(id),
  difficulty integer DEFAULT 1,
  tags text[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create admin notebooks table
CREATE TABLE public.admin_notebooks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  file_url text,
  linked_course_id uuid REFERENCES admin_courses(id),
  file_name text,
  content text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all admin tables
ALTER TABLE public.admin_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notebooks ENABLE ROW LEVEL SECURITY;

-- Create admin access policies (requires admin role in user metadata)
CREATE POLICY "Admin full access to courses"
ON public.admin_courses
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'user_metadata' IS NOT NULL 
  AND auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
);

CREATE POLICY "Admin full access to exercises"
ON public.admin_exercises
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'user_metadata' IS NOT NULL 
  AND auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
);

CREATE POLICY "Admin full access to notebooks"
ON public.admin_notebooks
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'user_metadata' IS NOT NULL 
  AND auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
);

-- Create storage bucket for admin content
INSERT INTO storage.buckets (id, name, public)
VALUES ('admin-content', 'admin-content', true);

-- Create storage policy for admin content
CREATE POLICY "Admin can manage admin content"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'admin-content' 
  AND auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
);
