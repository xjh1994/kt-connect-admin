import { useState, useEffect } from 'react';
import { hostsApi } from '../../utils/api';

interface HostsEntry {
  ip: string;
  hostname: string;
}

export function HostsPanel() {
  const [entries, setEntries] = useState<HostsEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newIp, setNewIp] = useState('');
  const [newHostname, setNewHostname] = useState('');

  const loadHosts = async () => {
    setLoading(true);
    setError(null);
    const result = await hostsApi.read();
    if (result.success && result.data) {
      const lines = result.data.split('\n');
      const parsed: HostsEntry[] = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && !trimmed.includes('kt-connect-admin')) {
          const parts = trimmed.split(/\s+/);
          if (parts.length >= 2) {
            parsed.push({ ip: parts[0], hostname: parts[1] });
          }
        }
      }
      setEntries(parsed);
    } else {
      setError(result.error || 'Failed to read hosts');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadHosts();
  }, []);

  const handleAdd = async () => {
    if (!newIp || !newHostname) return;
    setLoading(true);
    const result = await hostsApi.addEntry(newIp, newHostname);
    if (result.success) {
      setNewIp('');
      setNewHostname('');
      loadHosts();
    } else {
      setError(result.error || 'Failed to add entry');
    }
    setLoading(false);
  };

  const handleRemove = async (hostname: string) => {
    setLoading(true);
    const result = await hostsApi.removeEntry(hostname);
    if (result.success) {
      loadHosts();
    } else {
      setError(result.error || 'Failed to remove entry');
    }
    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Hosts Management</h2>
        <button
          onClick={loadHosts}
          disabled={loading}
          className="px-2 py-1 text-base border border-border rounded hover:bg-border transition-colors disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-12 gap-4 h-full">
          <div className="col-span-7">
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="text-sm text-text-secondary mb-3">Add Hosts Entry</div>

              {error && (
                <div className="mb-3 p-2 bg-accent-error/20 border border-accent-error rounded text-accent-error text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm text-text-secondary mb-1">IP Address</label>
                  <input
                    type="text"
                    value={newIp}
                    onChange={(e) => setNewIp(e.target.value)}
                    placeholder="192.168.1.100"
                    className="w-full px-2 py-1.5 text-base border border-border rounded focus:outline-none focus:border-accent-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Hostname</label>
                  <input
                    type="text"
                    value={newHostname}
                    onChange={(e) => setNewHostname(e.target.value)}
                    placeholder="kubernetes.example.com"
                    className="w-full px-2 py-1.5 text-base border border-border rounded focus:outline-none focus:border-accent-primary"
                  />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <button
                    onClick={handleAdd}
                    disabled={!newIp || !newHostname || loading}
                    className="px-3 py-1.5 text-sm bg-accent-primary text-white rounded hover:bg-accent-primary/80 transition-colors disabled:opacity-50"
                  >
                    Add Entry
                  </button>
                  <span className="text-[10px] text-text-secondary">
                    Requires admin/root privileges
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-5 space-y-2 overflow-auto">
            <div className="text-sm text-text-secondary mb-1">Entries ({entries.length})</div>
            {loading ? (
              <div className="text-sm text-text-secondary text-center py-4">Loading...</div>
            ) : entries.length === 0 ? (
              <div className="text-sm text-text-secondary text-center py-4">No custom entries</div>
            ) : (
              entries.map((entry, idx) => (
                <div
                  key={idx}
                  className="bg-card rounded-lg border border-border p-2 flex items-center justify-between"
                >
                  <div className="font-mono text-sm truncate">
                    <span className="text-accent-primary">{entry.ip}</span>
                    <span className="text-text-secondary mx-1">→</span>
                    <span className="text-text-primary">{entry.hostname}</span>
                  </div>
                  <button
                    onClick={() => handleRemove(entry.hostname)}
                    className="p-1 text-text-secondary hover:text-accent-error transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
