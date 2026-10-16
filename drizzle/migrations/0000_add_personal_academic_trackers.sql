CREATE TABLE public.student_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_name text NOT NULL CHECK (length(trim(course_name)) BETWEEN 1 AND 120),
  semester text NOT NULL CHECK (length(trim(semester)) BETWEEN 1 AND 80),
  credits numeric(5,2) NOT NULL CHECK (credits > 0 AND credits <= 60),
  grade_point numeric(4,2) NOT NULL CHECK (grade_point >= 0 AND grade_point <= 10),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_courses TO authenticated;
GRANT ALL ON public.student_courses TO service_role;
ALTER TABLE public.student_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage their own tracker courses" ON public.student_courses FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  class_date date NOT NULL DEFAULT CURRENT_DATE,
  present boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT attendance_records_course_owner_fkey FOREIGN KEY (course_id, user_id) REFERENCES public.student_courses (id, user_id) ON DELETE CASCADE
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_records TO authenticated;
GRANT ALL ON public.attendance_records TO service_role;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage their own attendance records" ON public.attendance_records FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);