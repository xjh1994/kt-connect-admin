import yaml from 'js-yaml';
import type { ClusterConfig, ConnectParams, ExchangeParams } from '../types';

function parseConfig(content: string): any {
  const trimmed = content.trim();
  if (trimmed.startsWith('{')) {
    return JSON.parse(trimmed);
  }
  return yaml.load(trimmed);
}

export function generateConnectCommand(
  cluster: ClusterConfig,
  params: Omit<ConnectParams, 'clusterId'>
): string {
  const args = ['connect'];
  
  if (params.namespace) {
    args.push('--namespace', params.namespace);
  }
  
  if (cluster.kubeconfig) {
    args.push('--kubeconfig', cluster.kubeconfigPath || 'config');
  }
  
  if (params.includeIps) {
    args.push('--includeIps', params.includeIps);
  }
  
  if (params.debug) {
    args.push('--debug');
  }
  
  return `ktctl ${args.join(' ')}`;
}

export function generateExchangeCommand(
  cluster: ClusterConfig,
  params: Omit<ExchangeParams, 'clusterId'>
): string {
  const args = ['exchange', params.serviceName];
  
  args.push('--expose', `${params.localPort}:${params.remotePort}`);
  
  if (params.namespace) {
    args.push('--namespace', params.namespace);
  }
  
  if (cluster.kubeconfig) {
    args.push('--kubeconfig', cluster.kubeconfigPath || 'config');
  }
  
  if (params.debug) {
    args.push('--debug');
  }
  
  return `ktctl ${args.join(' ')}`;
}

export function parseKubeconfig(kubeconfig: string): { apiServer: string; namespace: string } | null {
  try {
    const config = parseConfig(kubeconfig);
    const context = config.contexts?.find((c: any) => c.name === config['current-context']);
    const cluster = config.clusters?.find((c: any) => c.name === context?.context?.cluster);
    
    return {
      apiServer: cluster?.cluster?.server || '',
      namespace: context?.context?.namespace || 'default',
    };
  } catch {
    return null;
  }
}

export function extractApiServerInfo(kubeconfig: string): { host: string; port: string } | null {
  const parsed = parseKubeconfig(kubeconfig);
  if (!parsed?.apiServer) return null;
  
  try {
    const url = new URL(parsed.apiServer);
    return {
      host: url.hostname,
      port: url.port || (url.protocol === 'https:' ? '443' : '80'),
    };
  } catch {
    return null;
  }
}
