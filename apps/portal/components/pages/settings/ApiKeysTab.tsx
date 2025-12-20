import React, { useState } from 'react';
import { 
  Key, Plus, Copy, Eye, EyeOff, Trash2, Check, AlertTriangle, Edit2, X, Save 
} from 'lucide-react';

export const ApiKeysTab: React.FC = () => {
  // Using 'wpc_live_' prefix instead of 'sk_live_' to avoid Git secret scanning false positives
  const [keys, setKeys] = useState([
    { id: 1, name: 'Production Backend', key: 'wpc_live_8a92b3c4d5e6f7g8h9i0j1k2l3m4n5', created: '2 days ago', lastUsed: '5 mins ago', visible: false, isEditing: false },
    { id: 2, name: 'CI/CD Pipeline', key: 'wpc_live_x1y2z3a4b5c6d7e8f9g0h1i2j3k4l5', created: '1 month ago', lastUsed: '1 day ago', visible: false, isEditing: false },
  ]);

  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [editNameValue, setEditNameValue] = useState('');

  const handleCopy = (key: string, id: number) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleVisibility = (id: number) => {
    setKeys(keys.map(k => k.id === id ? { ...k, visible: !k.visible } : k));
  };

  const handleRevoke = (id: number) => {
    if (window.confirm("Are you sure? Any applications using this key will lose access immediately.")) {
      setKeys(keys.filter(k => k.id !== id));
    }
  };

  const handleGenerate = () => {
    const newKey = {
      id: Date.now(),
      name: `New Key ${keys.length + 1}`,
      // Generate a random key with 'wpc_live_' prefix
      key: `wpc_live_${Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)}`,
      created: 'Just now',
      lastUsed: 'Never',
      visible: true,
      isEditing: false
    };
    setKeys([newKey, ...keys]);
  };

  const startEdit = (id: number, currentName: string) => {
    setEditNameValue(currentName);
    setKeys(keys.map(k => k.id === id ? { ...k, isEditing: true } : { ...k, isEditing: false }));
  };

  const saveEdit = (id: number) => {
    setKeys(keys.map(k => k.id === id ? { ...k, name: editNameValue, isEditing: false } : k));
  };

  const cancelEdit = (id: number) => {
    setKeys(keys.map(k => k.id === id ? { ...k, isEditing: false } : k));
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-left-2 duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">API Keys</h3>
          <p className="text-sm text-slate-500 mt-1">Manage access tokens for the WPCube API.</p>
        </div>
        <button 
          onClick={handleGenerate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm flex items-center gap-2 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" /> Generate New Secret Key
        </button>
      </div>

      {/* Security Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 items-start">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-amber-800">Security Best Practice</h4>
          <p className="text-xs text-amber-700 mt-1">
            Never share your secret keys in client-side code (browsers, mobile apps). 
            Store them securely in your backend environment variables.
          </p>
        </div>
      </div>

      {/* Keys List */}
      <div className="space-y-4">
        {keys.map((item) => (
          <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-indigo-200 transition-colors">
            <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center mb-3">
              <div className="flex-1">
                {item.isEditing ? (
                    <div className="flex items-center gap-2">
                        <input 
                            type="text" 
                            value={editNameValue}
                            onChange={(e) => setEditNameValue(e.target.value)}
                            className="text-sm font-bold text-slate-900 border border-indigo-300 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500"
                            autoFocus
                        />
                        <button onClick={() => saveEdit(item.id)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Save className="w-4 h-4" /></button>
                        <button onClick={() => cancelEdit(item.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><X className="w-4 h-4" /></button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 group">
                        <h4 className="font-bold text-slate-900 text-sm">{item.name}</h4>
                        <button onClick={() => startEdit(item.id, item.name)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-600 transition-opacity p-1">
                            <Edit2 className="w-3 h-3" />
                        </button>
                    </div>
                )}
                <p className="text-xs text-slate-500 mt-0.5 flex gap-3">
                    <span>Created: {item.created}</span>
                    <span className="text-slate-300">|</span>
                    <span>Last Used: {item.lastUsed}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleRevoke(item.id)}
                  className="text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 border border-transparent hover:border-red-100"
                >
                  <Trash2 className="w-3 h-3" /> Revoke
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-2">
              <div className="flex-1 font-mono text-sm text-slate-700 px-2 truncate">
                {item.visible ? item.key : item.key.substring(0, 9) + '•'.repeat(24) + item.key.substring(item.key.length - 4)}
              </div>
              
              <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                <button 
                  onClick={() => toggleVisibility(item.id)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded transition-colors"
                  title={item.visible ? "Hide" : "Reveal"}
                >
                  {item.visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => handleCopy(item.key, item.id)}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                  title="Copy"
                >
                  {copiedId === item.id ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};