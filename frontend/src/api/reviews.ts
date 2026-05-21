import { apiClient } from './client';

export interface ReviewComment {
  id: number;
  review_id: number;
  file_path: string;
  line_number: number;
  severity: string;
  comment: string;
}

export interface Review {
  id: number;
  repository_id: number;
  commit_sha: string;
  pr_number?: number;
  status: string;
  summary?: string;
  risk_score?: number;
  created_at: string;
  comments: ReviewComment[];
}

export const reviewsApi = {
  run: (data: { repository_id: number; commit_sha: string; base_sha: string; pr_number?: number }) => 
    apiClient.post<Review>('/reviews/run', data),
  list: (repositoryId?: number) => 
    apiClient.get<Review[]>('/reviews/', { params: { repository_id: repositoryId } }),
  get: (id: number) => apiClient.get<Review>(`/reviews/${id}`),
};
