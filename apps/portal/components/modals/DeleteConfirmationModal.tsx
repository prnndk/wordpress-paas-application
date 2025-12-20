import React, { useState } from 'react';
import { AlertTriangle, Trash2, Loader2, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  instanceName: string;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isOpen, onClose, onConfirm, instanceName }) => {
  const [inputName, setInputName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (inputName !== instanceName) return;
    setIsDeleting(true);
    // Simulate API delay controlled by parent, but we start spinner here
    onConfirm(); 
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          
          <h2 className="text-xl font-bold text-slate-900 mb-2">Delete Instance?</h2>
          <p className="text-slate-600 text-sm mb-6">
            This action cannot be undone. This will permanently delete the 
            <strong className="text-slate-900"> {instanceName}</strong> instance, 
            its database, and all associated backups.
          </p>

          <div className="text-left mb-6">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Type <span className="select-all text-slate-900">{instanceName}</span> to confirm
            </label>
            <input 
              type="text" 
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
              placeholder={instanceName}
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirm}
              disabled={inputName !== instanceName || isDeleting}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" /> Delete Forever
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};