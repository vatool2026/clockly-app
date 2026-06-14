-- CREATE ENUM
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired');

-- CREATE TABLE
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token UUID DEFAULT gen_random_uuid() UNIQUE,
    role user_role DEFAULT 'employee',
    status invitation_status DEFAULT 'pending',
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ENABLE RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "Users can read invitations in same company"
ON public.invitations FOR SELECT
USING ( company_id = get_my_company_id() );

CREATE POLICY "Insert invitations (Admins)"
ON public.invitations FOR INSERT
WITH CHECK ( is_admin_or_manager(company_id) );

CREATE POLICY "Update invitations (Admins)"
ON public.invitations FOR UPDATE
USING ( is_admin_or_manager(company_id) );

CREATE POLICY "Public read for invitations"
ON public.invitations FOR SELECT
USING (true);
