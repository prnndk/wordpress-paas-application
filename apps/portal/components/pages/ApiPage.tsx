import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export const ApiPage: React.FC = () => {
  // Reusable Code Block
  const CodeBlock = ({ code, language = 'bash' }: { code: string, language?: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div className="relative group rounded-lg overflow-hidden border border-slate-700 bg-black/50 shadow-inner">
        <div className="flex justify-between items-center px-4 py-2 bg-white/5 border-b border-white/5">
          <span className="text-xs font-mono text-slate-500">{language}</span>
          <button 
            onClick={handleCopy}
            className="text-slate-500 hover:text-white transition-colors"
            title="Copy to clipboard"
          >
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
        <div className="p-4 overflow-x-auto">
          <pre className="text-sm font-mono text-indigo-100 leading-relaxed whitespace-pre">
            <code>{code}</code>
          </pre>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      
      <div className="flex flex-col">
        
        {/* Intro Section */}
        <div className="flex flex-col lg:flex-row border-b border-slate-200">
           <div className="flex-1 p-8 lg:p-16 lg:max-w-[50%]">
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-6">API Reference</h1>
              <p className="text-lg text-slate-600 mb-4 leading-relaxed">
                Welcome to the WPCube API. You can use our API to access WPCube endpoints, which allow you to create instances, manage resources, and retrieve metrics programmatically.
              </p>
              <p className="text-slate-600 leading-relaxed">
                All API access is over HTTPS, and accessed from <code>api.wpcube.io</code>. All data is sent and received as JSON.
              </p>
           </div>
           <div className="flex-1 bg-slate-900 p-8 lg:p-16 text-slate-400 text-sm font-mono flex items-center border-l border-slate-800">
              <p className="select-none text-slate-600 mr-4">BASE URL</p>
              <p className="text-indigo-400 font-medium">https://api.wpcube.io/v1</p>
           </div>
        </div>

        {/* Authentication */}
        <div className="flex flex-col lg:flex-row border-b border-slate-200">
           <div className="flex-1 p-8 lg:p-16 lg:max-w-[50%]">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Authentication</h2>
              <p className="text-slate-600 mb-4 leading-relaxed">
                Authenticate your API requests using your API keys. You can manage your API keys in the Dashboard under Settings.
              </p>
              <p className="text-slate-600 mb-4 leading-relaxed">
                Your API keys carry many privileges, so be sure to keep them secure! Do not share your secret API keys in publicly accessible areas such as GitHub, client-side code, and so forth.
              </p>
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mt-6 rounded-r-md">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-amber-700">
                      Authentication to the API is performed via HTTP Bearer Auth. Provide your API key as the bearer token value.
                    </p>
                  </div>
                </div>
              </div>
           </div>
           <div className="flex-1 bg-slate-900 p-8 lg:p-16 border-l border-slate-800">
              <div className="sticky top-28">
                 <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Shell</h4>
                 <CodeBlock code={`curl https://api.wpcube.io/v1/instances \\
  -H "Authorization: Bearer sk_live_12345..."`} />
              </div>
           </div>
        </div>

        {/* Create Instance */}
        <div className="flex flex-col lg:flex-row border-b border-slate-200">
           <div className="flex-1 p-8 lg:p-16 lg:max-w-[50%]">
              <div className="flex items-center gap-3 mb-6">
                 <span className="bg-indigo-600 text-white px-2 py-1 rounded text-xs font-bold uppercase tracking-wide">POST</span>
                 <h2 className="text-2xl font-bold text-slate-900">Create Instance</h2>
              </div>
              <p className="text-slate-600 mb-8 leading-relaxed">
                Provisions a new WordPress container. This endpoint triggers an asynchronous provisioning job. The returned instance object will have a status of <code>provisioning</code>.
              </p>

              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Body Parameters</h3>
              <ul className="space-y-6">
                 <li className="group">
                    <div className="flex items-baseline gap-2">
                       <code className="font-mono text-indigo-600 font-bold bg-indigo-50 px-1 rounded">name</code>
                       <span className="text-xs text-red-500 font-medium border border-red-200 bg-red-50 px-1 rounded">Required</span>
                       <span className="text-xs text-slate-400">string</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-2">The human-readable name for the instance. Used for dashboard display.</p>
                 </li>
                 <li className="group">
                    <div className="flex items-baseline gap-2">
                       <code className="font-mono text-indigo-600 font-bold bg-indigo-50 px-1 rounded">region</code>
                       <span className="text-xs text-slate-400">string</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-2">
                        The physical region to deploy to. Options: <code>us-east</code>, <code>eu-west</code>.
                        <br/><span className="text-xs text-slate-400">Default: us-east</span>
                    </p>
                 </li>
                 <li className="group">
                    <div className="flex items-baseline gap-2">
                       <code className="font-mono text-indigo-600 font-bold bg-indigo-50 px-1 rounded">image</code>
                       <span className="text-xs text-slate-400">string</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-2">
                        Docker image tag to use. Defaults to <code>wordpress:latest</code>.
                    </p>
                 </li>
              </ul>
           </div>
           <div className="flex-1 bg-slate-900 p-8 lg:p-16 border-l border-slate-800">
              <div className="sticky top-28 space-y-10">
                 <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Request</h4>
                    <CodeBlock code={`curl -X POST https://api.wpcube.io/v1/instances \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "My Tech Blog",
    "region": "us-east"
  }'`} />
                 </div>
                 <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Response</h4>
                    <CodeBlock language="json" code={`{
  "id": "inst_8f92a1",
  "name": "My Tech Blog",
  "status": "provisioning",
  "ipv4": "192.168.44.12",
  "created_at": "2023-11-21T14:30:00Z",
  "region": "us-east"
}`} />
                 </div>
              </div>
           </div>
        </div>

        {/* Get Metrics */}
        <div className="flex flex-col lg:flex-row border-b border-slate-200">
           <div className="flex-1 p-8 lg:p-16 lg:max-w-[50%]">
              <div className="flex items-center gap-3 mb-6">
                 <span className="bg-emerald-600 text-white px-2 py-1 rounded text-xs font-bold uppercase tracking-wide">GET</span>
                 <h2 className="text-2xl font-bold text-slate-900">Get Metrics</h2>
              </div>
              <p className="text-slate-600 mb-8 leading-relaxed">
                Retrieves real-time resource usage statistics for a specific instance. Data is aggregated in 1-minute intervals.
              </p>

              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Path Parameters</h3>
              <ul className="space-y-6">
                 <li className="group">
                    <div className="flex items-baseline gap-2">
                       <code className="font-mono text-indigo-600 font-bold bg-indigo-50 px-1 rounded">id</code>
                       <span className="text-xs text-red-500 font-medium border border-red-200 bg-red-50 px-1 rounded">Required</span>
                       <span className="text-xs text-slate-400">string</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-2">Unique identifier of the instance (e.g., <code>inst_123</code>).</p>
                 </li>
              </ul>
           </div>
           <div className="flex-1 bg-slate-900 p-8 lg:p-16 border-l border-slate-800">
              <div className="sticky top-28 space-y-10">
                 <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Request</h4>
                    <CodeBlock code={`curl https://api.wpcube.io/v1/instances/inst_8f92a1/metrics \\
  -H "Authorization: Bearer sk_live_..."`} />
                 </div>
                 <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Response</h4>
                    <CodeBlock language="json" code={`{
  "instance_id": "inst_8f92a1",
  "cpu_usage_percent": 45.2,
  "ram_usage_mb": 512,
  "timestamp": "2023-11-21T14:35:00Z"
}`} />
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};