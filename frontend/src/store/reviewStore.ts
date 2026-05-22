import { create } from 'zustand';
import { reviewsApi, type Review } from '../api/reviews';

interface ReviewState {
  reviews: Review[];
  currentReview: Review | null;
  isLoading: boolean;
  error: string | null;
  fetchReviews: (repositoryId?: number) => Promise<void>;
  fetchReview: (id: number) => Promise<void>;
  runReview: (data: { repository_id: number; commit_sha: string; base_sha: string; pr_number?: number }) => Promise<Review>;
}

export const useReviewStore = create<ReviewState>((set) => ({
  reviews: [],
  currentReview: null,
  isLoading: false,
  error: null,
  fetchReviews: async (repositoryId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await reviewsApi.list(repositoryId);
      set({ reviews: response.data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch reviews', isLoading: false });
    }
  },
  fetchReview: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await reviewsApi.get(id);
      set({ currentReview: response.data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch review', isLoading: false });
    }
  },
  runReview: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await reviewsApi.run(data);
      const newReview = response.data;
      set((state) => ({ 
        reviews: [newReview, ...state.reviews],
        isLoading: false 
      }));
      return newReview;
    } catch (error) {
      set({ error: 'Failed to trigger review', isLoading: false });
      throw error;
    }
  },
}));
