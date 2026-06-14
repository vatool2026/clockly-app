import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';
import { useTimerStore } from './timerStore';

interface TaskState {
  activeTaskId: string | null;
  activeProjectId: string | null;
  taskStartTime: Date | null;
  
  startTask: (projectId: string, description?: string) => Promise<void>;
  stopTask: () => Promise<void>;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      activeTaskId: null,
      activeProjectId: null,
      taskStartTime: null,

      startTask: async (projectId: string, description: string = '') => {
    const { user, profile } = useAuthStore.getState();
    const { timeEntryId } = useTimerStore.getState();
    
    if (!user || !profile || !timeEntryId) return;

    // If there is an active task, stop it first
    const { activeTaskId } = get();
    if (activeTaskId) {
      await get().stopTask();
    }

    const now = new Date();
    set({ activeProjectId: projectId, taskStartTime: now });

    const { data } = await supabase
      .from('task_entries')
      .insert({
        time_entry_id: timeEntryId,
        project_id: projectId,
        user_id: user.id,
        description,
        task_start: now.toISOString()
      })
      .select()
      .single();

    if (data) {
      set({ activeTaskId: data.id });
    }
  },

  stopTask: async () => {
    const { activeTaskId, taskStartTime } = get();
    if (!activeTaskId || !taskStartTime) return;

    const now = new Date();
    const durationMins = Math.floor((now.getTime() - taskStartTime.getTime()) / 60000);

    set({ activeTaskId: null, activeProjectId: null, taskStartTime: null });

      await supabase
        .from('task_entries')
        .update({
          task_end: now.toISOString(),
          duration_minutes: durationMins
        })
        .eq('id', activeTaskId);
    }
  }),
  {
    name: 'clockly-task-storage',
  }
));
