import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building, CreditCard, Users, Key } from 'lucide-react';

// Import Tabs
import { GeneralTab } from './settings/GeneralTab';
import { BillingTab } from './settings/BillingTab';
import { TeamTab } from './settings/TeamTab';
import { ApiKeysTab } from './settings/ApiKeysTab';

export const SettingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Safe Access: If no tab is present, default to 'general' locally
  const activeTab = searchParams.get('tab') || 'general';
  
  // Ensure URL is normalized on load
  useEffect(() => {
    if (!searchParams.get('tab')) {
      setSearchParams({ tab: 'general' }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const tabs = [
    { id: 'general', label: 'General', icon: Building, component: GeneralTab },
    { id: 'billing', label: 'Billing & Usage', icon: CreditCard, component: BillingTab },
    { id: 'team', label: 'Team Members', icon: Users, component: TeamTab },
    { id: 'api', label: 'API Keys', icon: Key, component: ApiKeysTab },
  ];

  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || GeneralTab;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Workspace Settings</h1>
        <p className="text-slate-500 mt-1">Manage your organization preferences, billing, and access.</p>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSearchParams({ tab: tab.id })}
                className={`
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
                  ${isActive
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
                `}
              >
                <Icon className={`
                  -ml-0.5 mr-2 h-4 w-4 transition-colors
                  ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-500'}
                `} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content Area */}
      <div className="bg-white shadow-sm rounded-xl border border-slate-200 p-8 min-h-[500px]">
        {/* We render the component here. Any future shared props (like toast handlers) can be passed down here. */}
        <ActiveComponent />
      </div>
    </div>
  );
};