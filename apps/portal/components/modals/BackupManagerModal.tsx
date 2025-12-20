import React, { useState } from 'react';
import { X, Database, Clock, Download, RotateCcw, Plus, Loader2, AlertTriangle, FileBox } from 'lucide-react';

interface BackupManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  instanceName: string;
}

export const BackupManagerModal: React.FC<BackupManagerModalProps> = ({ isOpen, onClose, instanceName }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  
  const [backups, setBackups] = useState([
    { id: 'bk_1', date: '2023-11-21 04:00 AM', size: '485 MB', type: 'Automated' },
    { id: 'bk_2', date: '2023-11-20 04:00 AM', size: '482 MB', type: 'Automated' },
    { id: 'bk_3', date: '2023-11-19 12:30 PM', size: '480 MB', type: 'Manual' },
  ]);

  if (!isOpen) return null;

  const handleCreateBackup = () => {
    setIsCreating(true);
    setTimeout(() => {
      const newBackup = {
        id: `bk_${Date.now()}`,
        date: new Date().toLocaleString([], { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        size: '486 MB',
        type: 'Manual'
      };
      setBackups([newBackup, ...backups]);
      setIsCreating(false);
    }, 2000);
  };

  const handleRestore = (id: string) => {
    if(!window.confirm("Are you sure? This will overwrite current data.")) return;
    setRestoringId(id);
    setTimeout(() => {
      setRestoringId(null);
      alert("System restored successfully.");
      onClose();
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" /> Backups
            </h3>
            <p className="text-xs text-slate-500">Manage snapshots for {instanceName}</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleCreateBackup}
              disabled={isCreating}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-70"
            >
              {isCreating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              {isCreating ? 'Creating...' : 'Create Backup'}
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          
          <div className="space-y-3">
            {backups.map((bk) => (
              <div key={bk.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bk.type === 'Automated' ? 'bg-slate-100 text-slate-500' : 'bg-indigo-100 text-indigo-600'}`}>
                    <FileBox className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{bk.date}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>{bk.size}</span>
                      <span>•</span>
                      <span className={`px-1.5 rounded-sm font-medium ${bk.type === 'Automated' ? 'bg-slate-100 text-slate-600' : 'bg-indigo-50 text-indigo-600'}`}>
                        {bk.type}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Download Archive"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleRestore(bk.id)}
                    disabled={restoringId !== null}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 hover:border-indigo-200 transition-colors"
                  >
                    {restoringId === bk.id ? (
                      <><Loader2 className="w-3 h-3 animate-spin" /> Restoring...</>
                    ) : (
                      <><RotateCcw className="w-3 h-3" /> Restore</>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-900">Restoration Policy</h4>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                Restoring a backup will overwrite all files and database entries created after the snapshot. 
                We recommend creating a manual backup before restoring an older version.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};