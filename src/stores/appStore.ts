import { create } from 'zustand';
import type { ClusterConfig, Task } from '../types';

interface AppState {
  clusters: ClusterConfig[];
  tasks: Task[];
  activeTaskId: string | null;
  sidebarCollapsed: boolean;
  
  // Cluster actions
  addCluster: (cluster: ClusterConfig) => void;
  updateCluster: (id: string, updates: Partial<ClusterConfig>) => void;
  deleteCluster: (id: string) => void;
  setClusters: (clusters: ClusterConfig[]) => void;
  
  // Task actions
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  setActiveTask: (id: string | null) => void;
  setTasks: (tasks: Task[]) => void;
  
  // UI actions
  toggleSidebar: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useAppStore = create<AppState>((set) => ({
  clusters: [],
  tasks: [],
  activeTaskId: null,
  sidebarCollapsed: false,

  addCluster: (cluster) => set((state) => ({
    clusters: [...state.clusters, { ...cluster, id: cluster.id || generateId() }]
  })),
  
  updateCluster: (id, updates) => set((state) => ({
    clusters: state.clusters.map(c => 
      c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
    )
  })),
  
  deleteCluster: (id) => set((state) => ({
    clusters: state.clusters.filter(c => c.id !== id)
  })),
  
  setClusters: (clusters) => set({ clusters }),

  addTask: (task) => set((state) => ({
    tasks: [...state.tasks, { ...task, id: task.id || generateId() }]
  })),
  
  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map(t => 
      t.id === id ? { ...t, ...updates } : t
    )
  })),
  
  removeTask: (id) => set((state) => ({
    tasks: state.tasks.filter(t => t.id !== id),
    activeTaskId: state.activeTaskId === id ? null : state.activeTaskId
  })),
  
  setActiveTask: (id) => set({ activeTaskId: id }),

  setTasks: (tasks) => set({ tasks }),

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));
