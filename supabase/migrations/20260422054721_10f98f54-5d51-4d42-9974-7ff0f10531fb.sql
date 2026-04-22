-- Add school_name to site_settings (admin-editable branding)
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS school_name TEXT;

-- Storage bucket for assignment files (private, served via signed URLs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('assignments', 'assignments', false)
ON CONFLICT (id) DO NOTHING;

-- Assignments table
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  class_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  due_date DATE,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Staff (admin/teacher) full manage
CREATE POLICY "assignments_staff_manage"
  ON public.assignments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'));

-- Students see assignments for their class
CREATE POLICY "assignments_student_select"
  ON public.assignments FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.user_id = auth.uid() AND s.class_name = assignments.class_name
  ));

-- Parents see assignments for any of their children's classes
CREATE POLICY "assignments_parent_select"
  ON public.assignments FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.parent_students ps
    JOIN public.students s ON s.id = ps.student_id
    WHERE ps.parent_user_id = auth.uid() AND s.class_name = assignments.class_name
  ));

CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage RLS for assignments bucket
-- Staff can upload/update/delete
CREATE POLICY "assignments_storage_staff_all"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'assignments' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher')))
  WITH CHECK (bucket_id = 'assignments' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher')));

-- Students can read files for their class
CREATE POLICY "assignments_storage_student_read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'assignments' AND EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.students s ON s.class_name = a.class_name
      WHERE a.file_path = storage.objects.name AND s.user_id = auth.uid()
    )
  );

-- Parents can read files for their children's classes
CREATE POLICY "assignments_storage_parent_read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'assignments' AND EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.students s ON s.class_name = a.class_name
      JOIN public.parent_students ps ON ps.student_id = s.id
      WHERE a.file_path = storage.objects.name AND ps.parent_user_id = auth.uid()
    )
  );