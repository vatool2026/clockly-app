-- Clockly RLS Policies

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

-- COMPANIES
CREATE POLICY "Users can read own company" 
ON public.companies FOR SELECT 
USING (
  id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

-- Note: Inserting a new company requires bypass RLS or a secure edge function.
-- Da wir die Registrierung vom Client machen, erlauben wir das Einfügen kurzzeitig (wird im produktiven Einsatz durch Webhooks oder Functions geregelt).
CREATE POLICY "Anyone can insert company (Registration)" 
ON public.companies FOR INSERT 
WITH CHECK (true);

-- PROFILES
CREATE POLICY "Users can read profiles in same company" 
ON public.profiles FOR SELECT 
USING (
  company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (id = auth.uid());

CREATE POLICY "Anyone can insert profile (Registration)" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- TIME ENTRIES
CREATE POLICY "Users can read own time entries, managers read all" 
ON public.time_entries FOR SELECT 
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.company_id = time_entries.company_id AND p.role IN ('manager', 'superadmin')
  )
);

CREATE POLICY "Users can insert own time entries" 
ON public.time_entries FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own time entries, managers update all" 
ON public.time_entries FOR UPDATE 
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.company_id = time_entries.company_id AND p.role IN ('manager', 'superadmin')
  )
);

-- PAUSE ENTRIES
CREATE POLICY "Read pause entries via time_entry"
ON public.pause_entries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.time_entries t 
    WHERE t.id = pause_entries.time_entry_id AND (
      t.user_id = auth.uid() OR 
      EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = auth.uid() AND p.company_id = t.company_id AND p.role IN ('manager', 'superadmin')
      )
    )
  )
);

CREATE POLICY "Insert pause entries"
ON public.pause_entries FOR INSERT
WITH CHECK (true); -- Implikation: Der User darf auch Pause machen

CREATE POLICY "Update pause entries"
ON public.pause_entries FOR UPDATE
USING (true);

-- PROJECTS
CREATE POLICY "Read projects"
ON public.projects FOR SELECT
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Insert projects (Admins)"
ON public.projects FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.company_id = projects.company_id AND p.role IN ('manager', 'superadmin')
  )
);

-- TASK ENTRIES
CREATE POLICY "Users can manage task entries" 
ON public.task_entries FOR ALL 
USING (user_id = auth.uid());

-- LEAVE REQUESTS & SICK LEAVE
CREATE POLICY "Read absences" 
ON public.leave_requests FOR SELECT 
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.company_id = leave_requests.company_id AND p.role IN ('manager', 'superadmin')
  )
);

CREATE POLICY "Insert absences" 
ON public.leave_requests FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Update absences (Managers)" 
ON public.leave_requests FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.company_id = leave_requests.company_id AND p.role IN ('manager', 'superadmin')
  )
);

-- SICK LEAVE (same as leave requests)
CREATE POLICY "Read sick" 
ON public.sick_leave FOR SELECT 
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.company_id = sick_leave.company_id AND p.role IN ('manager', 'superadmin')
  )
);

CREATE POLICY "Insert sick" 
ON public.sick_leave FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- AUDIT LOG
CREATE POLICY "Admins read audit logs" 
ON public.audit_log FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.company_id = audit_log.company_id AND p.role IN ('manager', 'superadmin')
  )
);

CREATE POLICY "Anyone can insert audit logs" 
ON public.audit_log FOR INSERT 
WITH CHECK (user_id = auth.uid());
