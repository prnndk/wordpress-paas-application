import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Lock, Server, Network, FileCheck, 
  ArrowRight, ChevronRight, Download
} from 'lucide-react';

export const SecurityWhitepaperPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('intro');

  const sections = [
    { id: 'intro', label: 'Architecture Overview' },
    { id: 'isolation', label: 'Container Isolation' },
    { id: 'network', label: 'Network Security' },
    { id: 'data', label: 'Data Protection' },
    { id: 'compliance', label: 'Compliance & Audit' },
  ];

  // Scroll spy for active TOC
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element && element.offsetTop <= scrollPosition && (element.offsetTop + element.offsetHeight) > scrollPosition) {
          setActiveSection(section.id);
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({ top: element.offsetTop - 100, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-white font-sans text-slate-900">
      
      {/* Header */}
      <div className="bg-slate-900 text-white pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-wide mb-6">
              <ShieldCheck className="w-3 h-3" /> Technical Whitepaper
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
              WPCube Security Architecture: <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Zero-Trust by Design</span>
            </h1>
            <p className="text-xl text-slate-400 leading-relaxed mb-8">
              A deep dive into how we secure, isolate, and monitor high-performance WordPress infrastructure at scale.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="flex items-center gap-2 bg-white text-slate-900 px-5 py-3 rounded-lg font-bold hover:bg-slate-100 transition-colors">
                <Download className="w-4 h-4" /> Download PDF
              </button>
              <button 
                onClick={() => navigate('/enterprise/contact')}
                className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-lg font-bold hover:bg-indigo-500 transition-colors"
              >
                Contact Security Team
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="lg:grid lg:grid-cols-12 gap-12">
          
          {/* Sticky Sidebar */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-32">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 pl-3">Table of Contents</h4>
              <nav className="space-y-1 border-l border-slate-200">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollTo(section.id)}
                    className={`block w-full text-left px-4 py-2 text-sm font-medium transition-all border-l-2 -ml-[2px] ${
                      activeSection === section.id
                        ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                        : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    {section.label}
                  </button>
                ))}
              </nav>
              
              <div className="mt-12 bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h5 className="font-bold text-slate-900 mb-2">Enterprise Security</h5>
                <p className="text-sm text-slate-600 mb-4">
                  Need a custom security review or penetration test report?
                </p>
                <button 
                  onClick={() => navigate('/enterprise/contact')}
                  className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  Contact Sales <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-9 prose prose-slate prose-lg max-w-none">
            
            {/* Intro */}
            <section id="intro" className="scroll-mt-32 mb-16">
              <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900 mb-6">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><Server className="w-6 h-6" /></div>
                Architecture Overview
              </h2>
              <p>
                Security is not an afterthought at WPCube; it is the foundation of our orchestration engine. 
                Traditional shared hosting relies on user-level permissions to separate sites, which has historically led to cross-site contamination vulnerabilities (e.g., symlink attacks).
              </p>
              <p>
                WPCube adopts a <strong>Zero-Trust architecture</strong>. We assume that any workload could be compromised and design our infrastructure to contain the blast radius to a single ephemeral container.
              </p>
            </section>

            <hr className="border-slate-100 my-12" />

            {/* Container Isolation */}
            <section id="isolation" className="scroll-mt-32 mb-16">
              <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Lock className="w-6 h-6" /></div>
                Kernel-Level Container Isolation
              </h2>
              <p>
                Every WordPress site provisioned on WPCube runs inside its own dedicated container environment. We utilize Linux Kernel features to ensure strict boundaries between tenants.
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-8">
                <li className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <strong className="block text-slate-900 mb-1">Namespaces</strong>
                  <span className="text-sm text-slate-600">Provide processes with their own view of the system (PID, Mount, Network), ensuring they cannot see or interact with other tenants.</span>
                </li>
                <li className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <strong className="block text-slate-900 mb-1">Control Groups (cgroups)</strong>
                  <span className="text-sm text-slate-600">Enforce resource limits (CPU/RAM) to prevent "noisy neighbor" effects and Denial of Service from resource exhaustion.</span>
                </li>
                <li className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <strong className="block text-slate-900 mb-1">Seccomp Profiles</strong>
                  <span className="text-sm text-slate-600">Restrict the system calls a container can make to the kernel, reducing the attack surface significantly.</span>
                </li>
                <li className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <strong className="block text-slate-900 mb-1">Read-Only Root FS</strong>
                  <span className="text-sm text-slate-600">The core OS filesystem is mounted read-only. Malware cannot persist in system directories even if it gains execution rights.</span>
                </li>
              </ul>
            </section>

            <hr className="border-slate-100 my-12" />

            {/* Network Security */}
            <section id="network" className="scroll-mt-32 mb-16">
              <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><Network className="w-6 h-6" /></div>
                Network Security & Edge Defense
              </h2>
              <p>
                Our network topology is designed to deny traffic by default. Services communicate over an encrypted mesh network.
              </p>
              
              <h3 className="text-lg font-bold text-slate-900 mt-8 mb-4">Edge Firewall (WAF)</h3>
              <p>
                Before traffic reaches your WordPress container, it passes through our global edge network which inspects packets for:
              </p>
              <ul>
                <li><strong>SQL Injection (SQLi)</strong> and Cross-Site Scripting (XSS) patterns.</li>
                <li><strong>Distributed Denial of Service (DDoS)</strong> attacks at Layer 3, 4, and 7.</li>
                <li>Malicious User Agents and Botnets.</li>
              </ul>

              <h3 className="text-lg font-bold text-slate-900 mt-8 mb-4">Encrypted Mesh Networking</h3>
              <p>
                Traffic between the Load Balancer, WordPress App Container, and Database Container travels over a private Virtual Private Cloud (VPC). 
                Furthermore, we utilize mTLS (mutual TLS) to encrypt and authenticate all east-west traffic within the cluster.
              </p>
            </section>

            <hr className="border-slate-100 my-12" />

            {/* Data Protection */}
            <section id="data" className="scroll-mt-32 mb-16">
              <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900 mb-6">
                <div className="p-2 bg-green-100 rounded-lg text-green-600"><Lock className="w-6 h-6" /></div>
                Data Encryption
              </h2>
              <p>
                We employ industry-standard encryption protocols to protect your data throughout its lifecycle.
              </p>
              <div className="overflow-hidden bg-slate-900 rounded-xl shadow-lg border border-slate-800 text-slate-300 my-8 not-prose">
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-700">
                  <div className="p-6">
                    <h4 className="text-white font-bold text-lg mb-2">Encryption at Rest</h4>
                    <p className="text-sm leading-relaxed mb-4">
                      All persistent storage volumes (NVMe SSDs) and database backups are encrypted using <strong>AES-256</strong> (Advanced Encryption Standard). Keys are managed via a hardware security module (HSM).
                    </p>
                    <span className="text-xs bg-slate-800 px-2 py-1 rounded text-indigo-400 font-mono">Algorithm: AES-256-GCM</span>
                  </div>
                  <div className="p-6">
                    <h4 className="text-white font-bold text-lg mb-2">Encryption in Transit</h4>
                    <p className="text-sm leading-relaxed mb-4">
                      All public-facing endpoints enforce <strong>TLS 1.3</strong>. We automatically provision and renew Let's Encrypt SSL certificates for all customer domains.
                    </p>
                    <span className="text-xs bg-slate-800 px-2 py-1 rounded text-indigo-400 font-mono">Protocol: TLS 1.2+</span>
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-slate-100 my-12" />

            {/* Compliance */}
            <section id="compliance" className="scroll-mt-32 mb-16">
              <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900 mb-6">
                <div className="p-2 bg-orange-100 rounded-lg text-orange-600"><FileCheck className="w-6 h-6" /></div>
                Compliance & Standards
              </h2>
              <p>
                WPCube is built to meet the rigorous standards of modern enterprises.
              </p>
              <ul className="space-y-4 my-6">
                <li><strong>SOC 2 Type II:</strong> We are currently in the observation period for SOC 2 Type II attestation.</li>
                <li><strong>GDPR:</strong> We provide Data Processing Agreements (DPA) and offer EU-only data residency options (Frankfurt, Paris) to ensure compliance with European data privacy laws.</li>
                <li><strong>PCI-DSS:</strong> Our infrastructure provider is PCI-DSS Level 1 certified. While we do not process payments directly on your WP instance, our environment supports compliant e-commerce implementations.</li>
              </ul>
            </section>

          </main>
        </div>
      </div>

      {/* Footer Banner */}
      <div className="bg-indigo-900 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Security is a process, not a product.</h2>
          <p className="text-indigo-200 mb-8">
            Do you have specific security requirements or need to complete a vendor risk assessment?
          </p>
          <button 
            onClick={() => navigate('/enterprise/contact')}
            className="bg-white text-indigo-900 font-bold py-3 px-8 rounded-xl hover:bg-indigo-50 transition-colors shadow-lg inline-flex items-center gap-2"
          >
            Contact Enterprise Security <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};