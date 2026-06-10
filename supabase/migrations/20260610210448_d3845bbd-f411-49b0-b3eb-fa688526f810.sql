
-- Lock down notes & exam_events to admins only (students can't create/edit/delete)
DROP POLICY IF EXISTS "Authenticated users can upload notes" ON public.notes;
DROP POLICY IF EXISTS "Uploader can update own notes" ON public.notes;
DROP POLICY IF EXISTS "Uploader can delete own notes" ON public.notes;

DROP POLICY IF EXISTS "Authenticated users can post exam events" ON public.exam_events;
DROP POLICY IF EXISTS "Creator can update own exam events" ON public.exam_events;
DROP POLICY IF EXISTS "Creator can delete own exam events" ON public.exam_events;

-- Tighten profiles: viewable only by self + admins (not all signed-in users)
DROP POLICY IF EXISTS "Profiles are viewable by everyone signed in" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

-- Prevent users from changing their own role (user_roles already admin-managed; ensure no self-insert)
-- (user_roles policies untouched if already admin-only)
