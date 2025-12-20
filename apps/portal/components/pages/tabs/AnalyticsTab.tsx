import React from 'react';
import { 
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import { ArrowUp, ArrowDown, Activity, Globe, Zap, Database } from 'lucide-react';

const TRAFFIC_DATA = [
  { time: '00:00', req: 400 }, { time: '04:00', req: 300 },
  { time: '08:00', req: 1200 }, { time: '12:00', req: 2800 },
  { time: '16:00', req: 3400 }, { time: '20:00', req: 1900 },
  { time: '23:59', req: 800 },
];

const RESOURCE_DATA = Array.from({ length: 24 }, (_, i) => ({
  time: `${i}:00`,
  cpu: Math.floor(Math.random() * 40) + 20,
  ram: Math.floor(Math.random() * 30) + 40,
}));

const KPICard = ({ label, value, change, icon: Icon, color }: any) => (
  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
      <h4 className="text-2xl font-bold text-slate-900">{value}</h4>
      <div className={`flex items-center text-xs font-bold mt-2 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {change >= 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
        {Math.abs(change)}% vs last 24h
      </div>
    </div>
    <div className={`p-3 rounded-lg ${color}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
  </div>
);

export const AnalyticsTab: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Row 1: Traffic Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Requests per Minute</h3>
              <p className="text-sm text-slate-500">HTTP Traffic over last 24 hours</p>
            </div>
            <select className="text-sm border-slate-200 rounded-lg p-2 bg-slate-50">
              <option>Last 24 Hours</option>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={TRAFFIC_DATA}>
                <defs>
                  <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="req" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorReq)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* KPIs */}
        <div className="space-y-6">
          <KPICard label="Unique Visitors" value="12.5k" change={12} icon={Globe} color="bg-indigo-500" />
          <KPICard label="Bandwidth Used" value="45.2 GB" change={-5} icon={Activity} color="bg-pink-500" />
          <KPICard label="Cache Hit Rate" value="94.2%" change={2} icon={Zap} color="bg-emerald-500" />
        </div>
      </div>

      {/* Row 2: System Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CPU */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" /> CPU Usage History
          </h4>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={RESOURCE_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" hide />
                <YAxis domain={[0, 100]} hide />
                <Tooltip />
                <Line type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-2">
            <span className="text-2xl font-bold text-slate-900">42%</span>
            <span className="text-xs text-slate-500 ml-2">Avg Load</span>
          </div>
        </div>

        {/* RAM */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-500" /> RAM Usage History
          </h4>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={RESOURCE_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" hide />
                <YAxis domain={[0, 100]} hide />
                <Tooltip />
                <Line type="monotone" dataKey="ram" stroke="#a855f7" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-2">
            <span className="text-2xl font-bold text-slate-900">2.1 GB</span>
            <span className="text-xs text-slate-500 ml-2">/ 4 GB Used</span>
          </div>
        </div>

        {/* Storage */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
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
                  37%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-4 mb-4 text-xs flex rounded bg-indigo-100">
              <div style={{ width: "37%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600 transition-all duration-1000"></div>
            </div>
            <div className="flex justify-between text-sm text-slate-600 font-medium">
              <span>15 GB Used</span>
              <span>40 GB Total</span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 text-xs text-slate-500">
            <p><strong>Note:</strong> Backups are stored in separate S3 buckets and do not count towards your instance storage limit.</p>
          </div>
        </div>

      </div>
    </div>
  );
};