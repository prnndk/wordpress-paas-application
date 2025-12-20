import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Twitter, Github, Disc } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                <Box className="w-4 h-4" />
              </div>
              <span className="font-bold text-xl text-slate-900">WPCube</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed mb-6 max-w-sm">
              The Docker-powered WordPress Platform. We provide isolated, high-performance container orchestration for mission-critical sites.
            </p>
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subscribe to our newsletter</p>
              <form className="flex gap-2 max-w-sm">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
                <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
                  Subscribe
                </button>
              </form>
            </div>
            <div className="flex gap-4 mt-8">
              <a href="#" className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"><Github className="w-5 h-5" /></a>
              <a href="#" className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"><Disc className="w-5 h-5" /></a>
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="font-bold text-slate-900 mb-4">Product</h4>
            <ul className="space-y-3 text-sm text-slate-600">
              <li><Link to="/features" className="hover:text-indigo-600 transition-colors">Features</Link></li>
              <li><Link to="/pricing" className="hover:text-indigo-600 transition-colors">Pricing</Link></li>
              <li><Link to="/enterprise" className="hover:text-indigo-600 transition-colors">Enterprise</Link></li>
              <li><Link to="/changelog" className="hover:text-indigo-600 transition-colors">Changelog</Link></li>
              <li><Link to="/demo" className="hover:text-indigo-600 transition-colors">Live Demo</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-4">Resources</h4>
            <ul className="space-y-3 text-sm text-slate-600">
              <li><Link to="/docs" className="hover:text-indigo-600 transition-colors">Documentation</Link></li>
              <li><Link to="/api-reference" className="hover:text-indigo-600 transition-colors">API Reference</Link></li>
              <li><Link to="/status" className="hover:text-indigo-600 transition-colors">System Status</Link></li>
              <li><Link to="/community" className="hover:text-indigo-600 transition-colors">Community</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-4">Company</h4>
            <ul className="space-y-3 text-sm text-slate-600">
              <li><Link to="/about" className="hover:text-indigo-600 transition-colors">About Us</Link></li>
              <li><Link to="/blog" className="hover:text-indigo-600 transition-colors">Blog</Link></li>
              <li><Link to="/legal" className="hover:text-indigo-600 transition-colors">Legal & Privacy</Link></li>
              <li><Link to="/contact" className="hover:text-indigo-600 transition-colors">Contact</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-sm">
            &copy; 2024 WPCube Inc. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link to="/legal#privacy" className="hover:text-slate-900">Privacy Policy</Link>
            <Link to="/legal#terms" className="hover:text-slate-900">Terms of Service</Link>
            <Link to="/legal#sla" className="hover:text-slate-900">SLA</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};