import React, { useState, useEffect } from 'react';
import { X, FileText, Shield } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'terms' | 'privacy';
}

export const LegalModal: React.FC<LegalModalProps> = ({ 
  isOpen, 
  onClose, 
  initialTab = 'terms' 
}) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(initialTab);

  // Sync internal state if prop changes while open
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

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
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Legal Information</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex-1 py-3 text-sm font-medium text-center transition-colors border-b-2 ${
              activeTab === 'terms' 
                ? 'text-indigo-600 border-indigo-600 bg-indigo-50/50' 
                : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" /> Terms of Service
            </span>
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 py-3 text-sm font-medium text-center transition-colors border-b-2 ${
              activeTab === 'privacy' 
                ? 'text-indigo-600 border-indigo-600 bg-indigo-50/50' 
                : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <Shield className="w-4 h-4" /> Privacy Policy
            </span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          <div className="prose prose-sm prose-slate max-w-none text-slate-600">
            {activeTab === 'terms' ? (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                  <h3 className="text-slate-900 font-bold text-lg mb-2">1. Acceptance of Terms</h3>
                  <p>
                    By accessing and using WPCube ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                  <h3 className="text-slate-900 font-bold text-lg mb-2">2. Service Availability & SLA</h3>
                  <p>
                    We strive to maintain a 99.9% uptime for all containerized services. However, strictly "Alpha" or "Beta" features may be unstable. We reserve the right to perform scheduled maintenance windows with 24-hour prior notice via email or dashboard notification.
                  </p>
                  <p className="mt-2">
                    WPCube is not liable for downtime caused by upstream provider outages (e.g., AWS, GCP) or Force Majeure events.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                  <h3 className="text-slate-900 font-bold text-lg mb-2">3. User Responsibilities</h3>
                  <p>
                    You are responsible for maintaining the security of your account and password. WPCube cannot and will not be liable for any loss or damage from your failure to comply with this security obligation.
                  </p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>You must not use the service for any illegal or unauthorized purpose.</li>
                    <li>You must not transmit any worms or viruses or any code of a destructive nature.</li>
                    <li>You are responsible for all content posted and activity that occurs under your account.</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                  <h3 className="text-slate-900 font-bold text-lg mb-2">1. Data Collection</h3>
                  <p>
                    We collect information you provide directly to us. For example, we collect information when you create an account, subscribe, participate in any interactive features of the services, fill out a form, request customer support, or otherwise communicate with us.
                  </p>
                  <p className="mt-2">
                    The types of information we may collect include your name, email address, postal address, credit card information (processed via Stripe), and other contact or identifying information you choose to provide.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                  <h3 className="text-slate-900 font-bold text-lg mb-2">2. Cookie Usage</h3>
                  <p>
                    We use cookies and similar tracking technologies to track the activity on our Service and hold certain information. Cookies are files with small amount of data which may include an anonymous unique identifier.
                  </p>
                  <p className="mt-2">
                    You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service (e.g., Auth sessions).
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                  <h3 className="text-slate-900 font-bold text-lg mb-2">3. Third-Party Sharing</h3>
                  <p>
                    We do not sell, trade, or otherwise transfer to outside parties your Personally Identifiable Information. This does not include website hosting partners and other parties who assist us in operating our website, conducting our business, or serving our users, so long as those parties agree to keep this information confidential.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end rounded-b-xl">
          <button
            onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            I Understand & Agree
          </button>
        </div>

      </div>
    </div>
  );
};