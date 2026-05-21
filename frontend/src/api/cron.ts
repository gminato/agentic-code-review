import { apiClient } from './client';

export interface CronJob {
  id: number;
  repository_id: number;
  cron_expression: string;
  agent_id: number;
  enabled: boolean;
}

export interface CronJobCreate {
  repository_id: number;
  agent_id: number;
  cron_expression: string;
  enabled?: boolean;
}

export interface CronJobUpdate {
  agent_id?: number;
  cron_expression?: string;
  enabled?: boolean;
}

export const cronApi = {
  list: (repositoryId: number) => 
    apiClient.get<CronJob[]>('/cron-jobs/', { params: { repository_id: repositoryId } }),
  create: (data: CronJobCreate) => 
    apiClient.post<CronJob>('/cron-jobs/', data),
  update: (id: number, data: CronJobUpdate) => 
    apiClient.patch<CronJob>(`/cron-jobs/${id}`, data),
  delete: (id: number) => 
    apiClient.delete<{ message: string }>(`/cron-jobs/${id}`),
};
