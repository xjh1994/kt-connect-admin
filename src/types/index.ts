// Cluster configuration types
export interface ClusterConfig {
  id: string;
  name: string;
  kubeconfig: string;
  kubeconfigPath?: string;
  apiServer: string;
  apiServerHost?: string;
  clusterIp?: string;  // Kubesphere API server hostname, e.g., lb.kubesphere.local
  namespace: string;
  includeIps?: string;
  autoHosts?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Task types
export type TaskType = 'connect' | 'exchange';
export type TaskStatus = 'pending' | 'running' | 'success' | 'error' | 'stopped';

export interface ConnectParams {
  clusterId: string;
  namespace: string;
  includeIps?: string;
  autoHosts: boolean;
  debug: boolean;
}

export interface ExchangeParams {
  clusterId: string;
  namespace: string;
  serviceName: string;
  localPort: number;
  remotePort: number;
  debug: boolean;
}

export interface Task {
  id: string;
  type: TaskType;
  status: TaskStatus;
  params: ConnectParams | ExchangeParams;
  logs: string[];
  startTime: string;
  endTime?: string;
  pid?: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Hosts entry
export interface HostsEntry {
  ip: string;
  hostname: string;
  comment?: string;
}
