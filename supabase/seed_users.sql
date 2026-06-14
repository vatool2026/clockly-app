-- Skript: Initiales Setup für Clockly (Firma & Nutzer)
-- Führe dies im Supabase SQL Editor aus.
-- Vorher: Stelle sicher, dass die Datenbank wirklich leer ist (wie im vorherigen Schritt).

DO $$
DECLARE
    company_cb_id UUID := gen_random_uuid();
    
    user_superadmin_id UUID := gen_random_uuid();
    user_admin_id UUID := gen_random_uuid();
    user_employee_id UUID := gen_random_uuid();
BEGIN

    -- ==========================================
    -- 1. FIRMA ERSTELLEN
    -- ==========================================
    INSERT INTO public.companies (id, name, slug, status)
    VALUES (company_cb_id, 'CB Akustik e.K.', 'cb-akustik', 'active');

    -- ==========================================
    -- 2. SUPER ADMIN (Platform)
    -- ==========================================
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (
        user_superadmin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
        'vatool2026@gmail.com', crypt('Start123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()
    );

    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at)
    VALUES (
        gen_random_uuid(), user_superadmin_id, user_superadmin_id::text, 
        format('{"sub":"%s","email":"%s"}', user_superadmin_id::text, 'vatool2026@gmail.com')::jsonb, 'email', now(), now()
    );

    INSERT INTO public.profiles (id, company_id, first_name, last_name, email, role)
    VALUES (user_superadmin_id, company_cb_id, 'Platform', 'Admin', 'vatool2026@gmail.com', 'superadmin');


    -- ==========================================
    -- 3. COMPANY ADMIN (CB Akustik)
    -- ==========================================
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (
        user_admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
        'andre.reitz@cb-akustik.de', crypt('Start123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()
    );

    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at)
    VALUES (
        gen_random_uuid(), user_admin_id, user_admin_id::text, 
        format('{"sub":"%s","email":"%s"}', user_admin_id::text, 'andre.reitz@cb-akustik.de')::jsonb, 'email', now(), now()
    );

    INSERT INTO public.profiles (id, company_id, first_name, last_name, email, role)
    VALUES (user_admin_id, company_cb_id, 'Andre', 'Reitz', 'andre.reitz@cb-akustik.de', 'company_admin');


    -- ==========================================
    -- 4. MITARBEITER (CB Akustik)
    -- ==========================================
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (
        user_employee_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
        'andre.reitz88@googlemail.com', crypt('Start123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()
    );

    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at)
    VALUES (
        gen_random_uuid(), user_employee_id, user_employee_id::text, 
        format('{"sub":"%s","email":"%s"}', user_employee_id::text, 'andre.reitz88@googlemail.com')::jsonb, 'email', now(), now()
    );

    INSERT INTO public.profiles (id, company_id, first_name, last_name, email, role)
    VALUES (user_employee_id, company_cb_id, 'Andre', 'Mitarbeiter', 'andre.reitz88@googlemail.com', 'employee');

END $$;
