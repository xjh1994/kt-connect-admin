import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../stores/appStore';
import type { Task, ConnectParams } from '../../types';
import { generateConnectCommand } from '../../utils/commands';
import { commandApi, taskApi } from '../../utils/api';
import { getSessionId } from '../../utils/session';

function useTaskLogs(taskIds: string[], isRunning: boolean) {
  const eventSourcesRef = useRef<Map<string, EventSource>>(new Map());
  
  useEffect(() => {
    if (!isRunning || taskIds.length === 0) {
      eventSourcesRef.current.forEach((es) => es.close());
      eventSourcesRef.current.clear();
      return;
    }
    
    taskIds.forEach((taskId) => {
      if (!eventSourcesRef.current.has(taskId)) {
        const eventSource = new EventSource(`/api/command/logs/${taskId}`);
        
        eventSource.onmessage = (event) => {
          try {
            const { log } = JSON.parse(event.data);
            const state = useAppStore.getState();
            const task = state.tasks.find((t) => t.id === taskId);
            if (task) {
              state.updateTask(taskId, {
                logs: [...task.logs, log],
              });
            }
          } catch (e) {
            console.error('Failed to parse log:', e);
          }
        };
        
        eventSource.onerror = () => {
          eventSource.close();
          eventSourcesRef.current.delete(taskId);
        };
        
        eventSourcesRef.current.set(taskId, eventSource);
      }
    });
  }, [taskIds.length, isRunning]);
}

export function ConnectPanel() {
  const { clusters, addTask, tasks, updateTask } = useAppStore();
  const [selectedClusterId, setSelectedClusterId] = useState<string>('');
  const [namespace, setNamespace] = useState<string>('default');
  const [includeIps, setIncludeIps] = useState<string>('');
  const [autoHosts, setAutoHosts] = useState<boolean>(true);
  const [cleanupOld, setCleanupOld] = useState<boolean>(true);
  const [debug, setDebug] = useState<boolean>(false);
  const [previewCmd, setPreviewCmd] = useState<string>('');

  const selectedCluster = clusters.find((c) => c.id === selectedClusterId);
  const runningTasks = tasks.filter((t) => t.type === 'connect' && t.status === 'running');
  const runningTaskIds = runningTasks.map((t) => t.id);
  
  useTaskLogs(runningTaskIds, runningTasks.length > 0);

  const handlePreview = () => {
    if (!selectedCluster) return;
    
    const cmd = generateConnectCommand(selectedCluster, {
      namespace,
      includeIps: includeIps || undefined,
      autoHosts,
      debug,
    });
    setPreviewCmd(cmd);
  };

  const handleConnect = async () => {
    if (!selectedCluster) return;
    
    const cmd = generateConnectCommand(selectedCluster, {
      namespace,
      includeIps: includeIps || undefined,
      autoHosts,
      debug,
    });
    
    const taskId = Math.random().toString(36).substring(2, 15);
    
    const task: Task = {
      id: taskId,
      type: 'connect',
      status: 'running',
      params: {
        clusterId: selectedClusterId,
        namespace,
        includeIps: includeIps || undefined,
        autoHosts,
        debug,
      },
      logs: [`Executing: ${cmd}`],
      startTime: new Date().toISOString(),
    };
    
    const sessionId = getSessionId();
    
    addTask(task);
    taskApi.create(task, sessionId);
    setPreviewCmd('');
    
    const hasRunning = tasks.some((t) => t.status === 'running');
    
    const result = await commandApi.execute({
      taskId,
      type: 'connect',
      command: cmd,
      autoHosts: autoHosts && !!selectedCluster.clusterIp,
      apiServerHost: selectedCluster.apiServerHost,
      clusterIp: selectedCluster.clusterIp,
      cleanupOld: cleanupOld && hasRunning,
      kubeconfig: selectedCluster.kubeconfig,
    });
    
    if (result.success && result.data) {
      if (result.data.hostsEntry) {
        updateTask(taskId, {
          logs: [...task.logs, `Resolved ${result.data.hostsEntry.hostname} → ${result.data.hostsEntry.ip}`, `Added to /etc/hosts`],
        });
      }
    } else {
      updateTask(taskId, {
        status: 'error',
        logs: [...task.logs, `Error: ${result.error}`],
      });
    }
  };

  const handleStop = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) {
      return;
    }
    
    const params = task?.params as ConnectParams | undefined;
    const cluster = params?.clusterId ? clusters.find((c) => c.id === params.clusterId) : null;
    
    const stopResult = await commandApi.stop(taskId);
    if (!stopResult.success) {
      updateTask(taskId, {
        status: 'error',
        logs: [...task.logs, `Failed to stop: ${stopResult.error}`],
      });
      return;
    }
    
    updateTask(taskId, {
      status: 'stopped',
      endTime: new Date().toISOString(),
    });
    
    if (cluster?.apiServerHost) {
      try {
        await fetch('/api/hosts/remove', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hostname: cluster.apiServerHost }),
        });
        const currentTask = useAppStore.getState().tasks.find((t) => t.id === taskId);
        if (currentTask) {
          updateTask(taskId, {
            logs: [...currentTask.logs, `Removed hosts entry for ${cluster.apiServerHost}`],
          });
        }
      } catch (e) {
        console.error('Failed to remove hosts:', e);
      }
    }
  };

  const connectTasks = tasks.filter((t) => t.type === 'connect').reverse();

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Connect to Cluster</h2>
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
                        setIncludeIps(cluster.includeIps || '');
                        setAutoHosts(cluster.autoHosts ?? true);
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
                  <label className="block text-sm text-text-secondary mb-1">Namespace</label>
                  <input
                    type="text"
                    value={namespace}
                    onChange={(e) => setNamespace(e.target.value)}
                    className="w-full px-2 py-1.5 text-base border border-border rounded focus:outline-none focus:border-accent-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Include IPs</label>
                  <input
                    type="text"
                    value={includeIps}
                    onChange={(e) => setIncludeIps(e.target.value)}
                    placeholder="CIDR"
                    className="w-full px-2 py-1.5 text-base border border-border rounded focus:outline-none focus:border-accent-primary"
                  />
                </div>
                
                <div className="col-span-2 flex gap-4 mt-1">
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoHosts}
                      onChange={(e) => setAutoHosts(e.target.checked)}
                      className="rounded border-border bg-bg-tertiary"
                    />
                    Auto hosts
                  </label>
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cleanupOld}
                      onChange={(e) => setCleanupOld(e.target.checked)}
                      className="rounded border-border bg-bg-tertiary"
                    />
                    Clean old
                  </label>
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
                    disabled={!selectedCluster}
                    className="px-3 py-1.5 text-base border border-border rounded hover:bg-border transition-colors disabled:opacity-50"
                  >
                    Preview
                  </button>
                  <button
                    onClick={handleConnect}
                    disabled={!selectedCluster || runningTasks.length > 0}
                    className="px-3 py-1.5 text-sm bg-accent-primary text-white rounded hover:bg-accent-primary/80 transition-colors disabled:opacity-50"
                  >
                    Connect
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
            <div className="text-sm text-text-secondary mb-1">Connections ({connectTasks.length})</div>
            {connectTasks.length === 0 ? (
              <div className="text-sm text-text-secondary text-center py-4">No connections</div>
            ) : (
              connectTasks.map((task) => (
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
                      <span className="text-sm">{(task.params as ConnectParams)?.namespace || 'default'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {task.status === 'running' && (
                        <button
                          onClick={() => handleStop(task.id)}
                          className="px-2 py-0.5 text-[10px] bg-accent-error/20 text-accent-error rounded"
                        >
                          Stop
                        </button>
                      )}
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
                  </div>
                  <div className="text-[10px] text-text-secondary font-mono h-16 overflow-y-auto whitespace-pre-wrap">
                    {task.logs.length > 0 ? task.logs[task.logs.length - 1] : 'Starting...'}
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
