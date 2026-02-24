import { useAppStore } from '../../stores/appStore';

export function HistoryPanel() {
  const { tasks, clusters } = useAppStore();
  
  const sortedTasks = [...tasks].sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );

  const getClusterName = (clusterId: string) => {
    const cluster = clusters.find((c) => c.id === clusterId);
    return cluster?.name || 'Unknown';
  };

  const formatDuration = (start: string, end?: string) => {
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const duration = Math.floor((endTime - startTime) / 1000);
    
    if (duration < 60) return `${duration}s`;
    if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`;
    return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Task History</h2>
      
      {tasks.length === 0 ? (
        <div className="text-center py-12 text-text-secondary bg-bg-secondary rounded-lg border border-border">
          <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>No tasks executed yet</p>
          <p className="text-sm mt-2">Run a Connect or Exchange to see history</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedTasks.map((task) => {
            const params = task.params as any;
            const isConnect = task.type === 'connect';
            
            return (
              <div
                key={task.id}
                className="bg-bg-secondary rounded-lg p-4 border border-border"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        isConnect
                          ? 'bg-accent-primary/20 text-accent-primary'
                          : 'bg-accent-warning/20 text-accent-warning'
                      }`}
                    >
                      {isConnect ? 'CONNECT' : 'EXCHANGE'}
                    </span>
                    <span className="font-medium">
                      {isConnect ? params.namespace : params.serviceName}
                    </span>
                    <span className="text-text-secondary text-sm">
                      on {getClusterName(params.clusterId)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        task.status === 'running'
                          ? 'bg-accent-success/20 text-accent-success'
                          : task.status === 'success'
                          ? 'bg-text-secondary/20 text-text-secondary'
                          : task.status === 'error'
                          ? 'bg-accent-error/20 text-accent-error'
                          : 'bg-text-secondary/20 text-text-secondary'
                      }`}
                    >
                      {task.status}
                    </span>
                    <span className="text-xs text-text-secondary">
                      {formatDuration(task.startTime, task.endTime)}
                    </span>
                  </div>
                </div>
                
                <div className="text-xs text-text-secondary">
                  Started: {new Date(task.startTime).toLocaleString()}
                </div>
                
                {task.logs.length > 0 && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-text-secondary hover:text-text-primary">
                      View Logs ({task.logs.length} lines)
                    </summary>
                    <pre className="mt-2 p-3 bg-bg-tertiary rounded text-xs font-mono max-h-48 overflow-y-auto">
                      {task.logs.join('\n')}
                    </pre>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
