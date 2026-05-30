-- 1. Role system
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can read own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Notes: URL-based PDFs
ALTER TABLE public.notes ADD COLUMN pdf_url text;
ALTER TABLE public.notes ALTER COLUMN pdf_path DROP NOT NULL;

-- 3. Admins can manage notes
CREATE POLICY "Admins can insert any note"
ON public.notes FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update any note"
ON public.notes FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any note"
ON public.notes FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 4. Admins can manage exam events
CREATE POLICY "Admins can insert any exam event"
ON public.exam_events FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update any exam event"
ON public.exam_events FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any exam event"
ON public.exam_events FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));