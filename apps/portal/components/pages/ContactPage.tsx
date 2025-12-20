import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, LifeBuoy, CreditCard, Send, MapPin, Phone } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">How can we help?</h1>
          <p className="text-lg text-slate-600">Choose the right path so we can route your request to the correct team.</p>
        </div>

        {/* Routing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-center">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-6 mx-auto">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Sales & Enterprise</h3>
            <p className="text-slate-600 text-sm mb-6">
              Interested in WPCube Enterprise or need a custom SLA? Let's talk scale.
            </p>
            <button onClick={() => navigate('/enterprise')} className="w-full py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors">
              Book a Demo
            </button>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center mb-6 mx-auto">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Technical Support</h3>
            <p className="text-slate-600 text-sm mb-6">
              Site down? Performance issues? Our engineering team is ready to assist.
            </p>
            <button className="w-full py-2.5 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors">
              Open Ticket
            </button>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-center">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6 mx-auto">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">General Inquiry</h3>
            <p className="text-slate-600 text-sm mb-6">
              Have a question about features, pricing, or partnerships? Drop us a line.
            </p>
            <button 
              onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full py-2.5 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              Contact Us
            </button>
          </div>

        </div>

        {/* Global Offices & Form Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          {/* Offices */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-8">Our Offices</h2>
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-lg flex-shrink-0 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-slate-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">San Francisco (HQ)</h3>
                  <p className="text-slate-600 mt-1">
                    548 Market Street, Suite 42084<br/>
                    San Francisco, CA 94104
                  </p>
                  <p className="text-indigo-600 text-sm mt-2 font-medium flex items-center gap-1">
                    <Phone className="w-3 h-3" /> +1 (415) 555-0123
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-lg flex-shrink-0 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-slate-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Singapore</h3>
                  <p className="text-slate-600 mt-1">
                    71 Ayer Rajah Crescent, #05-12<br/>
                    Singapore 139951
                  </p>
                  <p className="text-indigo-600 text-sm mt-2 font-medium flex items-center gap-1">
                    <Phone className="w-3 h-3" /> +65 6777 9876
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div id="contact-form" className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Send us a message</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="Jane Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Work Email</label>
                <input type="email" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="jane@company.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white">
                  <option>Sales Inquiry</option>
                  <option>Partnership Proposal</option>
                  <option>Billing Question</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                <textarea rows={4} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="How can we help?"></textarea>
              </div>
              <button className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                Send Message <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
};