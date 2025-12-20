import React, { useState } from 'react';
import { 
  Database, Plus, Download, RotateCcw, 
  Clock, HardDrive, CheckCircle2, Loader2, X 
} from 'lucide-react';

interface BackupsTabProps {
  instanceName: string;
}

export const BackupsTab: React.FC<BackupsTabProps> = ({ instanceName }) => {
  const [backups, setBackups] = useState([
    { id: 1, date: '2023-11-21 04:00 AM', type: 'Automated', size: '485 MB', status: 'Completed' },
    { id: 2, date: '2023-11-20 04:00 AM', type: 'Automated', size: '482 MB', status: 'Completed' },
    { id: 3, date: '2023-11-19 12:30 PM', type: 'Manual', size: '480 MB', status: 'Completed' },
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleCreateBackup = () => {
    setIsCreating(true);
    setTimeout(() => {
      const newBackup = {
        id: Date.now(),
        date: new Date().toLocaleString([], { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        type: 'Manual',
        size: '486 MB',
        status: 'Completed'
      };
      setBackups([newBackup, ...backups]);
      setIsCreating(false);
    }, 2500);
  };

  const handleRestore = () => {
    if (window.confirm("Are you sure? This will overwrite your current live data.")) {
      setIsRestoring(true);
      setTimeout(() => {
        setIsRestoring(false);
        alert("System restored successfully.");
      }, 3500);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Full Screen Restore Overlay */}
      {isRestoring && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center text-white">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6"></div>
          <h2 className="text-2xl font-bold mb-2">Restoring System...</h2>
          <p className="text-slate-400">Please do not close this window.</p>
        </div>
      )}

      {/* Header Stats */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex gap-8">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Backups</p>
            <p className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" /> {backups.length}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Size</p>
            <p className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-indigo-600" /> 1.4 GB
            </p>
          </div>
        </div>
        <button 
          onClick={handleCreateBackup}
          disabled={isCreating}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-70"
        >
          {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {isCreating ? 'Creating Snapshot...' : 'Create Manual Backup'}
        </button>
      </div>

      {/* Backup Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date Created</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Size</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {backups.map((bk) => (
              <tr key={bk.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" /> {bk.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${bk.type === 'Manual' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                    {bk.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                  {bk.size}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded-full w-fit">
                    <CheckCircle2 className="w-3 h-3" /> {bk.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-3">
                    <button 
                      className="text-slate-400 hover:text-indigo-600 transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={handleRestore}
                      className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" /> Restore
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};