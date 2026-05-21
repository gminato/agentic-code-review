import { apiClient } from './client';

export interface DashboardStats {
  total_repositories: number;
  active_repositories: number;
  total_reviews: number;
  reviews_today: number;
  total_findings: number;
  open_pull_requests_count: number;
  risk_score_average: number;
  health_trends: any[];
  message?: string;
}

export const dashboardApi = {
  getStats: () => apiClient.get<DashboardStats>('/dashboard/stats'),
};
