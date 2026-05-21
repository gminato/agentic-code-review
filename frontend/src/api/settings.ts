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

export const settingsApi = {
  getInstallations: () => 
    apiClient.get<GitHubInstallation[]>('/settings/installations'),
};
