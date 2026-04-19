
-- ========== ENUMS ==========
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'student', 'parent');
CREATE TYPE public.announcement_target AS ENUM ('all', 'parents', 'teachers', 'students', 'user');

-- ========== PROFILES ==========
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ========== USER ROLES ==========
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- ========== STUDENTS ==========
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  admission_no TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  class_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- ========== PARENT-STUDENT LINK ==========
CREATE TABLE public.parent_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(parent_user_id, student_id)
);
ALTER TABLE public.parent_students ENABLE ROW LEVEL SECURITY;

-- Helper: is this parent linked to this student?
CREATE OR REPLACE FUNCTION public.is_parent_of(_parent UUID, _student UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.parent_students WHERE parent_user_id = _parent AND student_id = _student)
$$;

-- ========== RESULTS ==========
CREATE TABLE public.results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  score NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  term TEXT NOT NULL,
  year INT NOT NULL,
  remarks TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_results_student ON public.results(student_id);

-- ========== ANNOUNCEMENTS ==========
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target announcement_target NOT NULL DEFAULT 'all',
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- ========== TIMESTAMP TRIGGER ==========
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_students_updated BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_results_updated BEFORE UPDATE ON public.results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== AUTO PROFILE ON SIGNUP ==========
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========== RLS POLICIES ==========

-- Profiles: visible to authenticated users; self-update only
CREATE POLICY "profiles_select_authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_self" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- User roles: user can read own; admins manage all
CREATE POLICY "user_roles_select_self" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_roles_admin_manage" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Students:
--  admin/teacher: all
--  student: own row
--  parent: linked children
CREATE POLICY "students_admin_teacher_all" ON public.students
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher')
  );
CREATE POLICY "students_self" ON public.students
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "students_parent" ON public.students
  FOR SELECT TO authenticated USING (public.is_parent_of(auth.uid(), id));
CREATE POLICY "students_admin_manage" ON public.students
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Parent-student links: admin manages; parent can see own links
CREATE POLICY "parent_students_admin_all" ON public.parent_students
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "parent_students_self_select" ON public.parent_students
  FOR SELECT TO authenticated USING (parent_user_id = auth.uid());

-- Results:
--  student sees own; parent sees children's; teacher/admin all
CREATE POLICY "results_student_self" ON public.results
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.students s WHERE s.id = results.student_id AND s.user_id = auth.uid())
  );
CREATE POLICY "results_parent_children" ON public.results
  FOR SELECT TO authenticated USING (public.is_parent_of(auth.uid(), student_id));
CREATE POLICY "results_teacher_admin_select" ON public.results
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "results_teacher_admin_insert" ON public.results
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "results_teacher_admin_update" ON public.results
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "results_admin_delete" ON public.results
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Announcements: admin manages; users see those targeted to them
CREATE POLICY "announcements_admin_manage" ON public.announcements
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "announcements_view_targeted" ON public.announcements
  FOR SELECT TO authenticated USING (
    target = 'all'
    OR (target = 'parents' AND public.has_role(auth.uid(), 'parent'))
    OR (target = 'teachers' AND public.has_role(auth.uid(), 'teacher'))
    OR (target = 'students' AND public.has_role(auth.uid(), 'student'))
    OR (target = 'user' AND target_user_id = auth.uid())
  );
