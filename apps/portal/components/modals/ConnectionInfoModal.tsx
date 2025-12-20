import React, { useState } from 'react';
import { X, Copy, Check, Server, Shield, Globe } from 'lucide-react';

interface ConnectionInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  instance: { name: string; ip: string } | null;
}

export const ConnectionInfoModal: React.FC<ConnectionInfoModalProps> = ({ isOpen, onClose, instance }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen || !instance) return null;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const Field = ({ label, value, id }: { label: string, value: string, id: string }) => (
    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center group">
      <div>
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">{label}</label>
        <code className="text-sm font-mono text-slate-700">{value}</code>
      </div>
      <button 
        onClick={() => handleCopy(value, id)}
        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-md transition-colors shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
        title="Copy"
      >
        {copiedField === id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-100 p-1.5 rounded-lg text-indigo-600">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Connection Details</h3>
              <p className="text-xs text-slate-500">{instance.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex gap-2 mb-2">
            <button className="flex-1 text-xs font-bold text-white bg-slate-800 py-1.5 rounded-md shadow-sm">SFTP / SSH</button>
            <button className="flex-1 text-xs font-bold text-slate-500 hover:bg-slate-100 py-1.5 rounded-md transition-colors">Database</button>
          </div>

          <div className="space-y-3">
            <Field label="Host Address" value={instance.ip} id="host" />
            <Field label="Username" value="wpcube_user" id="user" />
            <Field label="Password" value="••••••••••••••••" id="pass" />
            <Field label="Port" value="22" id="port" />
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex gap-3 items-start">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
              <strong>Security Tip:</strong> We recommend using SSH Keys instead of passwords. You can manage keys in your <span className="underline cursor-pointer">Profile Settings</span>.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-center">
          <button 
            onClick={onClose}
            className="text-sm font-bold text-slate-600 hover:text-slate-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};