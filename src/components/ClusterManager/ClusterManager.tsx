import { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import type { ClusterConfig } from '../../types';
import { extractApiServerInfo } from '../../utils/commands';
import { clusterApi } from '../../utils/api';

interface ClusterFormData {
  name: string;
  kubeconfig: string;
  namespace: string;
  includeIps: string;
  autoHosts: boolean;
  apiServerHost: string;
  clusterIp: string;
}

const initialFormData: ClusterFormData = {
  name: '',
  kubeconfig: '',
  namespace: 'default',
  includeIps: '',
  autoHosts: true,
  apiServerHost: 'lb.kubesphere.local',
  clusterIp: '',
};

export function ClusterManager() {
  const { clusters, addCluster, updateCluster, deleteCluster } = useAppStore();
  const [formData, setFormData] = useState<ClusterFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.name.trim() || !formData.kubeconfig.trim()) {
      setError('Name and kubeconfig are required');
      return;
    }

    const parsed = extractApiServerInfo(formData.kubeconfig);
    const apiServer = parsed ? `${parsed.host}:${parsed.port}` : '';

    setSaving(true);

    try {
      let clusterData: ClusterConfig;
      
      if (editingId) {
        const result = await clusterApi.update(editingId, {
          name: formData.name,
          kubeconfig: formData.kubeconfig,
          apiServer,
          apiServerHost: formData.apiServerHost || undefined,
          clusterIp: formData.clusterIp || undefined,
          namespace: formData.namespace,
          includeIps: formData.includeIps || undefined,
          autoHosts: formData.autoHosts,
        });
        
        if (result.success && result.data) {
          clusterData = result.data;
          updateCluster(editingId, clusterData);
        } else {
          setError(result.error || 'Failed to update cluster');
          setSaving(false);
          return;
        }
      } else {
        const result = await clusterApi.create({
          name: formData.name,
          kubeconfig: formData.kubeconfig,
          apiServer,
          apiServerHost: formData.apiServerHost || undefined,
          clusterIp: formData.clusterIp || undefined,
          namespace: formData.namespace,
          includeIps: formData.includeIps || undefined,
          autoHosts: formData.autoHosts,
        });
        
        if (result.success && result.data) {
          clusterData = result.data;
          addCluster(clusterData);
        } else {
          setError(result.error || 'Failed to create cluster');
          setSaving(false);
          return;
        }
      }

      setEditingId(null);
      setFormData(initialFormData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
    
    setSaving(false);
  };

  const handleEdit = (cluster: ClusterConfig) => {
    setFormData({
      name: cluster.name,
      kubeconfig: cluster.kubeconfig,
      namespace: cluster.namespace,
      includeIps: cluster.includeIps || '',
      autoHosts: cluster.autoHosts ?? true,
      apiServerHost: cluster.apiServerHost || 'lb.kubesphere.local',
      clusterIp: cluster.clusterIp || '',
    });
    setEditingId(cluster.id);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this cluster?')) {
      await clusterApi.delete(id);
      deleteCluster(id);
      if (editingId === id) {
        setEditingId(null);
        setFormData(initialFormData);
      }
    }
  };

  const handleCancel = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setError(null);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Cluster Management</h2>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-12 gap-4 h-full">
          <div className="col-span-7">
            <form onSubmit={handleSubmit}>
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="text-sm text-text-secondary mb-3">
                {editingId ? 'Edit Cluster' : 'Add New Cluster'}
              </div>

              {error && (
                <div className="mb-3 p-2 bg-accent-error/20 border border-accent-error rounded text-accent-error text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <label className="block text-sm text-text-secondary mb-1">Cluster Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="My K8s Cluster"
                    className="w-full px-2 py-1.5 text-base border border-border rounded focus:outline-none focus:border-accent-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm text-text-secondary mb-1">Namespace</label>
                  <input
                    type="text"
                    value={formData.namespace}
                    onChange={(e) => setFormData({ ...formData, namespace: e.target.value })}
                    placeholder="default"
                    className="w-full px-2 py-1.5 text-base border border-border rounded focus:outline-none focus:border-accent-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm text-text-secondary mb-1">Include IPs (CIDR)</label>
                  <input
                    type="text"
                    value={formData.includeIps}
                    onChange={(e) => setFormData({ ...formData, includeIps: e.target.value })}
                    placeholder="192.168.0.0/16"
                    className="w-full px-2 py-1.5 text-base border border-border rounded focus:outline-none focus:border-accent-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm text-text-secondary mb-1">API Server Host</label>
                  <input
                    type="text"
                    value={formData.apiServerHost}
                    onChange={(e) => setFormData({ ...formData, apiServerHost: e.target.value })}
                    placeholder="lb.kubesphere.local"
                    className="w-full px-2 py-1.5 text-base border border-border rounded focus:outline-none focus:border-accent-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm text-text-secondary mb-1">Cluster IP</label>
                  <input
                    type="text"
                    value={formData.clusterIp}
                    onChange={(e) => setFormData({ ...formData, clusterIp: e.target.value })}
                    placeholder="192.168.1.100"
                    className="w-full px-2 py-1.5 text-base border border-border rounded focus:outline-none focus:border-accent-primary"
                  />
                </div>

                <div className="col-span-2">
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.autoHosts}
                      onChange={(e) => setFormData({ ...formData, autoHosts: e.target.checked })}
                      className="rounded border-border bg-bg-tertiary"
                    />
                    Auto-modify hosts file
                  </label>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm text-text-secondary mb-1">Kubeconfig</label>
                  <textarea
                    value={formData.kubeconfig}
                    onChange={(e) => setFormData({ ...formData, kubeconfig: e.target.value })}
                    placeholder="apiVersion: v1&#10;clusters:&#10;  - name: cluster&#10;    cluster:&#10;      server: https://kubernetes:6443&#10;users:&#10;  - name: admin&#10;    user:&#10;      token: xxx"
                    rows={6}
                    className="w-full px-2 py-1.5 text-base border border-border rounded focus:outline-none focus:border-accent-primary font-mono"
                  />
                </div>

                <div className="col-span-2 flex gap-2 mt-1">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-3 py-1.5 text-sm bg-accent-primary text-white rounded hover:bg-accent-primary/80 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : editingId ? 'Update' : 'Add Cluster'}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-3 py-1.5 text-base border border-border rounded hover:bg-border transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
            </form>
          </div>

          <div className="col-span-5 space-y-2 overflow-auto">
            <div className="text-sm text-text-secondary mb-1">Clusters ({clusters.length})</div>
            {clusters.length === 0 ? (
              <div className="text-sm text-text-secondary text-center py-4">No clusters</div>
            ) : (
              clusters.map((cluster) => (
                <div
                  key={cluster.id}
                  className="bg-card rounded-lg border border-border p-2"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-accent-success rounded-full" />
                      <span className="text-sm font-medium truncate">{cluster.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(cluster)}
                        className="p-1 text-text-secondary hover:text-accent-primary transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-9.414a2 2 1.414-0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(cluster.id)}
                        className="p-1 text-text-secondary hover:text-accent-error transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="text-[10px] text-text-secondary truncate">
                    {cluster.apiServer || 'No API'} • {cluster.namespace}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
