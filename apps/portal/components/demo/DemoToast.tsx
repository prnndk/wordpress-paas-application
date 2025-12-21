import React, { useEffect } from 'react';
import { Info, X } from 'lucide-react';

interface DemoToastProps {
  message: string | null;
  onClose: () => void;
}

export const DemoToast: React.FC<DemoToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-in">
      <div className="bg-slate-900 text-white rounded-lg shadow-2xl p-4 max-w-sm flex items-start gap-3 border-l-4 border-indigo-500">
        <Info className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-bold text-sm text-indigo-100 mb-1">Action Simulated</h4>
          <p className="text-sm text-slate-300 leading-relaxed">
            {message}
          </p>
          <a href="/#/signup" className="text-xs text-indigo-400 font-bold hover:text-indigo-300 mt-2 inline-block">
            Sign up to try for real →
          </a>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};