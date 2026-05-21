import { create } from 'zustand';
import { cronApi, type CronJob, type CronJobCreate, type CronJobUpdate } from '../api/cron';

interface CronState {
  cronJobs: CronJob[];
  isLoading: boolean;
  error: string | null;
  fetchCronJobs: (repositoryId: number) => Promise<void>;
  createCronJob: (data: CronJobCreate) => Promise<void>;
  updateCronJob: (id: number, data: CronJobUpdate) => Promise<void>;
  deleteCronJob: (id: number) => Promise<void>;
}

export const useCronStore = create<CronState>((set, get) => ({
  cronJobs: [],
  isLoading: false,
  error: null,
  fetchCronJobs: async (repositoryId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await cronApi.list(repositoryId);
      set({ cronJobs: response.data, isLoading: false });
    } catch (err: any) {
      set({ error: 'Failed to fetch cron jobs', isLoading: false });
    }
  },
  createCronJob: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await cronApi.create(data);
      set({ 
        cronJobs: [...get().cronJobs, response.data],
        isLoading: false 
      });
    } catch (err: any) {
      set({ error: 'Failed to create cron job', isLoading: false });
      throw err;
    }
  },
  updateCronJob: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await cronApi.update(id, data);
      set({
        cronJobs: get().cronJobs.map((job) => 
          job.id === id ? response.data : job
        ),
        isLoading: false
      });
    } catch (err: any) {
      set({ error: 'Failed to update cron job', isLoading: false });
      throw err;
    }
  },
  deleteCronJob: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await cronApi.delete(id);
      set({
        cronJobs: get().cronJobs.filter((job) => job.id !== id),
        isLoading: false
      });
    } catch (err: any) {
      set({ error: 'Failed to delete cron job', isLoading: false });
      throw err;
    }
  },
}));
