import { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import type { Task, ExchangeParams } from '../../types';
import { generateExchangeCommand } from '../../utils/commands';

export function ExchangePanel() {
  const { clusters, addTask, tasks } = useAppStore();
  const [selectedClusterId, setSelectedClusterId] = useState<string>('');
  const [namespace, setNamespace] = useState<string>('default');
  const [serviceName, setServiceName] = useState<string>('');
  const [localPort, setLocalPort] = useState<number>(8080);
  const [remotePort, setRemotePort] = useState<number>(8080);
  const [debug, setDebug] = useState<boolean>(false);
  const [previewCmd, setPreviewCmd] = useState<string>('');

  const selectedCluster = clusters.find((c) => c.id === selectedClusterId);

  const handlePreview = () => {
    if (!selectedCluster || !serviceName) return;
    
    const cmd = generateExchangeCommand(selectedCluster, {
      namespace,
      serviceName,
      localPort,
      remotePort,
      debug,
    });
    setPreviewCmd(cmd);
  };

  const handleExchange = () => {
    if (!selectedCluster || !serviceName) return;
    
    const task: Task = {
      id: '',
      type: 'exchange',
      status: 'pending',
      params: {
        clusterId: selectedClusterId,
        namespace,
        serviceName,
        localPort,
        remotePort,
        debug,
      },
      logs: [],
      startTime: new Date().toISOString(),
    };
    
    addTask(task);
    setPreviewCmd('');
  };

  const exchangeTasks = tasks.filter((t) => t.type === 'exchange').reverse();

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Exchange Service</h2>
      </div>
      
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-12 gap-4 h-full">
          <div className="col-span-7 space-y-4">
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm text-text-secondary mb-1">Cluster</label>
                  <select
                    value={selectedClusterId}
                    onChange={(e) => {
                      setSelectedClusterId(e.target.value);
                      const cluster = clusters.find((c) => c.id === e.target.value);
                      if (cluster) {
                        setNamespace(cluster.namespace);
                      }
                    }}
                    className="w-full px-2 py-1.5 text-base border border-border rounded focus:outline-none focus:border-accent-primary"
                  >
                    <option value="">Select cluster...</option>
                    {clusters.map((cluster) => (
                      <option key={cluster.id} value={cluster.id}>
                        {cluster.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Service</label>
                  <input
                    type="text"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    placeholder="service-name"
                    className="w-full px-2 py-1.5 text-base border border-border rounded focus:outline-none focus:border-accent-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Namespace</label>
                  <input
                    type="text"
                    value={namespace}
                    onChange={(e) => setNamespace(e.target.value)}
                    className="w-full px-2 py-1.5 text-base border border-border rounded focus:outline-none focus:border-accent-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Local Port</label>
                  <input
                    type="number"
                    value={localPort}
                    onChange={(e) => setLocalPort(parseInt(e.target.value) || 8080)}
                    className="w-full px-2 py-1.5 text-base border border-border rounded focus:outline-none focus:border-accent-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Remote Port</label>
                  <input
                    type="number"
                    value={remotePort}
                    onChange={(e) => setRemotePort(parseInt(e.target.value) || 8080)}
                    className="w-full px-2 py-1.5 text-base border border-border rounded focus:outline-none focus:border-accent-primary"
                  />
                </div>
                
                <div className="col-span-2 flex gap-4 mt-1">
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={debug}
                      onChange={(e) => setDebug(e.target.checked)}
                      className="rounded border-border bg-bg-tertiary"
                    />
                    Debug
                  </label>
                </div>
                
                <div className="col-span-2 flex gap-2 mt-2">
                  <button
                    onClick={handlePreview}
                    disabled={!selectedCluster || !serviceName}
                    className="px-3 py-1.5 text-base border border-border rounded hover:bg-border transition-colors disabled:opacity-50"
                  >
                    Preview
                  </button>
                  <button
                    onClick={handleExchange}
                    disabled={!selectedCluster || !serviceName}
                    className="px-3 py-1.5 text-sm bg-accent-primary text-white rounded hover:bg-accent-primary/80 transition-colors disabled:opacity-50"
                  >
                    Exchange
                  </button>
                </div>
              </div>
            </div>
            
            {previewCmd && (
              <div className="bg-card rounded-lg border border-border p-3">
                <div className="text-sm text-text-secondary mb-1">Command:</div>
                <pre className="text-sm text-accent-primary font-mono whitespace-pre-wrap">{previewCmd}</pre>
              </div>
            )}
          </div>
          
          <div className="col-span-5 space-y-2 overflow-auto">
            <div className="text-sm text-text-secondary mb-1">Exchanges ({exchangeTasks.length})</div>
            {exchangeTasks.length === 0 ? (
              <div className="text-sm text-text-secondary text-center py-4">No exchanges</div>
            ) : (
              exchangeTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-card rounded-lg border border-border p-2"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          task.status === 'running'
                            ? 'bg-accent-success animate-pulse'
                            : task.status === 'success'
                            ? 'bg-accent-primary'
                            : task.status === 'error'
                            ? 'bg-accent-error'
                            : 'bg-text-secondary'
                        }`}
                      />
                      <span className="text-sm">{(task.params as ExchangeParams)?.serviceName}</span>
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        task.status === 'running'
                          ? 'bg-accent-success/20 text-accent-success'
                          : task.status === 'success'
                          ? 'bg-accent-primary/20 text-accent-primary'
                          : task.status === 'error'
                          ? 'bg-accent-error/20 text-accent-error'
                          : 'bg-text-secondary/20 text-text-secondary'
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-text-secondary">
                    {(task.params as ExchangeParams)?.localPort}:{(task.params as ExchangeParams)?.remotePort}
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
