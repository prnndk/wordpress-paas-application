import React, { useState, useRef } from 'react';
import { 
  Building, Upload, Trash2, AlertTriangle, Save, Loader2, RefreshCw, X, Check, Image as ImageIcon
} from 'lucide-react';

export const GeneralTab: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    workspaceName: 'Acme Corp Production',
    supportEmail: 'support@acmecorp.com',
    timezone: 'est',
    language: 'en'
  });

  // Avatar State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Danger Zone State
  const [transferStep, setTransferStep] = useState<'idle' | 'input' | 'confirm'>('idle');
  const [transferEmail, setTransferEmail] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');

  // --- Handlers ---

  const handleSave = () => {
    setLoading(true);
    setSuccessMsg(null);
    // Simulate API save
    setTimeout(() => {
      setLoading(false);
      setSuccessMsg("Changes saved successfully.");
      setTimeout(() => setSuccessMsg(null), 3000);
    }, 1500);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      // Simulate upload latency
      setTimeout(() => {
        const objectUrl = URL.createObjectURL(file);
        setAvatarUrl(objectUrl);
        setIsUploading(false);
      }, 1500);
    }
  };

  const handleRemoveAvatar = () => {
    if (window.confirm("Remove workspace logo?")) {
      setAvatarUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleTransfer = () => {
    if (transferStep === 'idle') setTransferStep('input');
    else if (transferStep === 'input' && transferEmail) {
        setTransferStep('confirm'); // In real app, would verify email first
    } else if (transferStep === 'confirm') {
        alert(`Ownership transferred to ${transferEmail}. You have been logged out.`);
        window.location.reload(); 
    }
  };

  const handleDeleteWorkspace = () => {
    if (deleteConfirm === formData.workspaceName) {
        alert("Workspace deleted. Redirecting...");
        window.location.href = '/';
    }
  };

  return (
    <div className="space-y-10 animate-in slide-in-from-left-2 duration-300 pb-10">
      
      {/* 1. Branding Section */}
      <div className="flex flex-col md:flex-row gap-8 items-start pb-10 border-b border-slate-200">
        <div className="w-full md:w-1/3">
          <h3 className="text-lg font-bold text-slate-900">Workspace Branding</h3>
          <p className="text-sm text-slate-500 mt-1">
            This logo will appear on your invoices and shared links.
          </p>
        </div>
        <div className="w-full md:w-2/3 flex items-center gap-6">
          <div className="relative group">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold border-4 border-white shadow-md overflow-hidden ${avatarUrl ? 'bg-white' : 'bg-indigo-100 text-indigo-600'}`}>
              {isUploading ? (
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              ) : avatarUrl ? (
                <img src={avatarUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                "AC"
              )}
            </div>
            {/* Hidden Input */}
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
            />
          </div>
          <div className="flex flex-col gap-3">
            <button 
                onClick={triggerFileUpload}
                disabled={isUploading}
                className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
            >
              <Upload className="w-4 h-4" /> {isUploading ? 'Uploading...' : 'Upload New Image'}
            </button>
            {avatarUrl && (
                <button 
                    onClick={handleRemoveAvatar}
                    className="text-xs text-red-600 hover:text-red-700 font-medium text-left flex items-center gap-1"
                >
                    <Trash2 className="w-3 h-3" /> Remove Logo
                </button>
            )}
            <p className="text-xs text-slate-400">Recommended: 400x400px (JPG, PNG)</p>
          </div>
        </div>
      </div>

      {/* 2. Profile Info */}
      <div className="flex flex-col md:flex-row gap-8 items-start pb-10 border-b border-slate-200">
        <div className="w-full md:w-1/3">
          <h3 className="text-lg font-bold text-slate-900">Profile Information</h3>
          <p className="text-sm text-slate-500 mt-1">
            Update your organization details.
          </p>
        </div>
        <div className="w-full md:w-2/3 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Workspace Name</label>
              <input 
                type="text" 
                value={formData.workspaceName}
                onChange={(e) => setFormData({...formData, workspaceName: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Support Email</label>
              <input 
                type="email" 
                value={formData.supportEmail}
                onChange={(e) => setFormData({...formData, supportEmail: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Timezone</label>
              <select 
                value={formData.timezone}
                onChange={(e) => setFormData({...formData, timezone: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="est">(GMT-05:00) Eastern Time</option>
                <option value="utc">(GMT+00:00) UTC</option>
                <option value="pst">(GMT-08:00) Pacific Time</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Language</label>
              <select 
                value={formData.language}
                onChange={(e) => setFormData({...formData, language: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="en">English (US)</option>
                <option value="es">Español</option>
                <option value="de">Deutsch</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end pt-4 gap-4">
            {successMsg && (
                <span className="text-sm font-medium text-green-600 animate-in fade-in flex items-center gap-1">
                    <Check className="w-4 h-4" /> {successMsg}
                </span>
            )}
            <button 
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Danger Zone */}
      <div className="border border-red-200 rounded-xl overflow-hidden bg-red-50/30">
        <div className="px-6 py-4 border-b border-red-100 bg-red-50 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h3 className="font-bold text-red-900">Danger Zone</h3>
        </div>
        <div className="p-6 space-y-8">
          
          {/* Transfer Ownership Flow */}
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-red-100 gap-4">
            <div className="max-w-xl">
              <h4 className="text-sm font-bold text-slate-900">Transfer Ownership</h4>
              <p className="text-sm text-slate-600 mt-1">
                Transfer this workspace to another user. You will lose admin access and be downgraded to a Viewer unless re-promoted.
              </p>
            </div>
            
            {transferStep === 'idle' && (
                <button 
                    onClick={() => setTransferStep('input')}
                    className="px-4 py-2 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-bold rounded-lg text-sm transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                    <RefreshCw className="w-4 h-4" /> Transfer
                </button>
            )}

            {transferStep !== 'idle' && (
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <input 
                        type="email" 
                        placeholder="New owner's email"
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500"
                        value={transferEmail}
                        onChange={(e) => setTransferEmail(e.target.value)}
                        disabled={transferStep === 'confirm'}
                    />
                    {transferStep === 'input' ? (
                        <button 
                            onClick={handleTransfer}
                            disabled={!transferEmail}
                            className="bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-slate-800"
                        >
                            Next
                        </button>
                    ) : (
                        <button 
                            onClick={handleTransfer}
                            className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-red-700"
                        >
                            Confirm Transfer
                        </button>
                    )}
                    <button onClick={() => { setTransferStep('idle'); setTransferEmail(''); }} className="p-2 text-slate-500 hover:text-slate-700"><X className="w-4 h-4" /></button>
                </div>
            )}
          </div>

          {/* Delete Workspace Flow */}
          <div className="flex flex-col gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Delete Workspace</h4>
              <p className="text-sm text-slate-600 mt-1">
                Permanently delete this workspace and all associated resources (Instances, Databases, Backups). This cannot be undone.
              </p>
            </div>
            
            <div className="flex gap-4 items-center bg-white p-4 rounded-lg border border-red-100">
                <div className="flex-1">
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">To confirm, type "{formData.workspaceName}"</label>
                    <input 
                        type="text"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                        value={deleteConfirm}
                        onChange={(e) => setDeleteConfirm(e.target.value)}
                        placeholder={formData.workspaceName}
                    />
                </div>
                <button 
                    disabled={deleteConfirm !== formData.workspaceName}
                    onClick={handleDeleteWorkspace}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed h-10 mt-5"
                >
                    <Trash2 className="w-4 h-4" /> Delete Workspace
                </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};