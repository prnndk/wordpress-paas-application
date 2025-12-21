import React from 'react';
import { 
  Github, Linkedin, Twitter, 
  Heart, Zap, Shield, Search 
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="bg-white font-sans text-slate-900">
      
      {/* Hero */}
      <div className="relative py-24 lg:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-tight">
            We are democratizing cloud <br className="hidden md:block" />
            infrastructure for <span className="text-indigo-600">WordPress.</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            We believe that high-performance, auto-scaling, and secure hosting shouldn't require a PhD in Kubernetes. We're building the platform we wished we had.
          </p>
        </div>
      </div>

      {/* Our Story (Timeline) */}
      <div className="py-24 bg-slate-50 border-y border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold text-indigo-600 uppercase tracking-widest">Our Journey</h2>
            <h3 className="text-3xl font-bold text-slate-900 mt-2">From frustration to solution</h3>
          </div>

          <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
            
            {/* 2021 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-indigo-600 text-slate-500 group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                <div className="text-xs font-bold">21</div>
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900">The Frustration</span>
                  <span className="text-xs font-medium text-slate-500">Late 2021</span>
                </div>
                <p className="text-slate-600 text-sm">
                  Our founders were running a high-traffic media agency. Shared hosting was too slow, and managing AWS EC2 instances manually was a nightmare. The idea for a managed container platform was born.
                </p>
              </div>
            </div>

            {/* 2022 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-indigo-600 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                <div className="text-xs font-bold">22</div>
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900">Hello World</span>
                  <span className="text-xs font-medium text-slate-500">Mid 2022</span>
                </div>
                <p className="text-slate-600 text-sm">
                  We deployed our first container on a custom Docker Swarm cluster. It was raw, command-line only, but it was fast. We invited 10 developer friends to try it out.
                </p>
              </div>
            </div>

            {/* 2023 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-indigo-600 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                <div className="text-xs font-bold">23</div>
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900">WPCube Public Beta</span>
                  <span className="text-xs font-medium text-slate-500">Early 2023</span>
                </div>
                <p className="text-slate-600 text-sm">
                  We built the dashboard UI and launched publicly. Within 3 months, we scaled to 500+ active instances and raised our seed round to expand the engineering team.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Core Values */}
      <div className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-indigo-200 hover:shadow-lg transition-all group">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-6 text-indigo-600 group-hover:scale-110 transition-transform">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Transparency</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              We build in the open. Our core orchestration logic is open-source, and our status page reflects reality, not marketing.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-indigo-200 hover:shadow-lg transition-all group">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-6 text-indigo-600 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Obsession</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Performance is not a feature; it's a requirement. We obsess over milliseconds in TTFB and database query optimization.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-indigo-200 hover:shadow-lg transition-all group">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-6 text-indigo-600 group-hover:scale-110 transition-transform">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Simplification</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Complex technology should feel simple. We hide the complexity of Docker and Kubernetes behind a beautiful, intuitive UI.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-indigo-200 hover:shadow-lg transition-all group">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-6 text-indigo-600 group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Trust</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              We treat your data like our own. Enterprise-grade security, automated backups, and compliance are standard, not upgrades.
            </p>
          </div>
        </div>
      </div>

      {/* Team */}
      <div className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-16">Meet the Builders</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {[
              { name: "Alex V.", role: "Founder & CEO", img: "https://i.pravatar.cc/300?u=alex" },
              { name: "Sarah J.", role: "CTO", img: "https://i.pravatar.cc/300?u=sarah" },
              { name: "Mike T.", role: "Lead Product Designer", img: "https://i.pravatar.cc/300?u=mike" },
              { name: "Jessica L.", role: "Head of Customer Success", img: "https://i.pravatar.cc/300?u=jess" }
            ].map((member, i) => (
              <div key={i} className="group relative">
                <div className="aspect-square rounded-2xl overflow-hidden bg-slate-200 mb-4 relative">
                  <img src={member.img} alt={member.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                  
                  {/* Social Overlay */}
                  <div className="absolute inset-0 bg-indigo-900/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                    <a href="#" className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors"><Twitter className="w-5 h-5" /></a>
                    <a href="#" className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors"><Linkedin className="w-5 h-5" /></a>
                    <a href="#" className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors"><Github className="w-5 h-5" /></a>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{member.name}</h3>
                <p className="text-sm text-indigo-600 font-medium">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};