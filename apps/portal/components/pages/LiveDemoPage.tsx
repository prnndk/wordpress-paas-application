import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LayoutDashboard, Server, CreditCard, Settings, FileText, 
  LogOut, Bell, Search, Box, User, ChevronRight, 
  Cpu, Activity, Globe, MoreHorizontal, Terminal, 
  Play, Square, RotateCw, Trash2, ExternalLink, X, 
  AlertTriangle, Lock, ArrowRight
} from 'lucide-react';
import { DemoToast } from '../demo/DemoToast';
import { StatusBadge } from '../StatusBadge';

// --- MOCK DATA ---
const MOCK_INSTANCES = [
  {
    id: '1024',
    name: 'Production E-Com',
    subdomain: 'shop-brand',
    region: 'US-East-1',
    ip: '192.168.44.12',
    status: 'running',
    specs: { cpu: '4 vCPU', ram: '8GB' },
  },
  {
    id: '1025',
    name: 'Staging Blog',
    subdomain: 'blog-stage',
    region: 'US-West-2',
    ip: '10.0.0.15',
    status: 'stopped',
    specs: { cpu: '1 vCPU', ram: '2GB' },
  },
  {
    id: '1026',
    name: 'Dev Environment',
    subdomain: 'dev-sandbox-x',
    region: 'EU-Central',
    ip: '172.16.5.99',
    status: 'provisioning',
    specs: { cpu: '2 vCPU', ram: '4GB' },
  },
];

const FAKE_LOGS = [
  "[System] Initializing Docker swarm worker...",
  "[System] Pulling image wpcube/wordpress:latest...",
  "[Network] Attaching to overlay network 'wp-net'...",
  "[Volume] Mounting NFS volume /mnt/vol-1024...",
  "[App] WordPress installed successfully.",
  "[Nginx] Reloading configuration...",
  "[System] Health check passed. Container ready."
];

// --- INTERNAL COMPONENT: Demo Sidebar ---
const DemoSidebar = () => {
  const navigate = useNavigate();

  const NavItem = ({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) => (
    <div
      className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 
        ${active 
          ? 'bg-indigo-50 text-indigo-700 cursor-default' 
          : 'text-slate-400 cursor-not-allowed opacity-70 hover:bg-slate-50'
        }`}
      title={active ? '' : 'Feature available in Full Account'}
    >
      <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
      {label}
      {!active && <Lock className="ml-auto w-3 h-3 text-slate-300" />}
    </div>
  );

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-slate-200 z-20">
      {/* Logo Area */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center h-16 flex-shrink-0 px-6 border-b border-slate-100 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm">
            <Box className="w-5 h-5" />
          </div>
          <span className="ml-3 text-lg font-bold text-slate-900 tracking-tight">WPCube</span>
        </div>
        
        {/* Nav Links */}
        <div className="flex-1 flex flex-col overflow-y-auto pt-5 pb-4 px-4 space-y-1">
          <NavItem icon={LayoutDashboard} label="Dashboard" active />
          <NavItem icon={Server} label="My Instances" />
          <NavItem icon={CreditCard} label="Billing" />
          <NavItem icon={Settings} label="Settings" />
          <NavItem icon={FileText} label="API Reference" />
        </div>
      </div>

      {/* Demo User Widget */}
      <div className="flex-shrink-0 border-t border-slate-200 p-4 bg-slate-50/50">
        <div className="flex items-center w-full">
          <div className="flex items-center flex-1 min-w-0 opacity-70 cursor-not-allowed" title="Profile editing disabled in demo">
            <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-semibold border border-slate-300">
              <User className="w-5 h-5" />
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 truncate">Demo User</p>
              <p className="text-xs text-slate-500 truncate">demo@wpcube.io</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="ml-2 p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Exit Demo"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- INTERNAL COMPONENT: Demo Navbar ---
const DemoNavbar = () => {
  return (
    <header className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white border-b border-slate-200 shadow-sm">
      <div className="flex-1 px-4 sm:px-6 lg:px-8 flex justify-between">
        <div className="flex items-center gap-4">
          {/* Breadcrumbs */}
          <nav className="hidden sm:flex items-center text-sm font-medium text-slate-500">
            <span className="cursor-default">Home</span>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs uppercase tracking-wide">
              Live Demo
            </span>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* Disabled Search Bar */}
          <div className="relative w-64 hidden sm:block opacity-60 cursor-not-allowed" title="Search disabled in demo">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              disabled
              placeholder="Search disabled in demo"
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-slate-50 text-slate-500 sm:text-sm cursor-not-allowed"
            />
          </div>

          {/* Disabled Notification */}
          <button 
            className="relative p-2 text-slate-300 cursor-not-allowed" 
            title="Notifications disabled"
          >
            <Bell className="w-6 h-6" />
          </button>

          {/* CTA */}
          <Link 
            to="/signup"
            className="ml-2 bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-bold py-2 px-3 rounded-lg transition-colors flex items-center gap-1 border border-amber-200"
          >
            Create Real Account <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </header>
  );
};

// --- MAIN PAGE COMPONENT ---
export const LiveDemoPage: React.FC = () => {
  const [cpuUsage, setCpuUsage] = useState(34);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Simulation Effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage(prev => {
        const change = Math.floor(Math.random() * 6) - 3;
        const val = prev + change;
        return val > 100 ? 99 : val < 10 ? 10 : val;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleRestrictedAction = () => {
    setToastMessage("This feature is read-only in the Live Demo. Sign up to access full control.");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      <DemoSidebar />
      
      <div className="md:pl-64 flex flex-col flex-1">
        <DemoNavbar />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          
          {/* Banner */}
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-8 shadow-sm rounded-r-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-amber-600 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-900">
                  Sandbox Environment Active
                </p>
                <p className="text-sm text-amber-700">
                  You are viewing the Live Demo. Actions are simulated and data will not be saved.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                <p className="text-slate-500 mt-1">Overview of your infrastructure.</p>
              </div>
              <button
                onClick={handleRestrictedAction}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 opacity-80"
              >
                <div className="mr-2 h-5 w-5 flex items-center justify-center border-2 border-white/30 rounded-full">
                  <span className="text-xs">+</span>
                </div>
                Create New Instance
              </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {/* Metric 1 */}
              <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-slate-200 p-5">
                <div className="flex items-center justify-between">
                  <dt className="text-sm font-medium text-slate-500 truncate">Active Instances</dt>
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <Server className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>
                <dd className="mt-4">
                  <div className="text-3xl font-bold text-slate-900">3</div>
                  <div className="mt-1 text-sm text-green-600 font-medium flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    System Operational
                  </div>
                </dd>
              </div>

              {/* Metric 2: CPU */}
              <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-slate-200 p-5">
                <div className="flex items-center justify-between">
                  <dt className="text-sm font-medium text-slate-500 truncate">Cluster CPU Load</dt>
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Cpu className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <dd className="mt-4">
                  <div className="flex justify-between items-end mb-2">
                    <div className="text-3xl font-bold text-slate-900 transition-all duration-500">{cpuUsage}%</div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full transition-all duration-1000 ease-in-out" style={{ width: `${cpuUsage}%` }}></div>
                  </div>
                </dd>
              </div>

              {/* Metric 3: RAM */}
              <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-slate-200 p-5">
                <div className="flex items-center justify-between">
                  <dt className="text-sm font-medium text-slate-500 truncate">Memory Allocation</dt>
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Activity className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
                <dd className="mt-4">
                  <div className="text-3xl font-bold text-slate-900">14 <span className="text-lg text-slate-400 font-normal">GB</span></div>
                  <div className="mt-1 text-sm text-slate-500">Static Demo Data</div>
                </dd>
              </div>

              {/* Metric 4: Cost */}
              <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-slate-200 p-5">
                <div className="flex items-center justify-between">
                  <dt className="text-sm font-medium text-slate-500 truncate">Est. Monthly Cost</dt>
                  <div className="p-2 bg-green-50 rounded-lg">
                    <span className="text-green-700 font-bold">$</span>
                  </div>
                </div>
                <dd className="mt-4">
                  <div className="text-3xl font-bold text-slate-900">$45.00</div>
                  <div className="mt-1 text-sm text-slate-500">Pro Plan (Simulated)</div>
                </dd>
              </div>
            </div>

            {/* Instance List */}
            <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900">Demo Instances</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                  <Globe className="w-3 h-3 mr-1" /> US-East-1
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-white">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Instance Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Network</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Specs</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {MOCK_INSTANCES.map((inst) => (
                      <tr key={inst.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 font-bold text-xs">
                              WP
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-bold text-slate-900">{inst.name}</div>
                              <div className="text-xs text-slate-500 font-mono">ID: #{inst.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="text-sm text-slate-900 font-mono">{inst.ip}</div>
                            <div className="text-xs text-slate-500">{inst.subdomain}.wpcube.local</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                           <div className="text-sm text-slate-600">
                              {inst.specs.cpu} / {inst.specs.ram}
                           </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={inst.status as any} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={handleRestrictedAction}
                              className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md transition-colors text-xs font-semibold"
                            >
                              Manage
                            </button>
                            <button 
                              className="text-slate-300 cursor-not-allowed p-1"
                              title="Disabled in Demo"
                            >
                              <MoreHorizontal className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Fake Logs */}
            <div className="bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-800">
              <div className="bg-slate-800 px-4 py-2 flex items-center justify-between border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-mono text-slate-300">Live Server Logs (Read-Only)</span>
                </div>
              </div>
              <div className="p-4 font-mono text-xs text-green-400 h-40 overflow-y-auto space-y-1">
                {FAKE_LOGS.map((log, i) => (
                   <div key={i} className="opacity-80 border-l-2 border-transparent pl-2">
                     <span className="text-slate-500 mr-2">{new Date().toLocaleTimeString()}</span>
                     {log}
                   </div>
                ))}
                <div className="animate-pulse">_</div>
              </div>
            </div>

          </div>
        </main>
      </div>

      <DemoToast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
};