import React from 'react';
import { 
  CheckCircle2, AlertTriangle, XCircle, Activity, Box 
} from 'lucide-react';

export const StatusPage: React.FC = () => {
  // --- Helper Components ---

  // Visual Uptime Bar (90 days)
  const UptimeBar = ({ status = 'operational' }: { status?: 'operational' | 'degraded' | 'outage' }) => {
    // Generate 90 days of history
    const bars = Array.from({ length: 60 }, (_, i) => {
      // Simulate some random degradation for 'degraded' status component
      if (status === 'degraded' && i > 55) return 'bg-yellow-400';
      if (status === 'degraded' && i === 42) return 'bg-yellow-400';
      // Simulate perfect uptime for others
      return 'bg-green-500';
    });

    return (
      <div className="flex items-end gap-[3px] h-8 w-full mt-2" role="img" aria-label="90-day uptime history">
        {bars.map((colorClass, idx) => (
          <div 
            key={idx} 
            className={`flex-1 rounded-sm transition-all hover:opacity-80 cursor-help ${colorClass}`}
            style={{ height: '100%' }} // Full height bars
            title={`Date: ${new Date(Date.now() - (59 - idx) * 86400000).toLocaleDateString()} - Status: ${colorClass.includes('green') ? 'Operational' : 'Degraded'}`}
          ></div>
        ))}
      </div>
    );
  };

  const ComponentStatus = ({ name, status, region }: { name: string, status: 'operational' | 'degraded' | 'outage', region?: string }) => {
    const statusConfig = {
      operational: { color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle2, text: 'Operational' },
      degraded: { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: AlertTriangle, text: 'Degraded Performance' },
      outage: { color: 'text-red-600', bg: 'bg-red-100', icon: XCircle, text: 'Major Outage' },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <div className="py-6 border-b border-slate-100 last:border-0">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              {name}
              {region && <span className="text-xs font-normal text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{region}</span>}
            </h4>
          </div>
          <div className={`flex items-center gap-2 text-sm font-medium ${config.color}`}>
            <Icon className="w-4 h-4" />
            {config.text}
          </div>
        </div>
        
        {/* Uptime Visualization */}
        <UptimeBar status={status} />
        
        <div className="flex justify-between mt-2 text-xs text-slate-400">
          <span>60 days ago</span>
          <span className="h-px flex-1 bg-slate-100 mx-4 relative top-2"></span>
          <span>Today</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        
        {/* 1. Global Status Banner */}
        <div className="bg-green-600 rounded-lg shadow-lg p-6 md:p-8 text-white mb-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-full">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">All Systems Operational</h1>
              <p className="text-green-100 opacity-90">No incidents reported today.</p>
            </div>
          </div>
          <div className="flex items-center gap-6 bg-green-700/50 px-6 py-3 rounded-lg border border-green-500/30">
            <div className="text-center">
              <span className="block text-xs font-medium text-green-200 uppercase tracking-wider">Avg Ping</span>
              <span className="block text-xl font-mono font-bold">42ms</span>
            </div>
            <div className="w-px h-8 bg-green-500/50"></div>
            <div className="text-center">
              <span className="block text-xs font-medium text-green-200 uppercase tracking-wider">Uptime</span>
              <span className="block text-xl font-mono font-bold">99.99%</span>
            </div>
          </div>
        </div>

        {/* 2. Component List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-12">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-slate-500" /> System Metrics
            </h2>
            <span className="text-xs text-slate-500">Updated few seconds ago</span>
          </div>
          
          <div className="p-6">
            {/* Group: Core Platform */}
            <div className="mb-8">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Core Platform</h3>
              <ComponentStatus name="API & Management Dashboard" status="operational" />
              <ComponentStatus name="Authentication Services" status="operational" />
            </div>

            {/* Group: Infrastructure */}
            <div className="mb-8">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Infrastructure</h3>
              <ComponentStatus name="US Region Nodes (Virginia)" status="operational" region="us-east-1" />
              <ComponentStatus name="EU Region Nodes (Frankfurt)" status="degraded" region="eu-central-1" />
              <ComponentStatus name="Asia Pacific Nodes (Tokyo)" status="operational" region="ap-northeast-1" />
            </div>

            {/* Group: Edge Network */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Edge Network</h3>
              <ComponentStatus name="Global CDN" status="operational" />
              <ComponentStatus name="DNS Resolution" status="operational" />
            </div>
          </div>
        </div>

        {/* 3. Incident History */}
        <div className="space-y-8">
          <h2 className="text-xl font-bold text-slate-900">Incident History</h2>
          
          <div className="relative border-l-2 border-slate-200 ml-3 space-y-12 pb-8">
            
            {/* Incident 1 */}
            <div className="relative pl-8">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-200 border-4 border-white shadow-sm"></div>
              <div className="mb-2">
                <span className="text-sm font-medium text-slate-500">October 24, 2023</span>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <h3 className="text-lg font-bold text-slate-900">Scheduled Maintenance: Database Upgrade</h3>
                </div>
                <p className="text-slate-600 mb-4">
                  We successfully upgraded the shared MySQL cluster to version 8.0.34. No downtime was observed during the failover process.
                </p>
                <div className="text-xs font-mono text-slate-400">
                  <span className="font-bold text-slate-600">Update</span> — Maintenance completed at 04:30 UTC.
                </div>
              </div>
            </div>

            {/* Incident 2 */}
            <div className="relative pl-8">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-200 border-4 border-white shadow-sm"></div>
              <div className="mb-2">
                <span className="text-sm font-medium text-slate-500">September 12, 2023</span>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-lg font-bold text-slate-900">Investigating: API Latency in EU-West</h3>
                </div>
                <p className="text-slate-600 mb-4">
                  We are observing higher than normal latency for API requests originating from the London region. Our engineering team is investigating the issue with our upstream provider.
                </p>
                <div className="space-y-2 text-xs font-mono text-slate-400">
                  <div><span className="font-bold text-slate-600">Resolved</span> — Traffic was rerouted to Frankfurt. Latency returned to normal levels at 14:15 UTC.</div>
                  <div><span className="font-bold text-slate-600">Update</span> — We have identified a fiber cut affecting one of our transit providers.</div>
                </div>
              </div>
            </div>

            {/* Incident 3 */}
            <div className="relative pl-8">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-200 border-4 border-white shadow-sm"></div>
              <div className="mb-2">
                <span className="text-sm font-medium text-slate-500">August 05, 2023</span>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <h3 className="text-lg font-bold text-slate-900">No incidents reported</h3>
                </div>
                <p className="text-slate-600">
                  All systems were operational.
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};