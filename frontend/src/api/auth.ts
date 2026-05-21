import { apiClient } from './client';

export const authApi = {
  getLoginUrl: () => apiClient.get('/auth/github/login'),
  callback: (code: string, state: string) => 
    apiClient.get(`/auth/github/callback?code=${code}&state=${state}`),
  getMe: () => apiClient.get('/auth/me'),
  logout: () => apiClient.post('/auth/logout'),
};
