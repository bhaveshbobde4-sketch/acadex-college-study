
-- =========================
-- PROFILES
-- =========================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  branch TEXT,
  semester TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone signed in"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================
-- NOTES
-- =========================
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  branch TEXT NOT NULL,
  semester TEXT NOT NULL,
  description TEXT,
  pdf_path TEXT NOT NULL,
  file_size_kb INTEGER DEFAULT 0,
  downloads INTEGER NOT NULL DEFAULT 0,
  is_hot BOOLEAN NOT NULL DEFAULT false,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX notes_branch_sem_idx ON public.notes (branch, semester);
CREATE INDEX notes_downloads_idx ON public.notes (downloads DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO authenticated;
GRANT SELECT ON public.notes TO anon;
GRANT ALL ON public.notes TO service_role;

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notes are publicly readable"
  ON public.notes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can upload notes"
  ON public.notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "Uploader can update own notes"
  ON public.notes FOR UPDATE TO authenticated USING (auth.uid() = uploaded_by);
CREATE POLICY "Uploader can delete own notes"
  ON public.notes FOR DELETE TO authenticated USING (auth.uid() = uploaded_by);

-- =========================
-- EXAM EVENTS (Exam Hub)
-- =========================
CREATE TYPE public.exam_event_type AS ENUM ('timetable', 'notice', 'important_date', 'result');

CREATE TABLE public.exam_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.exam_event_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  branch TEXT,
  semester TEXT,
  event_date DATE,
  link TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX exam_events_type_date_idx ON public.exam_events (type, event_date);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_events TO authenticated;
GRANT SELECT ON public.exam_events TO anon;
GRANT ALL ON public.exam_events TO service_role;

ALTER TABLE public.exam_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Exam events are publicly readable"
  ON public.exam_events FOR SELECT USING (true);
CREATE POLICY "Authenticated users can post exam events"
  ON public.exam_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creator can update own exam events"
  ON public.exam_events FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Creator can delete own exam events"
  ON public.exam_events FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- =========================
-- NOTE DOWNLOADS (analytics)
-- =========================
CREATE TABLE public.note_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX note_downloads_note_idx ON public.note_downloads (note_id);

GRANT SELECT, INSERT ON public.note_downloads TO authenticated;
GRANT ALL ON public.note_downloads TO service_role;

ALTER TABLE public.note_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed in can read download analytics"
  ON public.note_downloads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can log a download"
  ON public.note_downloads FOR INSERT TO authenticated WITH CHECK (true);

-- Increment downloads counter on note when a download is logged
CREATE OR REPLACE FUNCTION public.bump_note_downloads()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.notes SET downloads = downloads + 1 WHERE id = NEW.note_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_note_downloaded
  AFTER INSERT ON public.note_downloads
  FOR EACH ROW EXECUTE FUNCTION public.bump_note_downloads();

-- =========================
-- STORAGE BUCKET FOR PDFs
-- =========================
INSERT INTO storage.buckets (id, name, public)
VALUES ('notes-pdfs', 'notes-pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public can read PDFs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'notes-pdfs');

CREATE POLICY "Authenticated users can upload PDFs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'notes-pdfs' AND auth.uid() = owner);

CREATE POLICY "Owners can update their PDFs"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'notes-pdfs' AND auth.uid() = owner);

CREATE POLICY "Owners can delete their PDFs"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'notes-pdfs' AND auth.uid() = owner);
