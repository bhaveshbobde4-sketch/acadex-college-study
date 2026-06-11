
CREATE TABLE public.youtube_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  chapter TEXT,
  youtube_url TEXT NOT NULL,
  branch TEXT NOT NULL,
  semester TEXT NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.youtube_videos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.youtube_videos TO authenticated;
GRANT ALL ON public.youtube_videos TO service_role;
ALTER TABLE public.youtube_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "videos_select_all" ON public.youtube_videos FOR SELECT USING (true);
CREATE POLICY "videos_admin_insert" ON public.youtube_videos FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "videos_admin_update" ON public.youtube_videos FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "videos_admin_delete" ON public.youtube_videos FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.important_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  branch TEXT NOT NULL,
  semester TEXT NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.important_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.important_links TO authenticated;
GRANT ALL ON public.important_links TO service_role;
ALTER TABLE public.important_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "links_select_all" ON public.important_links FOR SELECT USING (true);
CREATE POLICY "links_admin_insert" ON public.important_links FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "links_admin_update" ON public.important_links FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "links_admin_delete" ON public.important_links FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER trg_videos_touch BEFORE UPDATE ON public.youtube_videos FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_links_touch BEFORE UPDATE ON public.important_links FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
