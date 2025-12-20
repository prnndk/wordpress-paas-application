import React from 'react';
import { 
  Calendar, Tag
} from 'lucide-react';

export const ChangelogPage: React.FC = () => {
  return (
    <div className="bg-white font-sans text-slate-900">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          
          {/* Main Content: Timeline */}
          <div className="lg:col-span-3">
             <div className="mb-12">
               <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Product Updates</h1>
               <p className="text-lg text-slate-600">New features, fixes, and improvements.</p>
             </div>

             <div className="relative border-l-2 border-slate-100 ml-4 md:ml-6 space-y-16">
                
                {/* Entry 1 */}
                <div className="relative pl-8 md:pl-12">
                   <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-green-500 border-4 border-white shadow-sm"></div>
                   
                   <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                      <span className="text-sm font-mono text-slate-400 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> This Week
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                        v2.1.0
                      </span>
                   </div>
                   
                   <h2 className="text-2xl font-bold text-slate-900 mb-4">Two-Factor Authentication & IP Whitelisting</h2>
                   <div className="prose prose-slate max-w-none text-slate-600">
                     <p>
                       Security is paramount. You can now secure your WPCube account with 2FA apps like Authy or Google Authenticator. 
                       We have also added the ability to limit database access to specific IP ranges, giving you granular control over who can connect to your MySQL instances.
                     </p>
                     <img 
                       src="https://placehold.co/600x300/f1f5f9/94a3b8?text=2FA+Dashboard+Screenshot" 
                       alt="2FA Screenshot" 
                       className="rounded-xl border border-slate-200 mt-6 shadow-sm"
                     />
                   </div>
                </div>

                {/* Entry 2 */}
                <div className="relative pl-8 md:pl-12">
                   <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow-sm"></div>
                   
                   <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                      <span className="text-sm font-mono text-slate-400 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Last Week
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        v2.0.5
                      </span>
                   </div>
                   
                   <h2 className="text-2xl font-bold text-slate-900 mb-4">Redis Object Cache Enabled by Default</h2>
                   <div className="prose prose-slate max-w-none text-slate-600">
                     <p>
                       Performance boost unlocked! All new Pro instances now come with a dedicated Redis container linked automatically. 
                       We've pre-configured the connection strings in `wp-config.php`, so you just need to enable your favorite caching plugin.
                     </p>
                   </div>
                </div>

                {/* Entry 3 */}
                <div className="relative pl-8 md:pl-12">
                   <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-purple-500 border-4 border-white shadow-sm"></div>
                   
                   <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                      <span className="text-sm font-mono text-slate-400 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Last Month
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                        v2.0.0
                      </span>
                   </div>
                   
                   <h2 className="text-2xl font-bold text-slate-900 mb-4">Introducing Team Workspaces</h2>
                   <div className="prose prose-slate max-w-none text-slate-600">
                     <p>
                       Collaborate with your team more effectively. You can now invite members, assign specific roles (Admin, Developer, Viewer), and manage billing centrally for the whole organization.
                     </p>
                     <ul className="list-disc pl-5 mt-4 space-y-2">
                       <li>Unlimited team members on Enterprise plans</li>
                       <li>Role-based access control (RBAC)</li>
                       <li>Unified audit trail</li>
                     </ul>
                   </div>
                </div>

             </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-slate-400" /> Coming Soon
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-slate-300 mt-2"></div>
                    <span className="text-slate-600 text-sm">One-click Staging Environments</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-slate-300 mt-2"></div>
                    <span className="text-slate-600 text-sm">Deep Git Integration (BitBucket/GitLab)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-slate-300 mt-2"></div>
                    <span className="text-slate-600 text-sm">WPCube CLI Tool v1.0</span>
                  </li>
                </ul>
              </div>
              
              <div className="mt-8 bg-indigo-600 rounded-2xl p-6 text-white text-center">
                 <h4 className="font-bold mb-2">Have a feature request?</h4>
                 <p className="text-sm text-indigo-100 mb-4">Join our community Discord and let us know.</p>
                 <button className="bg-white text-indigo-600 text-sm font-bold py-2 px-4 rounded-lg w-full">Join Discord</button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};