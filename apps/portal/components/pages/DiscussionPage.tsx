import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, MessageSquare, ThumbsUp, CheckCircle2, 
  MoreHorizontal, Share2, Flag, User, Clock, Check
} from 'lucide-react';
import { MOCK_THREADS } from './ForumPage';

// Simulated database for replies
const MOCK_REPLIES = {
  '101': [
    {
      id: 'r1',
      author: 'sarah_j',
      avatar: 'SJ',
      role: 'Moderator',
      content: "Hi Alex! WPCube Pro plans come with a pre-configured Redis container. You just need to define `WP_REDIS_HOST` as `redis` in your `wp-config.php`. The port is standard 6379.",
      timestamp: "2 hours ago",
      votes: 15,
      isBestAnswer: true
    },
    {
      id: 'r2',
      author: 'alexdev',
      avatar: 'AD',
      role: 'Member',
      content: "Wow, that was it! I was trying to use localhost. Thanks Sarah, it's flying now! 🚀",
      timestamp: "1 hour ago",
      votes: 3,
      isBestAnswer: false
    }
  ],
  'default': [
    {
      id: 'r_def',
      author: 'community_bot',
      avatar: 'CB',
      role: 'Bot',
      content: "This is a simulated reply for this demo thread. In a real application, you would see actual user responses here.",
      timestamp: "Just now",
      votes: 0,
      isBestAnswer: false
    }
  ]
};

export const DiscussionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [thread, setThread] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [newReply, setNewReply] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Simulate API fetch
    const foundThread = MOCK_THREADS.find(t => t.id === id);
    if (foundThread) {
      setThread(foundThread);
      // @ts-ignore
      setReplies(MOCK_REPLIES[id] || MOCK_REPLIES['default']);
    }
    window.scrollTo(0,0);
  }, [id]);

  const handlePostReply = () => {
    if (!newReply.trim()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      const reply = {
        id: `r_${Date.now()}`,
        author: 'Demo User',
        avatar: 'DU',
        role: 'Member',
        content: newReply,
        timestamp: "Just now",
        votes: 0,
        isBestAnswer: false
      };
      setReplies([...replies, reply]);
      setNewReply('');
      setIsSubmitting(false);
    }, 800);
  };

  if (!thread) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900">Thread Not Found</h2>
          <button onClick={() => navigate('/resources/community/forum')} className="text-indigo-600 font-bold mt-4 hover:underline">
            Back to Forum
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-900 pb-20">
      
      {/* Breadcrumb Nav */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center">
          <Link to="/resources/community/forum" className="text-slate-500 hover:text-indigo-600 flex items-center gap-1 text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Discussions
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Main Thread Header */}
        <div className="mb-8">
          <div className="flex gap-3 mb-4">
             <span className="bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wide">
               {thread.category}
             </span>
             {thread.isSolved && (
                <span className="bg-green-100 text-green-700 px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                  <Check className="w-3 h-3" /> Solved
                </span>
             )}
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-4 leading-tight">{thread.title}</h1>
          <div className="flex items-center gap-4 text-sm text-slate-500 pb-6 border-b border-slate-200">
            <span className="flex items-center gap-1.5">
               <User className="w-4 h-4" /> Posted by <span className="font-bold text-slate-700">{thread.author}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
               <Clock className="w-4 h-4" /> {thread.lastActive}
            </span>
            <span>•</span>
            <span>{thread.views} views</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Left Column: Posts */}
          <div className="md:col-span-9 space-y-6">
            
            {/* Original Post */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-6 md:p-8">
                 <div className="prose prose-slate max-w-none mb-8">
                   <p className="text-lg leading-relaxed">
                     I'm setting up a new WPCube Pro instance and I want to ensure my object cache is working correctly. 
                     I see the Redis container is running in the dashboard, but how do I connect WordPress to it?
                   </p>
                   <p>
                     Do I need to use <code>127.0.0.1</code> or is there an internal hostname? Also, what port should I use?
                   </p>
                   <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm font-mono overflow-x-auto">
{`// wp-config.php
define( 'WP_REDIS_HOST', '???' );
define( 'WP_REDIS_PORT', '6379' );`}
                   </pre>
                 </div>
                 
                 <div className="flex justify-between items-center pt-6 border-t border-slate-100">
                    <button className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium">
                       <ThumbsUp className="w-4 h-4" /> Upvote (5)
                    </button>
                    <div className="flex gap-4">
                       <button className="text-slate-400 hover:text-slate-600"><Share2 className="w-4 h-4" /></button>
                       <button className="text-slate-400 hover:text-slate-600"><Flag className="w-4 h-4" /></button>
                    </div>
                 </div>
               </div>
            </div>

            {/* Replies Header */}
            <div className="flex items-center gap-2 text-slate-900 font-bold text-lg pt-4">
               <MessageSquare className="w-5 h-5 text-indigo-600" /> {replies.length} Replies
            </div>

            {/* Replies List */}
            <div className="space-y-6">
              {replies.map((reply) => (
                <div 
                  key={reply.id} 
                  className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
                    reply.isBestAnswer ? 'border-green-300 ring-4 ring-green-50 shadow-md' : 'border-slate-200'
                  }`}
                >
                  {reply.isBestAnswer && (
                    <div className="bg-green-50 px-6 py-2 border-b border-green-100 flex items-center gap-2 text-green-700 text-sm font-bold">
                      <CheckCircle2 className="w-4 h-4" /> Best Answer
                    </div>
                  )}
                  
                  <div className="p-6 md:p-8">
                    <div className="flex items-start gap-4 mb-4">
                       <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm border border-slate-200">
                          {reply.avatar}
                       </div>
                       <div>
                          <div className="flex items-center gap-2">
                             <span className="font-bold text-slate-900">{reply.author}</span>
                             {reply.role !== 'Member' && (
                               <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">{reply.role}</span>
                             )}
                          </div>
                          <div className="text-xs text-slate-500">{reply.timestamp}</div>
                       </div>
                    </div>

                    <div className="prose prose-slate prose-sm max-w-none mb-6">
                       <p>{reply.content}</p>
                    </div>

                    <div className="flex justify-between items-center">
                       <button className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium">
                          <ThumbsUp className="w-4 h-4" /> {reply.votes} Helpful
                       </button>
                       <button className="text-slate-400 hover:text-slate-600">
                          <MoreHorizontal className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Input */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mt-8">
               <h3 className="font-bold text-slate-900 mb-4">Leave a reply</h3>
               <textarea 
                 rows={4}
                 className="w-full border border-slate-200 rounded-lg p-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-y"
                 placeholder="Type your response here... (Markdown supported)"
                 value={newReply}
                 onChange={(e) => setNewReply(e.target.value)}
               ></textarea>
               <div className="flex justify-end mt-4">
                  <button 
                    onClick={handlePostReply}
                    disabled={isSubmitting || !newReply.trim()}
                    className={`bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors shadow-sm ${
                      (isSubmitting || !newReply.trim()) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? 'Posting...' : 'Post Reply'}
                  </button>
               </div>
            </div>

          </div>

          {/* Right Sidebar */}
          <div className="md:col-span-3 space-y-6">
             <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm sticky top-36">
                <h3 className="font-bold text-slate-900 mb-4">Thread Stats</h3>
                <div className="space-y-4 text-sm">
                   <div className="flex justify-between">
                      <span className="text-slate-500">Created</span>
                      <span className="font-medium">{thread.lastActive}</span>
                   </div>
                   <div className="flex justify-between">
                      <span className="text-slate-500">Replies</span>
                      <span className="font-medium">{replies.length}</span>
                   </div>
                   <div className="flex justify-between">
                      <span className="text-slate-500">Participants</span>
                      <span className="font-medium">2</span>
                   </div>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-100">
                   <button className="w-full border border-slate-300 text-slate-700 font-bold py-2 rounded-lg hover:bg-slate-50 transition-colors text-sm">
                      Subscribe to Updates
                   </button>
                </div>
             </div>
          </div>

        </div>

      </div>
    </div>
  );
};