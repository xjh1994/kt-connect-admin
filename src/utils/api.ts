import type { ClusterConfig, ApiResponse } from '../types';

const API_BASE = '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export const clusterApi = {
  getAll: () => request<ClusterConfig[]>('/clusters'),
  
  create: (cluster: Omit<ClusterConfig, 'id' | 'createdAt' | 'updatedAt'>) =>
    request<ClusterConfig>('/clusters', {
      method: 'POST',
      body: JSON.stringify(cluster),
    }),
  
  update: (id: string, updates: Partial<ClusterConfig>) =>
    request<ClusterConfig>(`/clusters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  
  delete: (id: string) =>
    request<void>(`/clusters/${id}`, { method: 'DELETE' }),
  
  test: (id: string) =>
    request<{ valid: boolean; message: string }>(`/clusters/${id}/test`, { method: 'POST' }),
};

export const commandApi = {
  execute: (params: {
    taskId: string;
    type: 'connect' | 'exchange';
    command: string;
    autoHosts?: boolean;
    apiServerHost?: string;
    cleanupOld?: boolean;
    clusterIp?: string;
    kubeconfig?: string;
  }) =>
    request<{ taskId: string; pid: number; hostsEntry?: { ip: string; hostname: string } }>('/command/execute', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  
  stop: (taskId: string) =>
    request<void>('/command/stop', {
      method: 'POST',
      body: JSON.stringify({ taskId }),
    }),
};

export const hostsApi = {
  read: () => request<string>('/hosts/read'),
  
  write: (entries: { ip: string; hostname: string }[]) =>
    request<void>('/hosts/write', {
      method: 'POST',
      body: JSON.stringify({ entries }),
    }),
  
  addEntry: (ip: string, hostname: string) =>
    request<void>('/hosts/add', {
      method: 'POST',
      body: JSON.stringify({ ip, hostname }),
    }),
  
  removeEntry: (hostname: string) =>
    request<void>('/hosts/remove', {
      method: 'POST',
      body: JSON.stringify({ hostname }),
    }),
};

export const taskApi = {
  getAll: (sessionId: string) => request<any[]>(`/tasks?sessionId=${sessionId}`),
  
  create: (task: any, sessionId: string) =>
    request<any>('/tasks', {
      method: 'POST',
      body: JSON.stringify({ ...task, sessionId }),
    }),
  
  update: (id: string, updates: any) =>
    request<any>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  
  delete: (id: string) =>
    request<void>(`/tasks/${id}`, { method: 'DELETE' }),
};
