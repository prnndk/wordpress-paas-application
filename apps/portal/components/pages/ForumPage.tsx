import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, MessageSquare, Plus, Filter, 
  CheckCircle2, Clock, User, ChevronRight, Hash 
} from 'lucide-react';

// Mock Data for Forum Threads
export const MOCK_THREADS = [
  {
    id: '101',
    title: "How to configure Redis Object Cache properly?",
    author: "alexdev",
    avatar: "AD",
    category: "Support",
    replies: 12,
    views: 342,
    lastActive: "2 hours ago",
    isSolved: true,
    tags: ["redis", "performance", "caching"]
  },
  {
    id: '102',
    title: "Benchmark: WPCube vs DigitalOcean Droplets",
    author: "wpspeed",
    avatar: "WS",
    category: "General",
    replies: 48,
    views: 1205,
    lastActive: "5 hours ago",
    isSolved: false,
    tags: ["benchmark", "comparison"]
  },
  {
    id: '103',
    title: "Feature Request: One-click Staging Environments",
    author: "agency_mike",
    avatar: "AM",
    category: "Features",
    replies: 8,
    views: 156,
    lastActive: "1 day ago",
    isSolved: false,
    tags: ["staging", "workflow"]
  },
  {
    id: '104',
    title: "Error 502 Bad Gateway during heavy traffic spikes",
    author: "sarah_j",
    avatar: "SJ",
    category: "Support",
    replies: 24,
    views: 890,
    lastActive: "2 days ago",
    isSolved: true,
    tags: ["nginx", "error", "scaling"]
  },
  {
    id: '105',
    title: "Showcase: Migrated a 50k SKU WooCommerce store",
    author: "ecom_wizard",
    avatar: "EW",
    category: "Showcase",
    replies: 15,
    views: 440,
    lastActive: "3 days ago",
    isSolved: false,
    tags: ["woocommerce", "migration"]
  },
  {
    id: '106',
    title: "Best practices for securing wp-config.php in containers",
    author: "sec_guru",
    avatar: "SG",
    category: "Security",
    replies: 6,
    views: 210,
    lastActive: "4 days ago",
    isSolved: true,
    tags: ["security", "docker"]
  }
];

export const ForumPage: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredThreads = MOCK_THREADS.filter(thread => {
    const matchesCategory = filter === 'All' || thread.category === filter;
    const matchesSearch = thread.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = ['All', 'Support', 'General', 'Features', 'Security', 'Showcase'];

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Support': return 'bg-rose-100 text-rose-700';
      case 'Features': return 'bg-purple-100 text-purple-700';
      case 'Security': return 'bg-blue-100 text-blue-700';
      case 'Showcase': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-900 pb-20">
      
      {/* Header Banner */}
      <div className="bg-indigo-900 text-white pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4">Community Forum</h1>
          <p className="text-indigo-200 text-lg max-w-2xl mx-auto">
            The central hub for discussions, support, and sharing knowledge with the WPCube community.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 md:p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Search */}
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search discussions..."
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative">
              <select 
                className="appearance-none bg-white border border-slate-200 text-slate-700 py-2.5 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium cursor-pointer"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                <Filter className="h-4 w-4" />
              </div>
            </div>
            
            <button className="flex-1 md:flex-none inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm gap-2">
              <Plus className="w-4 h-4" /> New Discussion
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-8">
          
          {/* Forum List */}
          <div className="lg:col-span-3 space-y-4">
            {filteredThreads.map((thread) => (
              <div 
                key={thread.id}
                onClick={() => navigate(`/resources/community/discuss/${thread.id}`)}
                className="bg-white border border-slate-200 rounded-xl p-6 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  
                  {/* Avatar / Votes */}
                  <div className="flex-shrink-0 flex flex-col items-center gap-1 min-w-[3rem]">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm border border-slate-200">
                      {thread.avatar}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${getCategoryColor(thread.category)}`}>
                        {thread.category}
                      </span>
                      {thread.isSolved && (
                        <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                          <CheckCircle2 className="w-3 h-3" /> Solved
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-2 line-clamp-1">
                      {thread.title}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1 hover:text-slate-700">
                        <User className="w-3.5 h-3.5" /> {thread.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {thread.lastActive}
                      </span>
                      <div className="flex gap-2">
                         {thread.tags.map(tag => (
                           <span key={tag} className="flex items-center text-xs text-slate-400">
                             <Hash className="w-3 h-3 text-slate-300" />{tag}
                           </span>
                         ))}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex flex-col items-end gap-1 min-w-[4rem] text-right">
                    <div className="flex items-center gap-1.5 font-bold text-slate-700">
                      <MessageSquare className="w-4 h-4 text-slate-400" /> {thread.replies}
                    </div>
                    <div className="text-xs text-slate-400">
                      {thread.views} views
                    </div>
                  </div>

                  <div className="sm:hidden flex items-center self-center text-slate-300">
                    <ChevronRight className="w-5 h-5" />
                  </div>

                </div>
              </div>
            ))}
            
            {filteredThreads.length === 0 && (
               <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
                  <p className="text-slate-500">No discussions found matching your criteria.</p>
                  <button onClick={() => {setFilter('All'); setSearchQuery('');}} className="mt-2 text-indigo-600 font-bold text-sm">Clear Filters</button>
               </div>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4">Forum Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Members</span>
                  <span className="font-medium text-slate-900">5,432</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Threads</span>
                  <span className="font-medium text-slate-900">1,204</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Solution Rate</span>
                  <span className="font-medium text-green-600">88%</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl p-6 text-white shadow-md">
              <h3 className="font-bold mb-2">Need faster answers?</h3>
              <p className="text-indigo-100 text-sm mb-4">
                Pro and Enterprise plans include priority support with guaranteed response times.
              </p>
              <button onClick={() => navigate('/pricing')} className="w-full bg-white text-indigo-600 text-sm font-bold py-2 rounded-lg hover:bg-indigo-50 transition-colors">
                Upgrade Plan
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};