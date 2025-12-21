import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Check, ChevronDown, Minus, ChevronRight 
} from 'lucide-react';

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // FAQ Component
  const FaqItem = ({ question, answer }: { question: string, answer: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="border-b border-slate-200">
        <button 
          className="w-full py-6 flex justify-between items-center text-left focus:outline-none group"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="text-lg font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">{question}</span>
          <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
        </button>
        <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-48 pb-6' : 'max-h-0'}`}>
          <p className="text-slate-600 leading-relaxed">{answer}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white font-sans text-slate-900">
      
      {/* Header & Toggle */}
      <div className="pt-20 pb-16 text-center px-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">
          Predictable pricing, <br/><span className="text-indigo-600">designed for scale.</span>
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10">
          Start for free, upgrade as you grow. No hidden fees or surprise overage charges.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 text-sm font-medium select-none mb-12">
          <span className={`${billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-500'} transition-colors`}>Monthly</span>
          <div 
            onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
            className="w-14 h-7 bg-indigo-100 rounded-full relative cursor-pointer transition-colors duration-300 flex items-center px-1"
          >
            <div className={`w-5 h-5 bg-indigo-600 rounded-full shadow-md transform transition-transform duration-300 ${billingCycle === 'yearly' ? 'translate-x-7' : 'translate-x-0'}`}></div>
          </div>
          <span className={`${billingCycle === 'yearly' ? 'text-slate-900' : 'text-slate-500'} transition-colors flex items-center gap-2`}>
            Yearly <span className="text-indigo-600 text-xs bg-indigo-50 px-2 py-0.5 rounded-full font-bold border border-indigo-100">Save 20%</span>
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-8">
            {/* Starter */}
            <div className="p-8 rounded-3xl border border-slate-200 bg-white hover:border-slate-300 transition-all hover:shadow-lg text-left">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Starter</h3>
              <p className="text-slate-500 text-sm mb-6">Perfect for personal projects.</p>
              <div className="mb-6 h-16">
                <span className="text-4xl font-bold text-slate-900">$0</span>
                <span className="text-slate-500">/mo</span>
              </div>
              <button onClick={() => navigate('/signup')} className="w-full py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors mb-8">
                Start Free
              </button>
              <ul className="space-y-4 text-sm text-slate-600">
                <li className="flex items-center gap-3"><Check className="w-4 h-4 text-green-500" /> 1 Project</li>
                <li className="flex items-center gap-3"><Check className="w-4 h-4 text-green-500" /> Community Support</li>
                <li className="flex items-center gap-3"><Check className="w-4 h-4 text-green-500" /> 5GB Bandwidth</li>
              </ul>
            </div>

            {/* Pro */}
            <div className="p-8 rounded-3xl border-2 border-indigo-600 bg-slate-900 text-white shadow-xl relative scale-105 z-10 text-left">
              <div className="absolute top-0 right-0 left-0 -mt-4 flex justify-center">
                <span className="bg-indigo-600 text-white text-xs font-bold uppercase tracking-wide py-1 px-3 rounded-full shadow-sm">Most Popular</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Pro</h3>
              <p className="text-indigo-200 text-sm mb-6">For growing businesses.</p>
              <div className="mb-6 h-16">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-white">${billingCycle === 'monthly' ? 29 : 24}</span>
                  <span className="text-indigo-300 ml-1">/mo</span>
                </div>
                {billingCycle === 'yearly' && <div className="text-xs text-indigo-300 mt-1">Billed $288 yearly</div>}
              </div>
              <button onClick={() => navigate('/signup')} className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-colors mb-8 shadow-lg shadow-indigo-900/50">
                Get Started
              </button>
              <ul className="space-y-4 text-sm text-indigo-100">
                <li className="flex items-center gap-3"><Check className="w-4 h-4 text-indigo-400" /> 5 Projects</li>
                <li className="flex items-center gap-3"><Check className="w-4 h-4 text-indigo-400" /> Priority Support</li>
                <li className="flex items-center gap-3"><Check className="w-4 h-4 text-indigo-400" /> 100GB Bandwidth</li>
                <li className="flex items-center gap-3"><Check className="w-4 h-4 text-indigo-400" /> Database Backups</li>
              </ul>
            </div>

            {/* Business */}
            <div className="p-8 rounded-3xl border border-slate-200 bg-white hover:border-slate-300 transition-all hover:shadow-lg text-left">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Business</h3>
              <p className="text-slate-500 text-sm mb-6">For large teams & agencies.</p>
              <div className="mb-6 h-16">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-slate-900">${billingCycle === 'monthly' ? 79 : 64}</span>
                  <span className="text-slate-500 ml-1">/mo</span>
                </div>
                {billingCycle === 'yearly' && <div className="text-xs text-slate-500 mt-1">Billed $768 yearly</div>}
              </div>
              <button onClick={() => navigate('/signup')} className="w-full py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors mb-8">
                Contact Sales
              </button>
              <ul className="space-y-4 text-sm text-slate-600">
                <li className="flex items-center gap-3"><Check className="w-4 h-4 text-green-500" /> 20 Projects</li>
                <li className="flex items-center gap-3"><Check className="w-4 h-4 text-green-500" /> Dedicated Success Manager</li>
                <li className="flex items-center gap-3"><Check className="w-4 h-4 text-green-500" /> 1TB Bandwidth</li>
                <li className="flex items-center gap-3"><Check className="w-4 h-4 text-green-500" /> SSO & Audit Logs</li>
              </ul>
            </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-12">Feature Comparison</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="py-4 px-6 bg-slate-50 text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Features</th>
                  <th className="py-4 px-6 bg-slate-50 text-sm font-bold text-slate-900 border-b border-slate-200 text-center w-1/4">Starter</th>
                  <th className="py-4 px-6 bg-slate-50 text-sm font-bold text-indigo-600 border-b border-slate-200 text-center w-1/4">Pro</th>
                  <th className="py-4 px-6 bg-slate-50 text-sm font-bold text-slate-900 border-b border-slate-200 text-center w-1/4">Business</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {/* Compute */}
                <tr><td colSpan={4} className="py-3 px-6 bg-slate-50/50 text-xs font-bold text-slate-500 uppercase tracking-wider">Compute & Storage</td></tr>
                <tr>
                  <td className="py-4 px-6 text-sm text-slate-700">vCPU Allocation</td>
                  <td className="py-4 px-6 text-sm text-slate-600 text-center">Shared</td>
                  <td className="py-4 px-6 text-sm text-slate-900 font-medium text-center">Dedicated 2 Core</td>
                  <td className="py-4 px-6 text-sm text-slate-600 text-center">Dedicated 4 Core</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-sm text-slate-700">RAM</td>
                  <td className="py-4 px-6 text-sm text-slate-600 text-center">2 GB</td>
                  <td className="py-4 px-6 text-sm text-slate-900 font-medium text-center">4 GB</td>
                  <td className="py-4 px-6 text-sm text-slate-600 text-center">16 GB</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-sm text-slate-700">NVMe Storage</td>
                  <td className="py-4 px-6 text-sm text-slate-600 text-center">10 GB</td>
                  <td className="py-4 px-6 text-sm text-slate-900 font-medium text-center">40 GB</td>
                  <td className="py-4 px-6 text-sm text-slate-600 text-center">200 GB</td>
                </tr>

                {/* Features */}
                <tr><td colSpan={4} className="py-3 px-6 bg-slate-50/50 text-xs font-bold text-slate-500 uppercase tracking-wider">Platform Features</td></tr>
                <tr>
                  <td className="py-4 px-6 text-sm text-slate-700">Instant Deployments</td>
                  <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-sm text-slate-700">Redis Object Cache</td>
                  <td className="py-4 px-6 text-center"><Minus className="w-5 h-5 text-slate-300 mx-auto" /></td>
                  <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-sm text-slate-700">Auto-Scaling</td>
                  <td className="py-4 px-6 text-center"><Minus className="w-5 h-5 text-slate-300 mx-auto" /></td>
                  <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-sm text-slate-700">Team Members</td>
                  <td className="py-4 px-6 text-sm text-slate-600 text-center">1</td>
                  <td className="py-4 px-6 text-sm text-slate-900 font-medium text-center">5</td>
                  <td className="py-4 px-6 text-sm text-slate-600 text-center">Unlimited</td>
                </tr>

                {/* Support */}
                <tr><td colSpan={4} className="py-3 px-6 bg-slate-50/50 text-xs font-bold text-slate-500 uppercase tracking-wider">Support</td></tr>
                <tr>
                  <td className="py-4 px-6 text-sm text-slate-700">Support Level</td>
                  <td className="py-4 px-6 text-sm text-slate-600 text-center">Community</td>
                  <td className="py-4 px-6 text-sm text-slate-900 font-medium text-center">Email (24h)</td>
                  <td className="py-4 px-6 text-sm text-slate-600 text-center">Dedicated Slack</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="py-24 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">Frequently Asked Questions</h2>
        <div className="space-y-2">
          <FaqItem 
            question="Do you offer a free trial?" 
            answer="Yes! Our Starter plan is free forever for small personal projects. For Pro and Business plans, we offer a 14-day free trial with no credit card required."
          />
          <FaqItem 
            question="What happens if I go over my limits?" 
            answer="We don't hard-cap your traffic. If you exceed your bandwidth limits, we'll reach out to discuss upgrading your plan. For CPU/RAM, our auto-scaler will handle spikes, but consistent overuse will require a plan upgrade."
          />
          <FaqItem 
            question="Can I upgrade or downgrade anytime?" 
            answer="Absolutely. You can change your plan instantly from the dashboard. Prorated credits will be applied to your account for downgrades."
          />
          <FaqItem 
            question="Do you support Multi-site?" 
            answer="Yes, WordPress Multi-site is supported on Pro and Business plans. Each sub-site counts towards your storage limits, but not your project limits."
          />
        </div>
      </div>

    </div>
  );
};