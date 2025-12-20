import React, { useState } from 'react';
import { ArrowRight, Mail, Clock, Tag } from 'lucide-react';

export const BlogPage: React.FC = () => {
  const posts = [
    {
      title: "Optimizing PHP-FPM for High Traffic",
      excerpt: "Learn how to tune your process manager settings to handle concurrent requests without eating up all your RAM.",
      category: "Engineering",
      readTime: "8 min read",
      image: "https://images.unsplash.com/photo-1555099962-4199c345e5dd?auto=format&fit=crop&q=80&w=800"
    },
    {
      title: "Why we chose Nginx over Apache",
      excerpt: "A deep dive into our edge architecture and why event-driven architecture matters for WordPress performance.",
      category: "Infrastructure",
      readTime: "6 min read",
      image: "https://images.unsplash.com/photo-1558494949-ef526b0042a0?auto=format&fit=crop&q=80&w=800"
    },
    {
      title: "WPCube vs. Traditional Hosting: A Benchmark",
      excerpt: "We ran load tests against Shared, VPS, and Managed WP hosts. The results were surprising.",
      category: "Case Study",
      readTime: "12 min read",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800"
    },
    {
      title: "Secure your WordPress site with Content Security Policy",
      excerpt: "XSS attacks are common. Learn how to implement a strict CSP header without breaking your plugins.",
      category: "Security",
      readTime: "10 min read",
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=800"
    },
    {
      title: "Scaling WooCommerce for Black Friday",
      excerpt: "Prepare your store for the biggest sale of the year with our auto-scaling strategies.",
      category: "E-Commerce",
      readTime: "7 min read",
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&q=80&w=800"
    },
    {
      title: "The Future of WordPress: Block Themes & FSE",
      excerpt: "How full site editing is changing the way agencies build themes and what it means for performance.",
      category: "Product",
      readTime: "5 min read",
      image: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?auto=format&fit=crop&q=80&w=800"
    }
  ];

  return (
    <div className="bg-white font-sans text-slate-900">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Engineering Blog</h1>
        <p className="text-lg text-slate-600 mb-12">Insights, tutorials, and updates from the WPCube team.</p>

        {/* Featured Post */}
        <div className="relative rounded-3xl overflow-hidden bg-slate-900 aspect-[2/1] md:aspect-[2.5/1] mb-20 group cursor-pointer">
          <img 
            src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1600" 
            alt="Featured" 
            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-50 group-hover:scale-105 transition-all duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-8 md:p-12 max-w-3xl">
            <div className="flex items-center gap-3 text-indigo-400 text-sm font-bold uppercase tracking-wider mb-4">
              <Tag className="w-4 h-4" /> Engineering
              <span className="w-1 h-1 rounded-full bg-slate-500"></span>
              <Clock className="w-4 h-4" /> 5 min read
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
              How we scaled to 1 Million Requests using Docker Swarm
            </h2>
            <p className="text-slate-300 text-lg mb-6 line-clamp-2 md:line-clamp-none">
              A detailed look at our load balancer configuration, database replication strategy, and how we handled the traffic spike during our Product Hunt launch.
            </p>
            <span className="inline-flex items-center text-white font-bold group-hover:gap-2 transition-all">
              Read Article <ArrowRight className="ml-2 w-5 h-5" />
            </span>
          </div>
        </div>

        {/* Article Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {posts.map((post, idx) => (
            <div key={idx} className="group cursor-pointer flex flex-col h-full">
              <div className="rounded-xl overflow-hidden mb-5 aspect-video relative bg-slate-100">
                <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-900 uppercase tracking-wide">
                  {post.category}
                </div>
              </div>
              <div className="flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-slate-600 text-sm mb-4 line-clamp-3 flex-1">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                  <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {post.readTime}
                  </span>
                  <span className="text-indigo-600 text-sm font-bold flex items-center opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0">
                    Read <ArrowRight className="ml-1 w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Newsletter */}
      <div className="bg-indigo-900 py-20 px-4 mt-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-800 rounded-xl mb-6">
            <Mail className="w-6 h-6 text-indigo-300" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Get engineering tips straight to your inbox.</h2>
          <p className="text-indigo-200 mb-8 max-w-xl mx-auto">
            Join 15,000+ developers who receive our weekly newsletter on WordPress performance, DevOps, and cloud infrastructure.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="flex-1 px-5 py-3 rounded-xl border border-transparent focus:ring-2 focus:ring-white/20 bg-indigo-800 text-white placeholder-indigo-400 outline-none transition-all"
            />
            <button className="px-6 py-3 rounded-xl bg-white text-indigo-900 font-bold hover:bg-indigo-50 transition-colors">
              Subscribe
            </button>
          </form>
          <p className="text-xs text-indigo-400 mt-4">No spam, unsubscribe anytime.</p>
        </div>
      </div>

    </div>
  );
};