import { useAppStore } from '../../stores/appStore';

export function Header() {
  const tasks = useAppStore((state) => state.tasks);
  const runningTasks = tasks.filter((t) => t.status === 'running');
  
  return (
    <header className="h-16 bg-bg-secondary border-b border-border flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-accent-primary rounded-lg flex items-center justify-center">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <h1 className="text-lg font-semibold text-text-primary">kt-connect Admin</h1>
      </div>
      
      <div className="flex items-center gap-4">
        {runningTasks.length > 0 && (
          <div className="flex items-center gap-2 text-accent-success">
            <span className="w-2 h-2 bg-accent-success rounded-full animate-pulse" />
            <span className="text-sm">{runningTasks.length} Active</span>
          </div>
        )}
        <div className="text-text-secondary text-sm">
          {tasks.length} Total Tasks
        </div>
      </div>
    </header>
  );
}
