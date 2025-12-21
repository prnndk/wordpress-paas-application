import React, { useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Shield, Scale, Cookie, 
  Activity, Lock, Download, Printer, ExternalLink,
  CheckCircle2, FileText
} from 'lucide-react';

// --- Legal Content Data ---

const LEGAL_CONTENT = {
  privacy: {
    id: 'privacy',
    title: 'Privacy Policy',
    updatedAt: 'November 15, 2023',
    icon: Shield,
    content: (
      <>
        <p className="lead text-lg text-slate-600 mb-6">
          At WPCube, we prioritize the privacy of your data. This policy outlines how WPCube Inc. ("we", "us", or "our") collects, protects, and uses the personally identifiable information ("Personal Data") you provide on our platform.
        </p>

        <h3>1. Data Collection</h3>
        <p>We collect data to provide, secure, and improve our services.</p>
        <ul className="list-disc pl-5 space-y-2 mb-6">
          <li><strong>Account Information:</strong> When you register, we collect your full name, email address, and company details.</li>
          <li><strong>Billing Data:</strong> Payment details are collected via our payment processor (Stripe). WPCube does <em>not</em> store raw credit card numbers on our servers.</li>
          <li><strong>Infrastructure Logs:</strong> We collect server logs including IP addresses, User-Agents, and request timestamps for security auditing and DDoS mitigation.</li>
          <li><strong>Container Data:</strong> While we host your WordPress containers, we do not access the content within them (files, databases) unless explicitly authorized by you for support purposes.</li>
        </ul>

        <h3>2. Usage of Data</h3>
        <p>Your data is used strictly for:</p>
        <ul className="list-disc pl-5 space-y-2 mb-6">
          <li>Provisioning and managing your Docker containers.</li>
          <li>Sending transactional emails (invoices, password resets, downtime alerts).</li>
          <li>Detecting and preventing fraudulent activity or abuse of our Acceptable Use Policy.</li>
        </ul>

        <h3>3. Third-Party Subprocessors</h3>
        <p>We share data with specific third-party vendors required to operate our infrastructure:</p>
        <div className="overflow-x-auto mb-6">
          <table className="min-w-full text-left text-sm border border-slate-200 mt-4">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 font-semibold border-b">Vendor</th>
                <th className="p-3 font-semibold border-b">Purpose</th>
                <th className="p-3 font-semibold border-b">Location</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="p-3 border-b">Amazon Web Services (AWS)</td><td className="p-3 border-b">Cloud Infrastructure & S3 Backups</td><td className="p-3 border-b">US / EU / APAC</td></tr>
              <tr><td className="p-3 border-b">Stripe</td><td className="p-3 border-b">Payment Processing</td><td className="p-3 border-b">USA</td></tr>
              <tr><td className="p-3 border-b">Postmark</td><td className="p-3 border-b">Transactional Email Delivery</td><td className="p-3 border-b">USA</td></tr>
              <tr><td className="p-3 border-b">Intercom</td><td className="p-3 border-b">Customer Support Chat</td><td className="p-3 border-b">USA</td></tr>
            </tbody>
          </table>
        </div>

        <h3>4. User Rights (GDPR & CCPA)</h3>
        <p>
          You have the right to request access to, correction of, or deletion of your Personal Data. 
          To exercise these rights, please submit a ticket via the Dashboard or email <a href="mailto:privacy@wpcube.io" className="text-indigo-600 underline">privacy@wpcube.io</a>.
        </p>
      </>
    )
  },
  terms: {
    id: 'terms',
    title: 'Terms of Service',
    updatedAt: 'October 1, 2023',
    icon: Scale,
    content: (
      <>
        <p className="lead text-lg text-slate-600 mb-6">
          These Terms of Service ("Terms") govern your access to and use of WPCube's container orchestration platform. By creating an account, you agree to these Terms.
        </p>

        <h3>1. Account Eligibility</h3>
        <p>
          You must be at least 18 years old to use the Service. You are responsible for maintaining the security of your account credentials. 
          WPCube is not liable for any loss or damage arising from your failure to protect your password or API keys.
        </p>

        <h3>2. Payment Terms</h3>
        <p>
          <strong>Subscriptions:</strong> Services are billed in advance on a monthly or yearly basis.
          <br/>
          <strong>Overage:</strong> Bandwidth or storage usage exceeding your plan limits may incur additional charges at a rate of $0.10/GB, billed at the end of the cycle.
          <br/>
          <strong>Refunds:</strong> We offer a 14-day money-back guarantee for new customers. Beyond this period, refunds are processed at our sole discretion.
        </p>

        <h3>3. Acceptable Use Policy (AUP)</h3>
        <p>You agree not to use WPCube for:</p>
        <ul className="list-disc pl-5 space-y-2 mb-4">
          <li>Hosting malicious content, malware, phishing sites, or pirated software.</li>
          <li>Cryptocurrency mining or excessive CPU-burning tasks unrelated to serving web requests.</li>
          <li>Sending unsolicited bulk email (SPAM).</li>
          <li>Port scanning or probing external networks.</li>
        </ul>
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-700 text-sm font-medium">
            Violation of the AUP will result in immediate termination of your instances without refund.
          </p>
        </div>

        <h3>4. Limitation of Liability</h3>
        <p>
          WPCube provides the service "AS IS". While we strive for perfection, we do not warrant that the service will be uninterrupted or error-free. 
          Our liability is limited to the amount you paid us in the 12 months preceding the claim.
        </p>

        <h3>5. Termination</h3>
        <p>
          You may terminate your account at any time via the Dashboard settings. Upon termination, all your data (containers, volumes, backups) will be permanently deleted after a 7-day grace period.
        </p>
      </>
    )
  },
  cookies: {
    id: 'cookies',
    title: 'Cookie Policy',
    updatedAt: 'August 20, 2023',
    icon: Cookie,
    content: (
      <>
        <p className="lead text-lg text-slate-600 mb-6">
          WPCube uses cookies to distinguish you from other users of our website. This helps us provide you with a seamless experience when you browse our dashboard.
        </p>

        <h3>1. What are cookies?</h3>
        <p>
          Cookies are small text files that are stored on your browser or the hard drive of your computer. They contain information that is transferred to your computer's hard drive.
        </p>

        <h3>2. Types of Cookies We Use</h3>
        <div className="space-y-4 mt-4 mb-6">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="font-bold text-slate-900">Strictly Necessary Cookies</h4>
            <p className="text-sm text-slate-600 mt-1">
              Required for the operation of our dashboard (e.g., handling authentication sessions via <code>wpcube_auth</code> token). You cannot opt-out of these.
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="font-bold text-slate-900">Analytical/Performance Cookies</h4>
            <p className="text-sm text-slate-600 mt-1">
              Allow us to recognize and count the number of visitors (Google Analytics). This helps us improve the way our website works.
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="font-bold text-slate-900">Functionality Cookies</h4>
            <p className="text-sm text-slate-600 mt-1">
              Used to recognize you when you return to our website (e.g., remembering your preference for Light/Dark mode).
            </p>
          </div>
        </div>

        <h3>3. Managing Cookies</h3>
        <p>
          You can block cookies by activating the setting on your browser that allows you to refuse the setting of all or some cookies. 
          However, if you use your browser settings to block all cookies (including essential cookies), you may not be able to access all or parts of our Dashboard.
        </p>
      </>
    )
  },
  sla: {
    id: 'sla',
    title: 'Service Level Agreement',
    updatedAt: 'January 1, 2024',
    icon: Activity,
    content: (
      <>
        <p className="lead text-lg text-slate-600 mb-6">
          This Service Level Agreement ("SLA") policy sets forth the uptime guarantees for the WPCube platform.
        </p>

        <h3>1. Uptime Guarantee</h3>
        <p>
          We guarantee that the WPCube Container Orchestration Plane and Edge Network will be available <strong>99.9%</strong> of the time during any monthly billing cycle.
        </p>

        <h3>2. Definition of Downtime</h3>
        <p>
          "Downtime" is defined as a period of more than 10 consecutive minutes where your running instances are unreachable due to issues within WPCube's infrastructure (Networking, Storage, or Host Nodes).
        </p>
        <p><em>Exclusions:</em> Downtime does not include issues arising from:</p>
        <ul className="list-disc pl-5 space-y-1 mb-6">
          <li>Scheduled maintenance (with 24h prior notice).</li>
          <li>Your custom code (plugins/themes) causing PHP crashes.</li>
          <li>Force majeure events (acts of God, war, extensive grid failure).</li>
        </ul>

        <h3>3. Service Credits</h3>
        <p>
          If we fail to meet the Uptime Guarantee, you are eligible for the following Service Credits:
        </p>
        <div className="overflow-x-auto mt-4 mb-6">
          <table className="min-w-full text-left text-sm border border-slate-200">
            <thead className="bg-indigo-50 text-indigo-900">
              <tr>
                <th className="p-3 font-semibold border-b border-indigo-100">Monthly Uptime Percentage</th>
                <th className="p-3 font-semibold border-b border-indigo-100">Service Credit</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="p-3 border-b">&lt; 99.9% but &ge; 99.0%</td><td className="p-3 border-b">10% of Monthly Fee</td></tr>
              <tr><td className="p-3 border-b">&lt; 99.0% but &ge; 95.0%</td><td className="p-3 border-b">25% of Monthly Fee</td></tr>
              <tr><td className="p-3 border-b">&lt; 95.0%</td><td className="p-3 border-b">100% of Monthly Fee</td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-slate-500 mt-2 bg-slate-50 p-4 rounded-lg">
          To receive a credit, you must submit a claim via the support dashboard within 30 days of the incident. Credits are applied to future invoices only.
        </p>
      </>
    )
  },
  dpa: {
    id: 'dpa',
    title: 'Data Processing Agreement',
    updatedAt: 'November 15, 2023',
    icon: Lock,
    content: (
      <>
        <p className="lead text-lg text-slate-600 mb-6">
          This Data Processing Agreement ("DPA") is an addendum to the Terms of Service and applies to enterprise customers subject to GDPR/UK-GDPR compliance requirements.
        </p>

        <h3>1. Definitions & Roles</h3>
        <ul className="list-disc pl-5 space-y-2 mb-6">
          <li><strong>Data Controller:</strong> The Customer (You), who determines the purpose and means of processing Personal Data.</li>
          <li><strong>Data Processor:</strong> WPCube, who processes Personal Data on behalf of the Controller.</li>
        </ul>

        <h3>2. Processing Activities</h3>
        <p>
          WPCube shall process Personal Data only on documented instructions from the Controller (i.e., your configuration of the dashboard and containers). 
          The duration of processing corresponds to the duration of your subscription.
        </p>

        <h3>3. Security Measures</h3>
        <p>WPCube implements appropriate technical and organizational measures to ensure security:</p>
        <div className="grid md:grid-cols-2 gap-4 mt-4 mb-6">
          <div className="bg-slate-50 p-4 border border-slate-200 rounded">
            <h4 className="font-bold text-slate-900">Encryption</h4>
            <p className="text-sm text-slate-600">All data at rest is encrypted using AES-256. Data in transit is secured via TLS 1.2+.</p>
          </div>
          <div className="bg-slate-50 p-4 border border-slate-200 rounded">
            <h4 className="font-bold text-slate-900">Access Control</h4>
            <p className="text-sm text-slate-600">Employee access to customer data is restricted via RBAC and requires 2FA + VPN.</p>
          </div>
          <div className="bg-slate-50 p-4 border border-slate-200 rounded">
            <h4 className="font-bold text-slate-900">Physical Security</h4>
            <p className="text-sm text-slate-600">Our data centers (AWS) implement biometric scanning and 24/7 surveillance.</p>
          </div>
          <div className="bg-slate-50 p-4 border border-slate-200 rounded">
            <h4 className="font-bold text-slate-900">Backup</h4>
            <p className="text-sm text-slate-600">Daily snapshots are stored off-site for disaster recovery purposes.</p>
          </div>
        </div>

        <h3>4. Data Breach Notification</h3>
        <p>
          In the event of a Personal Data breach, WPCube shall notify the Controller without undue delay (and in any event within 48 hours) after becoming aware of the breach.
        </p>
      </>
    )
  }
};

export const LegalPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Safe accessor for tab
  const activeTab = searchParams.get('tab');
  
  // Validate that the tab exists, default to 'privacy' if null or invalid
  const currentKey = (activeTab && LEGAL_CONTENT[activeTab as keyof typeof LEGAL_CONTENT]) 
    ? activeTab 
    : 'privacy';
    
  const CurrentContent = LEGAL_CONTENT[currentKey as keyof typeof LEGAL_CONTENT];

  // Utility Handlers
  const handlePrint = () => {
    window.print();
  };

  const handleOpenNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  const handleDownload = () => {
    // In a real app, this would trigger a PDF generation backend
    const element = document.createElement("a");
    const file = new Blob(
      [`WPCUBE LEGAL DOCUMENT - ${CurrentContent.title}\n\nGenerated: ${new Date().toISOString()}`], 
      {type: 'text/plain'}
    );
    element.href = URL.createObjectURL(file);
    element.download = `${currentKey}-wpcube.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Scroll to top of content area when tab changes
  useEffect(() => {
    const contentArea = document.getElementById('legal-content-area');
    if (contentArea) {
      contentArea.scrollTop = 0;
    }
    // Also window scroll for mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentKey]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Legal Hub</h1>
              <p className="text-slate-500 mt-2 text-lg">
                Transparency is our core value. Review our policies and commitments below.
              </p>
            </div>
            <button 
              onClick={() => navigate('/contact')}
              className="inline-flex items-center justify-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors"
            >
              Contact Legal Team <ArrowLeft className="ml-2 w-4 h-4 rotate-180" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Sidebar Navigation (Hidden on Print) */}
          <aside className="lg:w-72 flex-shrink-0 print:hidden">
            <nav className="space-y-1 sticky top-32">
              <p className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Documents</p>
              {Object.entries(LEGAL_CONTENT).map(([key, data]) => {
                const Icon = data.icon;
                const isActive = currentKey === key;
                return (
                  <Link
                    key={key}
                    to={`?tab=${key}`}
                    replace={true}
                    className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 group ${
                      isActive 
                        ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200' 
                        : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm'
                    }`}
                  >
                    <Icon className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-500'}`} />
                    <span className="flex-1">{data.title}</span>
                    {isActive && <CheckCircle2 className="w-4 h-4 text-indigo-600 opacity-50" />}
                  </Link>
                );
              })}

              {/* Download All Button */}
              <div className="pt-8 mt-8 border-t border-slate-200 px-3">
                <button 
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition-colors shadow-sm"
                >
                  <Download className="w-3 h-3" /> Download Current (TXT)
                </button>
              </div>
            </nav>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0" id="legal-content-area">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[600px] print:shadow-none print:border-none">
              
              {/* Content Header (Hidden on Print) */}
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 print:hidden">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{CurrentContent.title}</h2>
                  <p className="text-sm text-slate-500 mt-1">Last Updated: {CurrentContent.updatedAt}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handlePrint}
                    className="p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-indigo-50" 
                    title="Print Document"
                  >
                    <Printer className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={handleOpenNewTab}
                    className="p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-indigo-50" 
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Print Header (Visible only on Print) */}
              <div className="hidden print:block px-8 py-6 mb-8 border-b border-slate-900">
                 <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-6 h-6 text-slate-900" />
                    <span className="text-xl font-bold">WPCube Legal</span>
                 </div>
                 <h1 className="text-3xl font-bold text-slate-900">{CurrentContent.title}</h1>
                 <p className="text-sm text-slate-600">Last Updated: {CurrentContent.updatedAt}</p>
              </div>

              {/* Prose Content */}
              <div className="p-8 md:p-12 print:p-0 print:px-8">
                <article className="prose prose-slate prose-indigo max-w-none prose-headings:font-bold prose-h3:text-lg prose-h3:mt-8 prose-a:font-semibold prose-p:leading-relaxed">
                  {CurrentContent.content}
                </article>
                
                {/* Footer of Article */}
                <div className="mt-16 pt-8 border-t border-slate-100 print:mt-8">
                  <p className="text-sm text-slate-500 italic bg-slate-50 p-4 rounded-lg border border-slate-100 print:bg-transparent print:border-none print:p-0">
                    <strong>Legal Disclaimer:</strong> This document is legally binding. If you have questions about the interpretation of any clause, 
                    please consult with your legal counsel or contact us at legal@wpcube.io.
                  </p>
                </div>
              </div>

            </div>
          </main>

        </div>
      </div>
    </div>
  );
};