-- Clockly RLS Policies Fix

-- Enable RLS for all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pause_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sick_leave ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Drop old policies to ensure clean state
DROP POLICY IF EXISTS "Users can read own company" ON public.companies;
DROP POLICY IF EXISTS "Anyone can insert company (Registration)" ON public.companies;
DROP POLICY IF EXISTS "Users can read profiles in same company" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can insert profile (Registration)" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own time entries, managers read all" ON public.time_entries;
DROP POLICY IF EXISTS "Users can insert own time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Users can update own time entries, managers update all" ON public.time_entries;
DROP POLICY IF EXISTS "Read pause entries via time_entry" ON public.pause_entries;
DROP POLICY IF EXISTS "Insert pause entries" ON public.pause_entries;
DROP POLICY IF EXISTS "Update pause entries" ON public.pause_entries;
DROP POLICY IF EXISTS "Read projects" ON public.projects;
DROP POLICY IF EXISTS "Insert projects (Admins)" ON public.projects;
DROP POLICY IF EXISTS "Users can manage task entries" ON public.task_entries;
DROP POLICY IF EXISTS "Read absences" ON public.leave_requests;
DROP POLICY IF EXISTS "Insert absences" ON public.leave_requests;
DROP POLICY IF EXISTS "Update absences (Managers)" ON public.leave_requests;
DROP POLICY IF EXISTS "Read sick" ON public.sick_leave;
DROP POLICY IF EXISTS "Insert sick" ON public.sick_leave;
DROP POLICY IF EXISTS "Admins read audit logs" ON public.audit_log;
DROP POLICY IF EXISTS "Anyone can insert audit logs" ON public.audit_log;

-- 1. SECURITY DEFINER HELPER FUNCTIONS
-- These bypass RLS intentionally so we don't get infinite recursion when querying profiles from within a policy.
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS uuid
LANGUAGE sql SECURITY DEFINER SET search_path = public
STABLE
AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION is_admin_or_manager(check_company_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND company_id = check_company_id 
    AND role IN ('manager', 'superadmin')
  );
$$;

-- COMPANIES
CREATE POLICY "Users can read own company" 
ON public.companies FOR SELECT 
USING ( id = get_my_company_id() );

CREATE POLICY "Anyone can insert company (Registration)" 
ON public.companies FOR INSERT 
WITH CHECK (true);

-- PROFILES
CREATE POLICY "Users can read profiles in same company" 
ON public.profiles FOR SELECT 
USING ( company_id = get_my_company_id() );

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (id = auth.uid());

CREATE POLICY "Anyone can insert profile (Registration)" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- TIME ENTRIES
CREATE POLICY "Users can read own time entries, managers read all" 
ON public.time_entries FOR SELECT 
USING ( user_id = auth.uid() OR is_admin_or_manager(company_id) );

CREATE POLICY "Users can insert own time entries" 
ON public.time_entries FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own time entries, managers update all" 
ON public.time_entries FOR UPDATE 
USING ( user_id = auth.uid() OR is_admin_or_manager(company_id) );

-- PAUSE ENTRIES
CREATE POLICY "Read pause entries via time_entry"
ON public.pause_entries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.time_entries t 
    WHERE t.id = pause_entries.time_entry_id AND (
      t.user_id = auth.uid() OR is_admin_or_manager(t.company_id)
    )
  )
);

CREATE POLICY "Insert pause entries"
ON public.pause_entries FOR INSERT
WITH CHECK (true);

CREATE POLICY "Update pause entries"
ON public.pause_entries FOR UPDATE
USING (true);

-- PROJECTS
CREATE POLICY "Read projects"
ON public.projects FOR SELECT
USING (company_id = get_my_company_id());

CREATE POLICY "Insert projects (Admins)"
ON public.projects FOR INSERT
WITH CHECK (is_admin_or_manager(company_id));

-- TASK ENTRIES
CREATE POLICY "Users can manage task entries" 
ON public.task_entries FOR ALL 
USING (user_id = auth.uid());

-- LEAVE REQUESTS
CREATE POLICY "Read absences" 
ON public.leave_requests FOR SELECT 
USING ( user_id = auth.uid() OR is_admin_or_manager(company_id) );

CREATE POLICY "Insert absences" 
ON public.leave_requests FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Update absences (Managers)" 
ON public.leave_requests FOR UPDATE 
USING ( is_admin_or_manager(company_id) );

-- SICK LEAVE
CREATE POLICY "Read sick" 
ON public.sick_leave FOR SELECT 
USING ( user_id = auth.uid() OR is_admin_or_manager(company_id) );

CREATE POLICY "Insert sick" 
ON public.sick_leave FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- AUDIT LOG
CREATE POLICY "Admins read audit logs" 
ON public.audit_log FOR SELECT 
USING ( is_admin_or_manager(company_id) );

CREATE POLICY "Anyone can insert audit logs" 
ON public.audit_log FOR INSERT 
WITH CHECK (user_id = auth.uid());

