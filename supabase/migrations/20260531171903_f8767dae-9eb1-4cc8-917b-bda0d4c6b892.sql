
CREATE TABLE public.branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.branches TO anon, authenticated;
GRANT ALL ON public.branches TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.branches TO authenticated;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "branches public read" ON public.branches FOR SELECT USING (true);
CREATE POLICY "branches admin insert" ON public.branches FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "branches admin update" ON public.branches FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "branches admin delete" ON public.branches FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE TABLE public.semesters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.semesters TO anon, authenticated;
GRANT ALL ON public.semesters TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.semesters TO authenticated;
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "semesters public read" ON public.semesters FOR SELECT USING (true);
CREATE POLICY "semesters admin insert" ON public.semesters FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "semesters admin update" ON public.semesters FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "semesters admin delete" ON public.semesters FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

INSERT INTO public.branches (name, sort_order) VALUES
  ('CSE',1),('ECE',2),('ME',3),('EE',4),('CE',5),('IT',6)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.semesters (name, sort_order) VALUES
  ('Sem 1',1),('Sem 2',2),('Sem 3',3),('Sem 4',4),
  ('Sem 5',5),('Sem 6',6),('Sem 7',7),('Sem 8',8)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
VALUES ('72f365ca-8def-493d-bb2a-2a15b92c0c03', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
