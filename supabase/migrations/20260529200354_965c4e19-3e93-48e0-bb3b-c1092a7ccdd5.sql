
CREATE TYPE public.post_tab AS ENUM ('Feed', 'Doubts', 'Internships', 'Confessions');

CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  tab public.post_tab NOT NULL DEFAULT 'Feed',
  text text NOT NULL,
  anonymous boolean NOT NULL DEFAULT false,
  likes_count integer NOT NULL DEFAULT 0,
  comments_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts public read" ON public.posts FOR SELECT USING (true);
CREATE POLICY "posts auth insert" ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "posts author update" ON public.posts FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "posts author delete" ON public.posts FOR DELETE TO authenticated USING (auth.uid() = author_id);

CREATE TABLE public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.post_comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_comments TO authenticated;
GRANT ALL ON public.post_comments TO service_role;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments public read" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "comments auth insert" ON public.post_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "comments author delete" ON public.post_comments FOR DELETE TO authenticated USING (auth.uid() = author_id);

CREATE TABLE public.post_likes (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.post_likes TO authenticated;
GRANT ALL ON public.post_likes TO service_role;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "likes self read" ON public.post_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "likes self insert" ON public.post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes self delete" ON public.post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.saved_notes (
  user_id uuid NOT NULL,
  note_id uuid NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, note_id)
);
GRANT SELECT, INSERT, DELETE ON public.saved_notes TO authenticated;
GRANT ALL ON public.saved_notes TO service_role;
ALTER TABLE public.saved_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saved self all" ON public.saved_notes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.bump_post_likes() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END; $$;
CREATE TRIGGER trg_post_likes AFTER INSERT OR DELETE ON public.post_likes FOR EACH ROW EXECUTE FUNCTION public.bump_post_likes();

CREATE OR REPLACE FUNCTION public.bump_post_comments() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END; $$;
CREATE TRIGGER trg_post_comments AFTER INSERT OR DELETE ON public.post_comments FOR EACH ROW EXECUTE FUNCTION public.bump_post_comments();

-- Storage policy: allow authenticated to upload to notes-pdfs in their own folder
CREATE POLICY "notes-pdfs auth upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'notes-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "notes-pdfs auth update own" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'notes-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "notes-pdfs auth delete own" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'notes-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);
