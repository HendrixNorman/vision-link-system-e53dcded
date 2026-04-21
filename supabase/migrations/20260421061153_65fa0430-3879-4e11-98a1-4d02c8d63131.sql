
-- 1. Status enum for result sheets
CREATE TYPE public.result_sheet_status AS ENUM ('draft', 'submitted', 'confirmed');

-- 2. Student subjects (exactly 9 per student, enforced at submission time)
CREATE TABLE public.student_subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (student_id, subject)
);

ALTER TABLE public.student_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_subjects_admin_teacher_manage"
ON public.student_subjects FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "student_subjects_self_select"
ON public.student_subjects FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_subjects.student_id AND s.user_id = auth.uid())
  OR public.is_parent_of(auth.uid(), student_id)
);

-- 3. Result sheets (one per student per term/year)
CREATE TABLE public.result_sheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  year INTEGER NOT NULL,
  status public.result_sheet_status NOT NULL DEFAULT 'draft',
  created_by UUID,
  submitted_by UUID,
  submitted_at TIMESTAMP WITH TIME ZONE,
  confirmed_by UUID,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (student_id, term, year)
);

ALTER TABLE public.result_sheets ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_result_sheets_updated_at
BEFORE UPDATE ON public.result_sheets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Teachers + admins see all sheets (to manage them)
CREATE POLICY "result_sheets_staff_select"
ON public.result_sheets FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'));

-- Students see only their confirmed sheets
CREATE POLICY "result_sheets_student_select_confirmed"
ON public.result_sheets FOR SELECT TO authenticated
USING (
  status = 'confirmed'
  AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = result_sheets.student_id AND s.user_id = auth.uid())
);

-- Parents see only confirmed sheets for their children
CREATE POLICY "result_sheets_parent_select_confirmed"
ON public.result_sheets FOR SELECT TO authenticated
USING (status = 'confirmed' AND public.is_parent_of(auth.uid(), student_id));

-- Teachers + admins can create draft sheets
CREATE POLICY "result_sheets_staff_insert"
ON public.result_sheets FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'));

-- Teachers can edit only draft/submitted sheets; admins can edit anything
CREATE POLICY "result_sheets_staff_update"
ON public.result_sheets FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (public.has_role(auth.uid(), 'teacher') AND status IN ('draft', 'submitted'))
);

CREATE POLICY "result_sheets_admin_delete"
ON public.result_sheets FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 4. Trigger: enforce confirmation rules + 9-subject completeness
CREATE OR REPLACE FUNCTION public.enforce_result_sheet_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  required_subjects TEXT[];
  scored_subjects TEXT[];
BEGIN
  -- On submit: ensure exactly 9 assigned subjects and 9 matching scores exist
  IF NEW.status = 'submitted' AND (TG_OP = 'INSERT' OR OLD.status <> 'submitted') THEN
    SELECT ARRAY(SELECT subject FROM public.student_subjects WHERE student_id = NEW.student_id ORDER BY subject)
      INTO required_subjects;

    IF array_length(required_subjects, 1) IS DISTINCT FROM 9 THEN
      RAISE EXCEPTION 'Student must have exactly 9 assigned subjects before submission (currently %).', COALESCE(array_length(required_subjects, 1), 0);
    END IF;

    SELECT ARRAY(SELECT subject FROM public.results WHERE sheet_id = NEW.id ORDER BY subject)
      INTO scored_subjects;

    IF scored_subjects IS DISTINCT FROM required_subjects THEN
      RAISE EXCEPTION 'All 9 assigned subjects must have scores before submission.';
    END IF;

    NEW.submitted_at := COALESCE(NEW.submitted_at, now());
    NEW.submitted_by := COALESCE(NEW.submitted_by, auth.uid());
  END IF;

  -- Only admins may confirm
  IF NEW.status = 'confirmed' AND (TG_OP = 'INSERT' OR OLD.status <> 'confirmed') THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Only an admin can confirm a result sheet.';
    END IF;
    NEW.confirmed_at := COALESCE(NEW.confirmed_at, now());
    NEW.confirmed_by := COALESCE(NEW.confirmed_by, auth.uid());
  END IF;

  -- Reopening a confirmed sheet: only admins
  IF TG_OP = 'UPDATE' AND OLD.status = 'confirmed' AND NEW.status <> 'confirmed' THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Only an admin can reopen a confirmed result sheet.';
    END IF;
    NEW.confirmed_at := NULL;
    NEW.confirmed_by := NULL;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_result_sheet_status_trg
BEFORE INSERT OR UPDATE ON public.result_sheets
FOR EACH ROW EXECUTE FUNCTION public.enforce_result_sheet_status();

-- 5. Refactor results table: add sheet_id, drop standalone term/year (kept on sheet)
TRUNCATE public.results;

ALTER TABLE public.results
  ADD COLUMN sheet_id UUID NOT NULL REFERENCES public.result_sheets(id) ON DELETE CASCADE,
  DROP COLUMN term,
  DROP COLUMN year;

ALTER TABLE public.results ADD CONSTRAINT results_sheet_subject_unique UNIQUE (sheet_id, subject);
ALTER TABLE public.results ADD CONSTRAINT results_score_range CHECK (score >= 0 AND score <= 100);

-- Replace old policies on results
DROP POLICY IF EXISTS results_admin_delete ON public.results;
DROP POLICY IF EXISTS results_parent_children ON public.results;
DROP POLICY IF EXISTS results_student_self ON public.results;
DROP POLICY IF EXISTS results_teacher_admin_insert ON public.results;
DROP POLICY IF EXISTS results_teacher_admin_select ON public.results;
DROP POLICY IF EXISTS results_teacher_admin_update ON public.results;

-- Staff can see all result rows
CREATE POLICY "results_staff_select"
ON public.results FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'));

-- Students see results only for their own confirmed sheets
CREATE POLICY "results_student_select_confirmed"
ON public.results FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.result_sheets rs
    JOIN public.students s ON s.id = rs.student_id
    WHERE rs.id = results.sheet_id AND rs.status = 'confirmed' AND s.user_id = auth.uid()
  )
);

-- Parents see results only for their children's confirmed sheets
CREATE POLICY "results_parent_select_confirmed"
ON public.results FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.result_sheets rs
    WHERE rs.id = results.sheet_id AND rs.status = 'confirmed' AND public.is_parent_of(auth.uid(), rs.student_id)
  )
);

-- Teachers + admins can insert/update scores while sheet is editable
CREATE POLICY "results_staff_insert"
ON public.results FOR INSERT TO authenticated
WITH CHECK (
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'))
  AND EXISTS (
    SELECT 1 FROM public.result_sheets rs
    WHERE rs.id = results.sheet_id
      AND (rs.status IN ('draft', 'submitted') OR public.has_role(auth.uid(), 'admin'))
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
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'))
  AND EXISTS (
    SELECT 1 FROM public.result_sheets rs
    WHERE rs.id = results.sheet_id
      AND (rs.status IN ('draft', 'submitted') OR public.has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "results_staff_delete"
ON public.results FOR DELETE TO authenticated
USING (
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'))
  AND EXISTS (
    SELECT 1 FROM public.result_sheets rs
    WHERE rs.id = results.sheet_id
      AND (rs.status IN ('draft', 'submitted') OR public.has_role(auth.uid(), 'admin'))
  )
);
