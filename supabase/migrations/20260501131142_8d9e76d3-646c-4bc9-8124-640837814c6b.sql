-- Teacher subjects table
CREATE TABLE public.teacher_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_user_id uuid NOT NULL,
  subject text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (teacher_user_id, subject)
);

CREATE INDEX idx_teacher_subjects_teacher ON public.teacher_subjects(teacher_user_id);

ALTER TABLE public.teacher_subjects ENABLE ROW LEVEL SECURITY;

-- Admins manage everything
CREATE POLICY "teacher_subjects_admin_all"
ON public.teacher_subjects FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Teachers can read their own assignments
CREATE POLICY "teacher_subjects_self_select"
ON public.teacher_subjects FOR SELECT TO authenticated
USING (teacher_user_id = auth.uid());

-- Helper: does this teacher teach this subject?
CREATE OR REPLACE FUNCTION public.teacher_teaches(_user_id uuid, _subject text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teacher_subjects
    WHERE teacher_user_id = _user_id AND subject = _subject
  )
$$;

REVOKE ALL ON FUNCTION public.teacher_teaches(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.teacher_teaches(uuid, text) TO authenticated;

-- Tighten results write policies: teachers can only insert/update/delete rows
-- whose subject matches one of their assigned subjects. Admins unaffected.
DROP POLICY IF EXISTS results_staff_insert ON public.results;
DROP POLICY IF EXISTS results_staff_update ON public.results;
DROP POLICY IF EXISTS results_staff_delete ON public.results;

CREATE POLICY "results_staff_insert"
ON public.results FOR INSERT TO authenticated
WITH CHECK (
  (
    public.has_role(auth.uid(), 'admin')
    OR (public.has_role(auth.uid(), 'teacher') AND public.teacher_teaches(auth.uid(), subject))
  )
  AND EXISTS (
    SELECT 1 FROM public.result_sheets rs
    WHERE rs.id = results.sheet_id
      AND (rs.status IN ('draft','submitted') OR public.has_role(auth.uid(), 'admin'))
  )
  AND EXISTS (
    SELECT 1 FROM public.result_sheets rs
    JOIN public.student_subjects ss ON ss.student_id = rs.student_id
    WHERE rs.id = results.sheet_id AND ss.subject = results.subject
  )
);

CREATE POLICY "results_staff_update"
ON public.results FOR UPDATE TO authenticated
USING (
  (
    public.has_role(auth.uid(), 'admin')
    OR (public.has_role(auth.uid(), 'teacher') AND public.teacher_teaches(auth.uid(), subject))
  )
  AND EXISTS (
    SELECT 1 FROM public.result_sheets rs
    WHERE rs.id = results.sheet_id
      AND (rs.status IN ('draft','submitted') OR public.has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "results_staff_delete"
ON public.results FOR DELETE TO authenticated
USING (
  (
    public.has_role(auth.uid(), 'admin')
    OR (public.has_role(auth.uid(), 'teacher') AND public.teacher_teaches(auth.uid(), subject))
  )
  AND EXISTS (
    SELECT 1 FROM public.result_sheets rs
    WHERE rs.id = results.sheet_id
      AND (rs.status IN ('draft','submitted') OR public.has_role(auth.uid(), 'admin'))
  )
);