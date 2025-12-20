import React, { useEffect, useRef, useState } from 'react';
import { X, Terminal, Copy, Pause, Play, Trash2, Check } from 'lucide-react';

interface LogViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  instanceName: string;
}

const MOCK_LOGS = [
  "[System] Initializing container orchestration layer...",
  "[System] Volume 'vol-492' mounted at /var/www/html (Read-Write)",
  "[Network] Attaching to overlay network 'wp-net-private'...",
  "[Network] IP Assigned: 10.0.4.12",
  "[Kernel] cgroup limits applied: CPU=2.0, RAM=4GB",
  "[App] Starting PHP-FPM 8.2 service...",
  "[App] PHP-FPM: ready to handle connections",
  "[Nginx] Configuration loaded from /etc/nginx/nginx.conf",
  "[Nginx] Started worker processes (PID: 14)",
  "[Health] Healthcheck passed: TCP :9000",
  "[WP] Connection to database 'db-cluster-01' successful",
  "[WP] Redis Object Cache: Connected",
  "[Access] 172.18.0.1 - - \"GET / HTTP/1.1\" 200 4521 \"-\" \"Mozilla/5.0\"",
  "[Access] 172.18.0.1 - - \"POST /wp-cron.php HTTP/1.1\" 200 0 \"-\" \"WordPress/6.4\"",
  "[Notice] Undefined index: HTTP_USER_AGENT in /var/www/html/wp-content/plugins/custom/index.php on line 12",
  "[System] Rotating logs...",
  "[Metrics] Memory usage: 45MB / 4096MB",
];

export const LogViewerModal: React.FC<LogViewerModalProps> = ({ isOpen, onClose, instanceName }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);

  // Reset logs when opening
  useEffect(() => {
    if (isOpen) {
      setLogs(MOCK_LOGS.slice(0, 5));
      setIsPaused(false);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [isOpen]);

  // Simulate Streaming
  useEffect(() => {
    if (!isOpen || isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = window.setInterval(() => {
      const randomLog = MOCK_LOGS[Math.floor(Math.random() * MOCK_LOGS.length)];
      const timestamp = new Date().toISOString().split('T')[1].slice(0, 12);
      const newLine = `${timestamp} ${randomLog}`;
      
      setLogs(prev => {
        const updated = [...prev, newLine];
        return updated.slice(-100); // Keep last 100 lines
      });
    }, 800);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isOpen, isPaused]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current && !isPaused) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isPaused]);

  const handleCopy = () => {
    navigator.clipboard.writeText(logs.join('\n'));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleClear = () => {
    setLogs([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl bg-slate-900 rounded-xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col h-[600px] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Terminal className="w-5 h-5 text-green-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Live Logs: {instanceName}</h3>
              <p className="text-xs text-slate-400 font-mono">/var/log/container/std.out</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsPaused(!isPaused)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
              title={isPaused ? "Resume" : "Pause"}
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
            <button 
              onClick={handleCopy}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
              title="Copy to Clipboard"
            >
              {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
            <button 
              onClick={handleClear}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors"
              title="Clear Console"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-slate-700 mx-1"></div>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Terminal Window */}
        <div 
          ref={scrollRef}
          className="flex-1 p-4 overflow-y-auto font-mono text-xs md:text-sm space-y-1 bg-black/50 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
        >
          {logs.map((log, i) => (
            <div key={i} className="flex gap-3 hover:bg-white/5 p-0.5 rounded group">
              <span className="text-slate-600 select-none flex-shrink-0 group-hover:text-slate-500">{i + 1}</span>
              <span className={
                log.includes('[Error]') ? 'text-red-400' : 
                log.includes('[Warn]') ? 'text-yellow-400' : 
                log.includes('[System]') ? 'text-blue-400' : 
                log.includes('[Metrics]') ? 'text-purple-400' :
                'text-slate-300'
              }>
                {log}
              </span>
            </div>
          ))}
          {logs.length === 0 && <div className="text-slate-500 italic">No logs to display...</div>}
        </div>

        {/* Footer Status */}
        <div className="px-4 py-2 bg-slate-800 border-t border-slate-700 flex justify-between items-center text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`}></span>
            <span className="text-slate-400">{isPaused ? 'Paused' : 'Streaming Live'}</span>
          </div>
          <span className="text-slate-500">Auto-refresh: 1s</span>
        </div>
      </div>
    </div>
  );
};