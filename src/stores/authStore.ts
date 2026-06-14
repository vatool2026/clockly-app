import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: any | null; // Will type properly later
  isLoading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
  registerCompany: (data: any) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  profile: null,
  isLoading: true,

  signIn: async () => {
    // Dummy implementation to satisfy TypeScript. We use Supabase UI for login.
  },

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        set({ session, user: session.user, profile, isLoading: false });
      } else {
        set({ session: null, user: null, profile: null, isLoading: false });
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (_event, newSession) => {
        if (newSession?.user) {
           const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newSession.user.id)
            .single();
          set({ session: newSession, user: newSession.user, profile });
        } else {
          set({ session: null, user: null, profile: null });
        }
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },

  registerCompany: async ({ email, password, firstName, lastName, companyName }) => {
    // 1. Sign up user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Registrierung fehlgeschlagen");

    // Create a slug for the company
    const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    
    // Generate an ID so we don't have to read the row back from the database (which would violate RLS because profile doesn't exist yet)
    const companyId = crypto.randomUUID();

    // 2. Create Company (without .select() to avoid RLS read policy violation)
    const { error: companyError } = await supabase
      .from('companies')
      .insert({ id: companyId, name: companyName, slug });

    if (companyError) throw companyError;

    // 3. Create Profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        company_id: companyId,
        first_name: firstName,
        last_name: lastName,
        email: email,
        role: 'superadmin'
      });

    if (profileError) throw profileError;
  }
}));
