import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

export interface LeaveRequest {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
}

export interface SickLeave {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  status: 'reported' | 'acknowledged';
}

interface AbsenceState {
  leaveRequests: LeaveRequest[];
  sickLeaves: SickLeave[];
  isLoading: boolean;
  
  fetchAbsences: () => Promise<void>;
  requestLeave: (startDate: string, endDate: string, reason?: string) => Promise<void>;
  reportSick: (startDate: string, endDate: string) => Promise<void>;
  updateLeaveStatus: (id: string, status: 'approved' | 'rejected') => Promise<void>;
}

export const useAbsenceStore = create<AbsenceState>((set) => ({
  leaveRequests: [],
  sickLeaves: [],
  isLoading: false,

  fetchAbsences: async () => {
    set({ isLoading: true });
    try {
      const { user, profile } = useAuthStore.getState();
      if (!user || !profile) return;

      // If user is superadmin or manager, they see all company absences. Otherwise only theirs.
      const isManager = profile.role === 'superadmin' || profile.role === 'manager';

      let leaveQuery = supabase.from('leave_requests').select('*').order('start_date', { ascending: false });
      let sickQuery = supabase.from('sick_leave').select('*').order('start_date', { ascending: false });

      if (!isManager) {
        leaveQuery = leaveQuery.eq('user_id', user.id);
        sickQuery = sickQuery.eq('user_id', user.id);
      }

      const [leaveRes, sickRes] = await Promise.all([
        leaveQuery,
        sickQuery
      ]);

      if (!leaveRes.error) set({ leaveRequests: leaveRes.data as LeaveRequest[] });
      if (!sickRes.error) set({ sickLeaves: sickRes.data as SickLeave[] });

    } finally {
      set({ isLoading: false });
    }
  },

  requestLeave: async (startDate, endDate, reason) => {
    const { user, profile } = useAuthStore.getState();
    if (!user || !profile?.company_id) return;

    const { data, error } = await supabase
      .from('leave_requests')
      .insert({
        company_id: profile.company_id,
        user_id: user.id,
        start_date: startDate,
        end_date: endDate,
        reason,
        status: 'pending'
      })
      .select()
      .single();

    if (!error && data) {
      set((state) => ({ leaveRequests: [data as LeaveRequest, ...state.leaveRequests] }));
    }
  },

  reportSick: async (startDate, endDate) => {
    const { user, profile } = useAuthStore.getState();
    if (!user || !profile?.company_id) return;

    const { data, error } = await supabase
      .from('sick_leave')
      .insert({
        company_id: profile.company_id,
        user_id: user.id,
        start_date: startDate,
        end_date: endDate,
        status: 'reported'
      })
      .select()
      .single();

    if (!error && data) {
      set((state) => ({ sickLeaves: [data as SickLeave, ...state.sickLeaves] }));
    }
  },

  updateLeaveStatus: async (id, status) => {
    const { error } = await supabase
      .from('leave_requests')
      .update({ status })
      .eq('id', id);

    if (!error) {
      set((state) => ({
        leaveRequests: state.leaveRequests.map(lr => lr.id === id ? { ...lr, status } : lr)
      }));
    }
  }
}));
