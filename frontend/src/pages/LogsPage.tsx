import { useState, useEffect, useRef } from 'react';
import { Trash2, Filter, Download, Pause, Play } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function LogsPage() {
  const logs = useStore((state) => state.logs);
  const clearLogs = useStore((state) => state.clearLogs);

  const [filter, setFilter] = useState<'all' | 'success' | 'error' | 'info'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true;
    return log.level === filter;
  });

  const downloadLogs = () => {
    const logsText = logs
      .map((log) => `[${log.timestamp}] [${log.protocol}] [${log.level.toUpperCase()}] ${log.message}`)
      .join('\n');
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iot-simulator-logs-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-error-700 bg-error-50 border-error-200';
      case 'success': return 'text-success-700 bg-success-50 border-success-200';
      case 'info': return 'text-primary-700 bg-primary-50 border-primary-200';
      default: return 'text-neutral-700 bg-neutral-50 border-neutral-200';
    }
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Logs</h1>
            <p className="text-neutral-600">Real-time system activity monitoring</p>
          </div>
          <div className="flex gap-3">
            <button
              className="btn-secondary"
              onClick={() => setAutoScroll(!autoScroll)}
              title={autoScroll ? 'Pause auto-scroll' : 'Resume auto-scroll'}
            >
              {autoScroll ? <Pause className="w-4 h-4 mr-2 inline" /> : <Play className="w-4 h-4 mr-2 inline" />}
              {autoScroll ? 'Pause' : 'Resume'}
            </button>
            <button className="btn-secondary" onClick={downloadLogs} disabled={logs.length === 0}>
              <Download className="w-4 h-4 mr-2 inline" />
              Export
            </button>
            <button className="btn-danger" onClick={clearLogs} disabled={logs.length === 0}>
              <Trash2 className="w-4 h-4 mr-2 inline" />
              Clear
            </button>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          <button
            className={`btn text-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('all')}
          >
            All ({logs.length})
          </button>
          <button
            className={`btn text-sm ${filter === 'success' ? 'btn-success' : 'btn-secondary'}`}
            onClick={() => setFilter('success')}
          >
            Success ({logs.filter(l => l.level === 'success').length})
          </button>
          <button
            className={`btn text-sm ${filter === 'error' ? 'btn-danger' : 'btn-secondary'}`}
            onClick={() => setFilter('error')}
          >
            Errors ({logs.filter(l => l.level === 'error').length})
          </button>
          <button
            className={`btn text-sm ${filter === 'info' ? 'bg-primary-600 text-white' : 'btn-secondary'}`}
            onClick={() => setFilter('info')}
          >
            Info ({logs.filter(l => l.level === 'info').length})
          </button>
        </div>
      </div>

      <div className="card">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <Filter className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
            <p className="text-neutral-600">
              {logs.length === 0 ? 'No logs yet. Start a simulation to see activity.' : 'No logs match the current filter.'}
            </p>
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto">
            <div className="space-y-2">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 rounded-lg border transition-all hover:shadow-sm ${getLevelColor(log.level)}`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-white bg-opacity-50 rounded">
                          {log.protocol}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium break-words">{log.message}</p>
                      {log.data && (
                        <details className="mt-2">
                          <summary className="text-xs cursor-pointer text-neutral-600 hover:text-neutral-900">
                            View payload
                          </summary>
                          <pre className="text-xs mt-2 p-2 bg-white bg-opacity-50 rounded overflow-x-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}
      </div>

      {logs.length > 0 && (
        <div className="mt-4 text-center text-sm text-neutral-500">
          Showing {filteredLogs.length} of {logs.length} logs • Auto-scroll: {autoScroll ? 'ON' : 'OFF'}
        </div>
      )}
    </div>
  );
}
