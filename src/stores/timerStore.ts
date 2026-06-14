import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

export type TimerStage = 'ready' | 'working' | 'paused' | 'post-pause' | 'summary';

interface TimerState {
  stage: TimerStage;
  timeEntryId: string | null;
  pauseEntryId: string | null;
  startTime: Date | null;
  currentPauseStart: Date | null;
  totalPauseMinutes: number;
  isLoading: boolean;
  
  // Actions
  initializeTimer: () => Promise<void>;
  startWork: () => Promise<void>;
  startPause: () => Promise<void>;
  stopPause: () => Promise<void>;
  stopWork: () => Promise<void>;
  resetTimer: () => void;
  setStage: (stage: TimerStage) => void;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
  stage: 'ready',
  timeEntryId: null,
  pauseEntryId: null,
  startTime: null,
  currentPauseStart: null,
  totalPauseMinutes: 0,
  isLoading: true,

  initializeTimer: async () => {
    set({ isLoading: true });
    try {
      const { user, profile } = useAuthStore.getState();
      if (!user || !profile?.company_id) return;

      // Check for active time entry today
      const today = new Date().toISOString().split('T')[0];
      const { data: activeEntry } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('work_date', today)
        .in('status', ['active'])
        .single();

      if (activeEntry) {
        // Check for active pause
        const { data: activePause } = await supabase
          .from('pause_entries')
          .select('*')
          .eq('time_entry_id', activeEntry.id)
          .is('pause_end', null)
          .single();

        if (activePause) {
          set({
            stage: 'paused',
            timeEntryId: activeEntry.id,
            pauseEntryId: activePause.id,
            startTime: new Date(activeEntry.clock_in),
            currentPauseStart: new Date(activePause.pause_start),
            totalPauseMinutes: activeEntry.pause_minutes || 0
          });
        } else {
          set({
            stage: activeEntry.pause_minutes > 0 ? 'post-pause' : 'working',
            timeEntryId: activeEntry.id,
            startTime: new Date(activeEntry.clock_in),
            totalPauseMinutes: activeEntry.pause_minutes || 0
          });
        }
      } else {
        set({ stage: 'ready' });
      }
    } catch (error) {
      console.error("Error loading timer state:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  startWork: async () => {
    const { user, profile } = useAuthStore.getState();
    if (!user || !profile?.company_id) return;
    
    const now = new Date();
    set({ stage: 'working', startTime: now });

    const { data, error } = await supabase
      .from('time_entries')
      .insert({
        company_id: profile.company_id,
        user_id: user.id,
        work_date: now.toISOString().split('T')[0],
        clock_in: now.toISOString(),
        status: 'active'
      })
      .select()
      .single();
      
    if (data) {
      set({ timeEntryId: data.id });
    }
  },

  startPause: async () => {
    const { timeEntryId } = get();
    if (!timeEntryId) return;

    const now = new Date();
    set({ stage: 'paused', currentPauseStart: now });

    const { data } = await supabase
      .from('pause_entries')
      .insert({
        time_entry_id: timeEntryId,
        pause_start: now.toISOString()
      })
      .select()
      .single();
      
    if (data) {
      set({ pauseEntryId: data.id });
    }
  },

  stopPause: async () => {
    const { pauseEntryId, timeEntryId, currentPauseStart, totalPauseMinutes } = get();
    if (!pauseEntryId || !timeEntryId || !currentPauseStart) return;

    const now = new Date();
    const pauseDurationMs = now.getTime() - currentPauseStart.getTime();
    const pauseDurationMins = Math.floor(pauseDurationMs / 60000);
    const newTotalPause = totalPauseMinutes + pauseDurationMins;

    set({ 
      stage: 'post-pause', 
      currentPauseStart: null,
      pauseEntryId: null,
      totalPauseMinutes: newTotalPause 
    });

    // Update pause entry
    await supabase
      .from('pause_entries')
      .update({
        pause_end: now.toISOString(),
        duration_minutes: pauseDurationMins
      })
      .eq('id', pauseEntryId);

    // Update time entry total pause
    await supabase
      .from('time_entries')
      .update({ pause_minutes: newTotalPause })
      .eq('id', timeEntryId);
  },

  stopWork: async () => {
    // Just move to summary for now, we will do the final DB update in StageSummary
    set({ stage: 'summary' });
  },

  resetTimer: () => {
    set({
      stage: 'ready',
      timeEntryId: null,
      pauseEntryId: null,
      startTime: null,
      currentPauseStart: null,
      totalPauseMinutes: 0
    });
  },

    setStage: (stage: TimerStage) => set({ stage })
  }),
  {
    name: 'clockly-timer-storage',
    // We don't persist isLoading
    partialize: (state) => ({ 
      stage: state.stage,
      timeEntryId: state.timeEntryId,
      pauseEntryId: state.pauseEntryId,
      startTime: state.startTime,
      currentPauseStart: state.currentPauseStart,
      totalPauseMinutes: state.totalPauseMinutes
    }),
  }
));
