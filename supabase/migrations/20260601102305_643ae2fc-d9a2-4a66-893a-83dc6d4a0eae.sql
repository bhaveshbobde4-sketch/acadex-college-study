
-- Material type enum
CREATE TYPE public.material_type AS ENUM ('notes','pyqs','assignments','syllabus','important_questions','lab_manuals');

-- Subjects table (belongs to branch + semester via text labels, matching existing taxonomy by name)
CREATE TABLE public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  branch text NOT NULL,
  semester text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (branch, semester, name)
);

GRANT SELECT ON public.subjects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subjects TO authenticated;
GRANT ALL ON public.subjects TO service_role;

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subjects public read" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "subjects admin insert" ON public.subjects FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "subjects admin update" ON public.subjects FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "subjects admin delete" ON public.subjects FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Add material_type + subject_id to notes
ALTER TABLE public.notes
  ADD COLUMN material_type public.material_type NOT NULL DEFAULT 'notes',
  ADD COLUMN subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL;

CREATE INDEX idx_notes_subject_id ON public.notes(subject_id);
CREATE INDEX idx_notes_material_type ON public.notes(material_type);
CREATE INDEX idx_subjects_branch_sem ON public.subjects(branch, semester);

-- Migrate existing notes: create subject rows for each (branch, semester, subject) combo
INSERT INTO public.subjects (name, branch, semester, sort_order)
SELECT DISTINCT subject, branch, semester, 0
FROM public.notes
WHERE subject IS NOT NULL AND subject <> ''
ON CONFLICT (branch, semester, name) DO NOTHING;

-- Link notes to subjects
UPDATE public.notes n
SET subject_id = s.id
FROM public.subjects s
WHERE s.branch = n.branch AND s.semester = n.semester AND s.name = n.subject
  AND n.subject_id IS NULL;
