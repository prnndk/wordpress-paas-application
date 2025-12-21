import React, { useEffect } from 'react';
import { X, ShieldCheck, Heart, MessageCircle, AlertTriangle } from 'lucide-react';

interface GuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuidelinesModal: React.FC<GuidelinesModalProps> = ({ isOpen, onClose }) => {
  // Prevent scrolling on body when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-indigo-600 px-6 py-6 text-white text-center relative">
          <div className="mx-auto w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3 backdrop-blur-sm">
             <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold">Community Code of Conduct</h2>
          <p className="text-indigo-100 text-sm mt-1">Help us keep the Cube friendly.</p>
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Be Respectful</h3>
              <p className="text-sm text-slate-600 leading-relaxed mt-1">
                Harassment, hate speech, and personal attacks are strictly prohibited. Treat fellow developers with kindness, regardless of their skill level.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">No Spam or Self-Promotion</h3>
              <p className="text-sm text-slate-600 leading-relaxed mt-1">
                Do not use the forum solely to promote your own products, plugins, or services. Links must be relevant to the discussion.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Search Before Posting</h3>
              <p className="text-sm text-slate-600 leading-relaxed mt-1">
                To keep the forum clean, please check if your question has already been answered before starting a new thread.
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-lg transition-colors shadow-sm"
          >
            I Agree & Continue
          </button>
        </div>

      </div>
    </div>
  );
};