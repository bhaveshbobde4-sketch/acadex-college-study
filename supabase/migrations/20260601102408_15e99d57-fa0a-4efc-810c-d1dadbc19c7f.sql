
ALTER TABLE public.semesters ADD COLUMN IF NOT EXISTS branch text;
CREATE INDEX IF NOT EXISTS idx_semesters_branch ON public.semesters(branch);
