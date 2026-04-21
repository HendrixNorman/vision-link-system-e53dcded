
CREATE OR REPLACE FUNCTION public.enforce_result_sheet_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  required_subjects TEXT[];
  scored_subjects TEXT[];
  subj_count INT;
BEGIN
  IF NEW.status = 'submitted' AND (TG_OP = 'INSERT' OR OLD.status <> 'submitted') THEN
    SELECT ARRAY(SELECT subject FROM public.student_subjects WHERE student_id = NEW.student_id ORDER BY subject)
      INTO required_subjects;

    subj_count := COALESCE(array_length(required_subjects, 1), 0);

    IF subj_count < 7 OR subj_count > 9 THEN
      RAISE EXCEPTION 'Student must have between 7 and 9 assigned subjects before submission (currently %).', subj_count;
    END IF;

    SELECT ARRAY(SELECT subject FROM public.results WHERE sheet_id = NEW.id ORDER BY subject)
      INTO scored_subjects;

    IF scored_subjects IS DISTINCT FROM required_subjects THEN
      RAISE EXCEPTION 'Every assigned subject must have a score before submission.';
    END IF;

    NEW.submitted_at := COALESCE(NEW.submitted_at, now());
    NEW.submitted_by := COALESCE(NEW.submitted_by, auth.uid());
  END IF;

  IF NEW.status = 'confirmed' AND (TG_OP = 'INSERT' OR OLD.status <> 'confirmed') THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Only an admin can confirm a result sheet.';
    END IF;
    NEW.confirmed_at := COALESCE(NEW.confirmed_at, now());
    NEW.confirmed_by := COALESCE(NEW.confirmed_by, auth.uid());
  END IF;

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
