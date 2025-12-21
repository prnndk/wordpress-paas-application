import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, Github, Twitter, 
  ExternalLink, ArrowRight, Users, MessageCircle,
  ThumbsUp
} from 'lucide-react';
import { GuidelinesModal } from '../modals/GuidelinesModal';

export const CommunityPage: React.FC = () => {
  const navigate = useNavigate();
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);

  return (
    <div className="bg-white font-sans text-slate-900">
      
      <GuidelinesModal 
        isOpen={isGuidelinesOpen} 
        onClose={() => setIsGuidelinesOpen(false)} 
      />

      {/* Hero Section */}
      <div className="relative pt-20 pb-20 overflow-hidden bg-slate-50 border-b border-slate-200">
        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-50"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wide mb-6">
            <Users className="w-4 h-4" /> 5,432 Members Strong
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6">
            Welcome to the <span className="text-indigo-600">Cube.</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-10">
            Join thousands of DevOps engineers, WordPress developers, and agency owners scaling their infrastructure with WPCube.
          </p>
          <div className="flex justify-center gap-4">
            <button className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg flex items-center gap-2 transform hover:-translate-y-1">
              <MessageCircle className="w-5 h-5" /> Join Discord Server
            </button>
          </div>
        </div>
      </div>

      {/* Resources Grid */}
      <div className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div 
            onClick={() => navigate('/resources/community/forum')}
            className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-indigo-200 group cursor-pointer"
          >
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Community Forum</h3>
            <p className="text-slate-600 mb-6">Discussions, help, and showcases. Connect with other users and share your knowledge.</p>
            <span className="text-indigo-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
              Visit Forum <ArrowRight className="w-4 h-4" />
            </span>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-slate-800 group cursor-pointer">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Github className="w-6 h-6 text-slate-900" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">GitHub</h3>
            <p className="text-slate-600 mb-6">Contribute to our Open Source Core. Report bugs, suggest features, or submit PRs.</p>
            <span className="text-slate-900 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
              View Repo <ArrowRight className="w-4 h-4" />
            </span>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-blue-300 group cursor-pointer">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Twitter className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Twitter / X</h3>
            <p className="text-slate-600 mb-6">Latest announcements, tips, and downtime alerts. Follow us to stay in the loop.</p>
            <span className="text-blue-500 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
              Follow Us <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </div>

      {/* Featured Showcases */}
      <div className="bg-slate-50 py-20 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Made with WPCube</h2>
            <p className="text-slate-600">See how high-traffic brands scale their digital presence.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Showcase 1 */}
            <div className="group">
              <div className="bg-slate-200 rounded-xl aspect-[16/10] overflow-hidden mb-4 relative shadow-sm">
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                  <span className="text-white font-medium flex items-center gap-2"><ExternalLink className="w-4 h-4" /> Visit Site</span>
                </div>
                <div className="w-full h-full bg-slate-300 flex items-center justify-center text-slate-400">
                  {/* Placeholder for screenshot */}
                  <span className="font-medium">TechCrunch Clone</span>
                </div>
              </div>
              <h3 className="font-bold text-slate-900 text-lg">TechDaily News</h3>
              <p className="text-sm text-slate-500">High-traffic media outlet handling 5M+ hits/mo.</p>
            </div>

            {/* Showcase 2 */}
            <div className="group">
              <div className="bg-slate-200 rounded-xl aspect-[16/10] overflow-hidden mb-4 relative shadow-sm">
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                  <span className="text-white font-medium flex items-center gap-2"><ExternalLink className="w-4 h-4" /> Visit Site</span>
                </div>
                <div className="w-full h-full bg-slate-300 flex items-center justify-center text-slate-400">
                  <span className="font-medium">WooCommerce Scale</span>
                </div>
              </div>
              <h3 className="font-bold text-slate-900 text-lg">GearUp Shop</h3>
              <p className="text-sm text-slate-500">E-commerce store with 50k SKUs and auto-scaling.</p>
            </div>

            {/* Showcase 3 */}
            <div className="group">
              <div className="bg-slate-200 rounded-xl aspect-[16/10] overflow-hidden mb-4 relative shadow-sm">
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                  <span className="text-white font-medium flex items-center gap-2"><ExternalLink className="w-4 h-4" /> Visit Site</span>
                </div>
                <div className="w-full h-full bg-slate-300 flex items-center justify-center text-slate-400">
                  <span className="font-medium">SaaS Landing</span>
                </div>
              </div>
              <h3 className="font-bold text-slate-900 text-lg">FlowMetric SaaS</h3>
              <p className="text-sm text-slate-500">B2B Marketing site with global CDN delivery.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Latest Discussions */}
      <div className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
          <MessageCircle className="w-6 h-6 text-indigo-600" /> Recent Discussions
        </h2>

        <div className="space-y-4">
          
          {/* Discussion 1 */}
          <div 
            onClick={() => navigate('/resources/community/discuss/101')}
            className="bg-white border border-slate-200 rounded-xl p-6 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                  AD
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1 hover:text-indigo-600 transition-colors">How to configure Redis Object Cache?</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span>@alexdev</span>
                    <span>•</span>
                    <span>2 hours ago</span>
                    <span>•</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded-full text-xs text-slate-600">Performance</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-slate-400 text-sm">
                <span className="flex items-center gap-1"><MessageSquare className="w-4 h-4" /> 12</span>
                <span className="flex items-center gap-1"><ThumbsUp className="w-4 h-4" /> 5</span>
              </div>
            </div>
          </div>

          {/* Discussion 2 */}
          <div 
            onClick={() => navigate('/resources/community/discuss/102')}
            className="bg-white border border-slate-200 rounded-xl p-6 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-sm">
                  WS
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1 hover:text-indigo-600 transition-colors">Benchmark: WPCube vs DigitalOcean</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span>@wpspeed</span>
                    <span>•</span>
                    <span>5 hours ago</span>
                    <span>•</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded-full text-xs text-slate-600">General</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-slate-400 text-sm">
                <span className="flex items-center gap-1"><MessageSquare className="w-4 h-4" /> 48</span>
                <span className="flex items-center gap-1"><ThumbsUp className="w-4 h-4" /> 23</span>
              </div>
            </div>
          </div>

          {/* Discussion 3 */}
          <div 
             onClick={() => navigate('/resources/community/discuss/103')}
             className="bg-white border border-slate-200 rounded-xl p-6 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                  AM
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1 hover:text-indigo-600 transition-colors">Feature Request: One-click Staging</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span>@agency_mike</span>
                    <span>•</span>
                    <span>1 day ago</span>
                    <span>•</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded-full text-xs text-slate-600">Feature Request</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-slate-400 text-sm">
                <span className="flex items-center gap-1"><MessageSquare className="w-4 h-4" /> 8</span>
                <span className="flex items-center gap-1"><ThumbsUp className="w-4 h-4" /> 41</span>
              </div>
            </div>
          </div>

        </div>
        
        <div className="mt-8 text-center">
          <button 
            onClick={() => navigate('/resources/community/forum')}
            className="text-indigo-600 font-medium hover:text-indigo-700 flex items-center justify-center gap-1 mx-auto"
          >
            View all discussions <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-slate-900 text-white py-20 text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to join the conversation?</h2>
        <div className="flex justify-center gap-4">
          <button 
            onClick={() => navigate('/signup')}
            className="bg-white text-indigo-600 font-bold py-3 px-8 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Sign Up Free
          </button>
          <button 
            onClick={() => setIsGuidelinesOpen(true)}
            className="bg-slate-800 text-white font-bold py-3 px-8 rounded-xl border border-slate-700 hover:bg-slate-700 transition-colors"
          >
            Read Guidelines
          </button>
        </div>
      </div>

    </div>
  );
};