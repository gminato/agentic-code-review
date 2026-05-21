import { apiClient } from './client';

export interface Repository {
  id: number;
  full_name: string;
  is_active: boolean;
  default_branch: string;
  github_repo_id: number;
  installation_id: number;
}

export interface AvailableRepository {
  github_repo_id: number;
  full_name: string;
  installation_id: number;
  description?: string;
  private: boolean;
  html_url: string;
}

export const repositoriesApi = {
  list: () => apiClient.get<Repository[]>('/repositories/'),
  get: (id: number) => apiClient.get<Repository>(`/repositories/${id}`),
  update: (id: number, data: Partial<Repository>) => 
    apiClient.patch<Repository>(`/repositories/${id}`, data),
  getAvailable: () => apiClient.get<AvailableRepository[]>('/repositories/available'),
  import: (data: { github_repo_id: number; full_name: string; installation_id: number }) => 
    apiClient.post<Repository>('/repositories/import', data),
  getPullRequests: (id: number) => 
    apiClient.get<any[]>(`/repositories/${id}/pull-requests`),
};
