import { apiClient } from './client';

export interface GitHubInstallation {
  id: number;
  account: {
    login: string;
    avatar_url: string;
    type: string;
  };
  repository_selection: string;
  html_url: string;
}

export interface LLMConfig {
  provider: string;
  api_key: string;
  model: string;
  temperature?: number;
  max_tokens?: number;
}

export const settingsApi = {
  getInstallations: () => 
    apiClient.get<GitHubInstallation[]>('/settings/installations'),
  getLLMConfig: () =>
    apiClient.get<LLMConfig>('/settings/llm'),
  updateLLMConfig: (config: LLMConfig) =>
    apiClient.put<LLMConfig>('/settings/llm', config),
};
