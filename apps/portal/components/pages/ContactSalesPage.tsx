import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, ArrowRight, Loader2, 
  MessageSquare, ShieldCheck, Zap, Building 
} from 'lucide-react';

export const ContactSalesPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    jobTitle: '',
    traffic: '<1M',
    budget: '$500-$2k',
    timeline: '1-3 Months',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Mock API Call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col lg:flex-row">
      
      {/* Left Column: Trust & Benefits */}
      <div className="lg:w-5/12 bg-slate-900 text-white p-8 lg:p-20 flex flex-col justify-between relative overflow-hidden">
        {/* Background Texture */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600 rounded-full blur-[128px] opacity-40"></div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-wide mb-8">
            <Building className="w-3 h-3" /> Enterprise Sales
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold mb-6 leading-tight">
            Scale your infrastructure with confidence.
          </h1>
          <p className="text-lg text-slate-400 mb-12 leading-relaxed">
            Get a custom tailored plan designed for high-traffic, mission-critical WordPress applications.
          </p>

          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0 text-indigo-400 border border-slate-700">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white mb-1">Unmatched Performance</h3>
                <p className="text-slate-400 text-sm">Dedicated hardware resources and custom PHP-FPM tuning for sub-100ms response times.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0 text-indigo-400 border border-slate-700">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white mb-1">Advanced Security</h3>
                <p className="text-slate-400 text-sm">Enterprise WAF, DDoS mitigation, and audit logs included by default.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0 text-indigo-400 border border-slate-700">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white mb-1">Priority Support</h3>
                <p className="text-slate-400 text-sm">Direct access to engineers via a dedicated Slack channel with 15-min SLA.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-16 pt-8 border-t border-slate-800">
          <p className="text-slate-400 italic mb-4">"WPCube's enterprise architecture allowed us to handle 50M+ visitors during Black Friday without a single hiccup. It's the most reliable platform we've used."</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs">CTO</div>
            <div>
              <p className="text-white font-bold text-sm">Marcus Chen</p>
              <p className="text-slate-500 text-xs uppercase tracking-wide">CTO, TechDaily</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Form */}
      <div className="lg:w-7/12 p-8 lg:p-20 overflow-y-auto">
        <div className="max-w-xl mx-auto">
          
          {isSuccess ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center animate-fade-in">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Request Received</h2>
              <p className="text-lg text-slate-600 mb-8">
                Thank you for your interest in WPCube Enterprise. A dedicated Solution Architect will review your requirements and email you within <strong>2 hours</strong>.
              </p>
              <button 
                onClick={() => navigate('/')}
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
              >
                Return to Home
              </button>
            </div>
          ) : (
            <>
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-slate-900">Talk to our Sales Team</h2>
                <p className="text-slate-500 mt-2">Fill out the form below and we'll get back to you shortly.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">First Name</label>
                    <input 
                      type="text" 
                      name="firstName"
                      required
                      className="block w-full rounded-lg border-slate-300 border px-4 py-3 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="Jane"
                      value={formData.firstName}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name</label>
                    <input 
                      type="text" 
                      name="lastName"
                      required
                      className="block w-full rounded-lg border-slate-300 border px-4 py-3 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Work Email</label>
                    <input 
                      type="email" 
                      name="email"
                      required
                      className="block w-full rounded-lg border-slate-300 border px-4 py-3 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="jane@company.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Job Title</label>
                    <input 
                      type="text" 
                      name="jobTitle"
                      className="block w-full rounded-lg border-slate-300 border px-4 py-3 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="VP of Engineering"
                      value={formData.jobTitle}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Company Name</label>
                  <input 
                    type="text" 
                    name="company"
                    required
                    className="block w-full rounded-lg border-slate-300 border px-4 py-3 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="Acme Corp"
                    value={formData.company}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Monthly Traffic</label>
                    <select 
                      name="traffic"
                      className="block w-full rounded-lg border-slate-300 border px-4 py-3 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                      value={formData.traffic}
                      onChange={handleChange}
                    >
                      <option>&lt; 1 Million</option>
                      <option>1M - 10M</option>
                      <option>10M - 50M</option>
                      <option>50M+</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Monthly Budget</label>
                    <select 
                      name="budget"
                      className="block w-full rounded-lg border-slate-300 border px-4 py-3 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                      value={formData.budget}
                      onChange={handleChange}
                    >
                      <option>&lt; $500</option>
                      <option>$500 - $2,000</option>
                      <option>$2,000 - $10,000</option>
                      <option>$10,000+</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Timeline</label>
                    <select 
                      name="timeline"
                      className="block w-full rounded-lg border-slate-300 border px-4 py-3 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                      value={formData.timeline}
                      onChange={handleChange}
                    >
                      <option>ASAP</option>
                      <option>1-3 Months</option>
                      <option>3-6 Months</option>
                      <option>Just Researching</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Tell us about your infrastructure needs</label>
                  <textarea 
                    name="message"
                    rows={4}
                    className="block w-full rounded-lg border-slate-300 border px-4 py-3 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="We are migrating from AWS and need a managed solution..."
                    value={formData.message}
                    onChange={handleChange}
                  ></textarea>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-lg shadow-sm text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                      Submitting Request...
                    </>
                  ) : (
                    <>
                      Submit Request <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </button>
                <p className="text-xs text-slate-500 text-center mt-4">
                  By submitting this form, you agree to our Terms of Service and Privacy Policy.
                </p>
              </form>
            </>
          )}
        </div>
      </div>

    </div>
  );
};