import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Lock, Building, 
  ShieldCheck, Headphones, Server, FileText, ArrowRight,
  Loader2, CheckCircle2
} from 'lucide-react';

export const EnterprisePage: React.FC = () => {
  const navigate = useNavigate();
  
  // Footer Form State
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success'>('idle');

  const handleFooterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormState('submitting');
    setTimeout(() => {
      setFormState('success');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      
      {/* Dark Mode Hero Section */}
      <div className="bg-slate-900 relative pt-32 pb-24 overflow-hidden">
        
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-20"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-wide mb-8">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
            Enterprise Edition
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-8 leading-tight">
            Scale without <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">limits.</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-12">
            Mission-critical WordPress hosting for high-traffic organizations. 
            Dedicated infrastructure, advanced security, and white-glove support.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={() => navigate('/enterprise/contact')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg shadow-indigo-900/40"
            >
              Contact Sales
            </button>
            <button 
              onClick={() => navigate('/resources/security-whitepaper')}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold py-4 px-8 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <FileText className="w-5 h-5 text-slate-400" /> Read Security Whitepaper
            </button>
          </div>
        </div>
      </div>

      {/* Trust Section */}
      <div className="bg-slate-900 border-b border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-8">Trusted by engineering teams at</p>
          <div className="flex flex-wrap justify-center gap-12 lg:gap-20 items-center">
             {['Nebula Corp', 'FinTech IO', 'EduGlobal', 'Vertex', 'Strata'].map((brand, i) => (
               <div key={i} className="text-xl font-bold text-slate-600 flex items-center gap-2 grayscale opacity-70 hover:opacity-100 hover:grayscale-0 transition-all duration-500 cursor-default">
                  <Box className="w-5 h-5" /> {brand}
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 mb-6">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">Single Sign-On (SSO)</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Integrate with Okta, Azure AD, or Google Workspace to manage team access securely. Enforce 2FA across your organization.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mb-6">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">Audit Logs</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Track every change made to your infrastructure. See who deployed code, who changed a config, and when it happened for compliance.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 mb-6">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">Private VPC</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Run your containers in a physically isolated network. Your data never traverses the public internet between your database and app.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-green-600 mb-6">
              <Headphones className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">Dedicated Support</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Direct Slack channel access to our core engineers. No tier-1 support scripts—talk directly to the people who built the platform.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600 mb-6">
              <Building className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">99.99% SLA</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Financially backed uptime guarantee. Our multi-region failover architecture ensures your site stays up even if a data center goes down.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
            <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center text-rose-600 mb-6">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">Compliance Ready</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              We are SOC2 Type II and GDPR ready. We provide Data Processing Agreements (DPA) and assist with your compliance audits.
            </p>
          </div>

        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-white border-t border-slate-200 py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
             <h2 className="text-3xl font-bold text-slate-900">Let's build something great.</h2>
             <p className="text-slate-600 mt-4">Tell us about your project needs.</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
             {formState === 'success' ? (
               <div className="text-center py-10 animate-fade-in">
                 <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                   <CheckCircle2 className="w-8 h-8 text-green-600" />
                 </div>
                 <h3 className="text-2xl font-bold text-slate-900 mb-2">Message Sent!</h3>
                 <p className="text-slate-600">We've received your inquiry. Our enterprise team will reach out shortly.</p>
                 <button 
                   onClick={() => setFormState('idle')}
                   className="mt-6 text-indigo-600 font-bold hover:text-indigo-800"
                 >
                   Send another message
                 </button>
               </div>
             ) : (
               <form className="space-y-6" onSubmit={handleFooterSubmit}>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Work Email</label>
                      <input type="email" required className="w-full rounded-lg border-slate-300 border px-4 py-2.5 focus:ring-indigo-500 focus:border-indigo-500" placeholder="you@company.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Company Size</label>
                      <select className="w-full rounded-lg border-slate-300 border px-4 py-2.5 focus:ring-indigo-500 focus:border-indigo-500 bg-white">
                        <option>1-10 employees</option>
                        <option>11-50 employees</option>
                        <option>51-200 employees</option>
                        <option>201-1000 employees</option>
                        <option>1000+ employees</option>
                      </select>
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Project Details</label>
                    <textarea required rows={4} className="w-full rounded-lg border-slate-300 border px-4 py-2.5 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Tell us about your traffic, stack requirements, and timeline..."></textarea>
                 </div>
                 <button 
                   type="submit"
                   disabled={formState === 'submitting'}
                   className={`w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-lg transition-colors flex justify-center items-center gap-2 ${formState === 'submitting' ? 'opacity-75 cursor-not-allowed' : ''}`}
                 >
                   {formState === 'submitting' ? (
                     <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Sending...
                     </>
                   ) : (
                     <>
                        Submit Request <ArrowRight className="w-4 h-4" />
                     </>
                   )}
                 </button>
               </form>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};