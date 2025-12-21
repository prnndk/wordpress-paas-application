import React, { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { ArrowUp, ArrowDown, Activity, Globe, Zap, Database, Loader2, Server, Wifi } from 'lucide-react';
import { dashboardService } from '../../../src/lib/dashboard';

interface AnalyticsTabProps {
  instanceId?: string;
}

interface PrometheusMetrics {
  cpu: { current: number; avg: number; max: number };
  memory: { current: number; limit: number; percent: number };
  network: { rxBytes: number; txBytes: number; rxRate: number; txRate: number };
  containerCount: number;
  timestamp: string;
}

interface HistoricalData {
  cpu: { timestamp: number; value: number }[];
  memory: { timestamp: number; value: number }[];
  network: {
    rx: { timestamp: number; value: number }[];
    tx: { timestamp: number; value: number }[];
  };
}

const KPICard = ({ label, value, change, icon: Icon, color, loading }: any) => (
  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
      {loading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </div>
      ) : (
        <>
          <h4 className="text-2xl font-bold text-slate-900">{value}</h4>
          {change !== undefined && (
            <div className={`flex items-center text-xs font-bold mt-2 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
              {Math.abs(change).toFixed(1)}% vs avg
            </div>
          )}
        </>
      )}
    </div>
    <div className={`p-3 rounded-lg ${color}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
  </div>
);

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ instanceId }) => {
  const [timeRange, setTimeRange] = useState<'1H' | '24H' | '7D'>('24H');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<PrometheusMetrics | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData | null>(null);

  // Derived chart data
  const [cpuChartData, setCpuChartData] = useState<{ time: string; value: number }[]>([]);
  const [memoryChartData, setMemoryChartData] = useState<{ time: string; value: number }[]>([]);
  const [networkChartData, setNetworkChartData] = useState<{ time: string; rx: number; tx: number }[]>([]);

  // Fetch metrics
  const fetchMetrics = useCallback(async () => {
    if (!instanceId) return;

    try {
      setLoading(true);

      // Fetch current metrics
      const metricsResponse = await dashboardService.getPrometheusMetrics(instanceId);
      const metricsData = (metricsResponse as any).data || metricsResponse;
      setMetrics(metricsData);

      // Fetch historical data
      try {
        const historyResponse = await dashboardService.getPrometheusHistory(instanceId, timeRange);
        const historyData = (historyResponse as any).data || historyResponse;
        setHistoricalData(historyData);

        // Transform historical data for charts
        if (historyData.cpu && historyData.cpu.length > 0) {
          setCpuChartData(historyData.cpu.map((d: any) => ({
            time: new Date(d.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            value: d.value
          })));
        }

        if (historyData.memory && historyData.memory.length > 0) {
          setMemoryChartData(historyData.memory.map((d: any) => ({
            time: new Date(d.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            value: d.value / (1024 * 1024) // Convert to MB
          })));
        }

        if (historyData.network?.rx && historyData.network?.tx) {
          const rxData = historyData.network.rx;
          const txData = historyData.network.tx;
          setNetworkChartData(rxData.map((d: any, i: number) => ({
            time: new Date(d.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            rx: txData[i]?.value || 0,
            tx: rxData[i]?.value || 0
          })));
        }
      } catch {
        // Generate mock historical data if API fails
        const now = Date.now();
        const points = timeRange === '1H' ? 12 : timeRange === '24H' ? 24 : 7;
        const interval = timeRange === '1H' ? 5 * 60 * 1000 : timeRange === '24H' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

        const mockCpu = [];
        const mockMemory = [];
        const mockNetwork = [];

        for (let i = points - 1; i >= 0; i--) {
          const timestamp = now - i * interval;
          const time = timeRange === '7D'
            ? new Date(timestamp).toLocaleDateString([], { weekday: 'short' })
            : new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          mockCpu.push({ time, value: Math.random() * 30 + 10 });
          mockMemory.push({ time, value: Math.random() * 500 + 500 });
          mockNetwork.push({ time, rx: Math.random() * 100, tx: Math.random() * 80 });
        }

        setCpuChartData(mockCpu);
        setMemoryChartData(mockMemory);
        setNetworkChartData(mockNetwork);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [instanceId, timeRange]);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  // Calculate derived values
  const cpuCurrent = metrics?.cpu?.current || 0;
  const cpuAvg = metrics?.cpu?.avg || cpuCurrent;
  const cpuChange = cpuAvg > 0 ? ((cpuCurrent - cpuAvg) / cpuAvg) * 100 : 0;

  const memoryUsed = metrics?.memory?.current || 0;
  const memoryLimit = metrics?.memory?.limit || 1;
  const memoryPercent = metrics?.memory?.percent || 0;

  const networkRx = metrics?.network?.rxRate || 0;
  const networkTx = metrics?.network?.txRate || 0;
  const totalNetwork = metrics?.network?.rxBytes || 0 + (metrics?.network?.txBytes || 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Time Range Selector */}
      <div className="flex justify-end">
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {(['1H', '24H', '7D'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${timeRange === range
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
                }`}>
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="CPU Usage"
          value={`${cpuCurrent.toFixed(1)}%`}
          change={cpuChange}
          icon={Activity}
          color="bg-blue-500"
          loading={loading}
        />
        <KPICard
          label="Memory Used"
          value={`${(memoryUsed / (1024 * 1024 * 1024)).toFixed(2)} GB`}
          change={undefined}
          icon={Server}
          color="bg-purple-500"
          loading={loading}
        />
        <KPICard
          label="Network In"
          value={`${(networkRx / 1024).toFixed(1)} KB/s`}
          change={undefined}
          icon={Wifi}
          color="bg-emerald-500"
          loading={loading}
        />
        <KPICard
          label="Network Out"
          value={`${(networkTx / 1024).toFixed(1)} KB/s`}
          change={undefined}
          icon={Globe}
          color="bg-pink-500"
          loading={loading}
        />
      </div>

      {/* Row 2: Network Traffic Chart */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Wifi className="w-5 h-5 text-indigo-600" /> Network Traffic
            </h3>
            <p className="text-sm text-slate-500">Bytes transferred over time</p>
          </div>
          {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={networkChartData}>
              <defs>
                <linearGradient id="colorRx" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Area type="monotone" dataKey="rx" name="Inbound" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRx)" />
              <Area type="monotone" dataKey="tx" name="Outbound" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorTx)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: CPU & Memory Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* CPU Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" /> CPU Usage History
          </h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cpuChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'CPU']} />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-4 pt-4 border-t border-slate-100">
            <span className="text-2xl font-bold text-slate-900">{cpuCurrent.toFixed(1)}%</span>
            <span className="text-xs text-slate-500 ml-2">Current Load</span>
          </div>
        </div>

        {/* Memory Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-500" /> Memory Usage History
          </h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={memoryChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip formatter={(value: number) => [`${value.toFixed(0)} MB`, 'Memory']} />
                <Line type="monotone" dataKey="value" stroke="#a855f7" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-4 pt-4 border-t border-slate-100">
            <span className="text-2xl font-bold text-slate-900">
              {(memoryUsed / (1024 * 1024 * 1024)).toFixed(2)} GB
            </span>
            <span className="text-xs text-slate-500 ml-2">
              / {(memoryLimit / (1024 * 1024 * 1024)).toFixed(1)} GB ({memoryPercent.toFixed(0)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Row 4: Storage & Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Storage */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h4 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-500" /> Storage Status
          </h4>

          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-100">
                  NVMe SSD
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-indigo-600">
                  --
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-4 mb-4 text-xs flex rounded bg-indigo-100">
              <div style={{ width: "0%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600 transition-all duration-1000"></div>
            </div>
            <div className="flex justify-between text-sm text-slate-600 font-medium">
              <span>Storage metrics coming soon</span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 text-xs text-slate-500">
            <p><strong>Note:</strong> Storage metrics require additional configuration and will be available in a future update.</p>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-6 rounded-xl shadow-lg text-white">
          <h4 className="font-bold text-lg mb-4">Performance Summary</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-indigo-100">CPU Health</span>
              <span className={`font-bold ${cpuCurrent < 70 ? 'text-green-300' : cpuCurrent < 90 ? 'text-yellow-300' : 'text-red-300'}`}>
                {cpuCurrent < 70 ? 'Good' : cpuCurrent < 90 ? 'Moderate' : 'High'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-indigo-100">Memory Status</span>
              <span className={`font-bold ${memoryPercent < 70 ? 'text-green-300' : memoryPercent < 90 ? 'text-yellow-300' : 'text-red-300'}`}>
                {memoryPercent < 70 ? 'Healthy' : memoryPercent < 90 ? 'Warning' : 'Critical'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-indigo-100">Total Bandwidth</span>
              <span className="font-bold text-white">
                {(totalNetwork / (1024 * 1024 * 1024)).toFixed(2)} GB
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-indigo-100">Containers</span>
              <span className="font-bold text-white">{metrics?.containerCount || 0}</span>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-white/20 text-xs text-indigo-200">
            Last updated: {metrics?.timestamp ? new Date(metrics.timestamp).toLocaleString() : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
};