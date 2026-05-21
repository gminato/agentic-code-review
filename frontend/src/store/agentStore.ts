import { create } from 'zustand';
import { agentsApi, type Agent, type AgentCreate, type AgentUpdate } from '../api/agents';

interface AgentState {
  agents: Agent[];
  isLoading: boolean;
  error: string | null;
  fetchAgents: (repositoryId: number) => Promise<void>;
  createAgent: (data: AgentCreate) => Promise<void>;
  updateAgent: (id: number, data: AgentUpdate) => Promise<void>;
  deleteAgent: (id: number) => Promise<void>;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: [],
  isLoading: false,
  error: null,
  fetchAgents: async (repositoryId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await agentsApi.list(repositoryId);
      set({ agents: response.data, isLoading: false });
    } catch (err: any) {
      set({ error: 'Failed to fetch agents', isLoading: false });
    }
  },
  createAgent: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await agentsApi.create(data);
      set({ 
        agents: [...get().agents, response.data],
        isLoading: false 
      });
    } catch (err: any) {
      set({ error: 'Failed to create agent', isLoading: false });
      throw err;
    }
  },
  updateAgent: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await agentsApi.update(id, data);
      set({
        agents: get().agents.map((agent) => 
          agent.id === id ? response.data : agent
        ),
        isLoading: false
      });
    } catch (err: any) {
      set({ error: 'Failed to update agent', isLoading: false });
      throw err;
    }
  },
  deleteAgent: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await agentsApi.delete(id);
      set({
        agents: get().agents.filter((agent) => agent.id !== id),
        isLoading: false
      });
    } catch (err: any) {
      set({ error: 'Failed to delete agent', isLoading: false });
      throw err;
    }
  },
}));
