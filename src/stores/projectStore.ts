import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

export interface Project {
  id: string;
  name: string;
  client_name?: string;
  status: 'active' | 'completed' | 'archived';
}

interface ProjectState {
  projects: Project[];
  isLoading: boolean;
  fetchProjects: () => Promise<void>;
  addProject: (name: string, clientName?: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  isLoading: false,

  fetchProjects: async () => {
    set({ isLoading: true });
    try {
      const { profile } = useAuthStore.getState();
      if (!profile?.company_id) return;

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('name');
        
      if (!error && data) {
        set({ projects: data as Project[] });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  addProject: async (name: string, clientName?: string) => {
    const { profile } = useAuthStore.getState();
    if (!profile?.company_id) return;

    const { data, error } = await supabase
      .from('projects')
      .insert({
        company_id: profile.company_id,
        name,
        client_name: clientName,
        status: 'active'
      })
      .select()
      .single();

    if (!error && data) {
      set((state) => ({ projects: [...state.projects, data as Project] }));
    }
  }
}));
