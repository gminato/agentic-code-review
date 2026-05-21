import { apiClient } from './client';

export interface Agent {
  id: number;
  repository_id: number;
  name: string;
  model: string;
  prompt: string;
  config_json?: Record<string, any> | null;
  enabled: boolean;
}

export interface AgentCreate {
  repository_id: number;
  name: string;
  model: string;
  prompt: string;
  config_json?: Record<string, any> | null;
  enabled?: boolean;
}

export interface AgentUpdate {
  name?: string;
  model?: string;
  prompt?: string;
  config_json?: Record<string, any> | null;
  enabled?: boolean;
}

export const agentsApi = {
  list: (repositoryId: number) => 
    apiClient.get<Agent[]>('/agents/', { params: { repository_id: repositoryId } }),
  create: (data: AgentCreate) => 
    apiClient.post<Agent>('/agents/', data),
  update: (id: number, data: AgentUpdate) => 
    apiClient.patch<Agent>(`/agents/${id}`, data),
  delete: (id: number) => 
    apiClient.delete<{ message: string }>(`/agents/${id}`),
};
