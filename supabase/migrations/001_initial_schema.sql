-- Enums
CREATE TYPE company_status AS ENUM ('active', 'suspended', 'trial');
CREATE TYPE user_role AS ENUM ('superadmin', 'company_admin', 'company_coadmin', 'employee', 'part_time', 'minijob');
CREATE TYPE leave_type AS ENUM ('vacation', 'flex_day', 'special_leave');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE time_entry_status AS ENUM ('active', 'completed', 'corrected');

-- Table: companies
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    street TEXT,
    zip_code TEXT,
    city TEXT,
    country TEXT DEFAULT 'Deutschland',
    region TEXT,
    timezone TEXT DEFAULT 'Europe/Berlin',
    rounding_enabled BOOLEAN DEFAULT true,
    sick_leave_email TEXT,
    sick_leave_contact_name TEXT,
    feature_toggles JSONB DEFAULT '{"rounding": true, "minijob_warning": true, "project_tracking": false, "team_calendar": true, "homeoffice": false, "auto_break": false, "notifications": true}'::jsonb,
    status company_status DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: profiles (Users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    employee_number TEXT,
    role user_role DEFAULT 'employee',
    daily_hours NUMERIC(5,2) DEFAULT 8.0,
    weekly_hours NUMERIC(5,2) DEFAULT 40.0,
    vacation_days_per_year INTEGER DEFAULT 25,
    hourly_rate NUMERIC(10,2),
    language TEXT DEFAULT 'de',
    pin_hash TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: work_config
CREATE TABLE work_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    target_role user_role,
    overtime_mode TEXT DEFAULT 'flex',
    overtime_threshold_daily NUMERIC(5,2) DEFAULT 8.0,
    overtime_threshold_weekly NUMERIC(5,2) DEFAULT 40.0,
    overtime_multiplier NUMERIC(3,2) DEFAULT 1.0,
    night_start TIME DEFAULT '23:00',
    night_end TIME DEFAULT '06:00',
    night_multiplier NUMERIC(3,2) DEFAULT 1.25,
    saturday_multiplier NUMERIC(3,2) DEFAULT 1.0,
    sunday_multiplier NUMERIC(3,2) DEFAULT 1.5,
    auto_deduct_break BOOLEAN DEFAULT false,
    auto_break_minutes_6h INTEGER DEFAULT 30,
    auto_break_minutes_9h INTEGER DEFAULT 45,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT one_target_only CHECK ((user_id IS NOT NULL AND target_role IS NULL) OR (user_id IS NULL AND target_role IS NOT NULL))
);

-- Table: time_entries
CREATE TABLE time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    work_date DATE NOT NULL,
    clock_in TIMESTAMPTZ NOT NULL,
    clock_in_rounded TIMESTAMPTZ,
    clock_in_rounding TEXT,
    clock_out TIMESTAMPTZ,
    clock_out_rounded TIMESTAMPTZ,
    clock_out_rounding TEXT,
    total_minutes INTEGER DEFAULT 0,
    pause_minutes INTEGER DEFAULT 0,
    net_minutes INTEGER DEFAULT 0,
    auto_deducted_minutes INTEGER DEFAULT 0,
    break_violation BOOLEAN DEFAULT false,
    max_hours_violation BOOLEAN DEFAULT false,
    rest_period_violation BOOLEAN DEFAULT false,
    work_location TEXT DEFAULT 'office',
    status time_entry_status DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: pause_entries
CREATE TABLE pause_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    time_entry_id UUID NOT NULL REFERENCES time_entries(id) ON DELETE CASCADE,
    pause_start TIMESTAMPTZ NOT NULL,
    pause_end TIMESTAMPTZ,
    duration_minutes INTEGER DEFAULT 0,
    is_manual BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: projects
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    is_predefined BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: task_entries
CREATE TABLE task_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    time_entry_id UUID REFERENCES time_entries(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    duration_minutes INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: holidays
CREATE TABLE holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    date DATE NOT NULL,
    is_half_day BOOLEAN DEFAULT false,
    region TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Table: leave_requests
CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count INTEGER NOT NULL,
    leave_type leave_type NOT NULL,
    status request_status DEFAULT 'pending',
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    admin_notes TEXT,
    user_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: sick_leave
CREATE TABLE sick_leave (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    expected_end_date DATE NOT NULL,
    actual_end_date DATE,
    work_days_count INTEGER,
    document_url TEXT,
    notes TEXT,
    notification_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: flextime_account
CREATE TABLE flextime_account (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    balance_minutes NUMERIC(10,2) DEFAULT 0,
    carry_over_minutes NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, year, month)
);

-- Table: correction_reasons
CREATE TABLE correction_reasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Table: audit_log
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    target_table TEXT NOT NULL,
    target_id UUID NOT NULL,
    action TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    reason TEXT,
    correction_reason_id UUID REFERENCES correction_reasons(id) ON DELETE SET NULL,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE pause_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE sick_leave ENABLE ROW LEVEL SECURITY;
ALTER TABLE flextime_account ENABLE ROW LEVEL SECURITY;
ALTER TABLE correction_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_user_company_id() RETURNS UUID AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
