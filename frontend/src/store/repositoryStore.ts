import { create } from 'zustand';
import { repositoriesApi, type Repository, type AvailableRepository } from '../api/repositories';

interface RepositoryState {
  repositories: Repository[];
  availableRepositories: AvailableRepository[];
  selectedRepositoryId: number | null;
  isLoading: boolean;
  isAvailableLoading: boolean;
  error: string | null;
  fetchRepositories: () => Promise<void>;
  fetchAvailableRepositories: () => Promise<void>;
  setSelectedRepositoryId: (id: number | null) => void;
  updateRepository: (id: number, data: Partial<Repository>) => Promise<void>;
  importRepository: (data: AvailableRepository) => Promise<void>;
  pullRequests: any[];
  isPullRequestsLoading: boolean;
  fetchPullRequests: (id: number) => Promise<void>;
}

export const useRepositoryStore = create<RepositoryState>((set, get) => ({
  repositories: [],
  availableRepositories: [],
  selectedRepositoryId: null,
  isLoading: false,
  isAvailableLoading: false,
  pullRequests: [],
  isPullRequestsLoading: false,
  error: null,
  fetchRepositories: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await repositoriesApi.list();
      const repos = response.data;
      set({ repositories: repos, isLoading: false });
      
      // Select first repository by default if none selected
      if (repos.length > 0 && get().selectedRepositoryId === null) {
        set({ selectedRepositoryId: repos[0].id });
      }
    } catch (error) {
      set({ error: 'Failed to fetch repositories', isLoading: false });
    }
  },
  fetchAvailableRepositories: async () => {
    set({ isAvailableLoading: true });
    try {
      const response = await repositoriesApi.getAvailable();
      set({ availableRepositories: response.data, isAvailableLoading: false });
    } catch (error) {
      set({ isAvailableLoading: false });
    }
  },
  setSelectedRepositoryId: (id) => set({ selectedRepositoryId: id }),
  updateRepository: async (id, data) => {
    try {
      const response = await repositoriesApi.update(id, data);
      set((state) => ({
        repositories: state.repositories.map((repo) => 
          repo.id === id ? response.data : repo
        ),
      }));
    } catch (error) {
      set({ error: 'Failed to update repository' });
    }
  },
  importRepository: async (data) => {
    try {
      const response = await repositoriesApi.import({
        github_repo_id: data.github_repo_id,
        full_name: data.full_name,
        installation_id: data.installation_id
      });
      const newRepo = response.data;
      set((state) => ({
        repositories: [...state.repositories, newRepo],
        selectedRepositoryId: newRepo.id
      }));
    } catch (error) {
      set({ error: 'Failed to import repository' });
    }
  },
  fetchPullRequests: async (id) => {
    set({ isPullRequestsLoading: true });
    try {
      const response = await repositoriesApi.getPullRequests(id);
      set({ pullRequests: response.data, isPullRequestsLoading: false });
    } catch (error) {
      set({ isPullRequestsLoading: false });
    }
  },
}));
