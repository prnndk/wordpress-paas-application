import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Zap,
	Globe,
	Heart,
	Terminal,
	Cpu,
	Shield,
	GitBranch,
	ArrowRight,
	Check,
	ChevronRight,
} from "lucide-react";

export const FeaturesPage: React.FC = () => {
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState<
		"performance" | "security" | "workflow"
	>("performance");

	return (
		<div className='bg-white font-sans text-slate-900'>
			{/* Hero Section */}
			<div className='pt-24 pb-20 relative overflow-hidden'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10'>
					<h1 className='text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6'>
						The Modern Stack for{" "}
						<span className='text-indigo-600'>WordPress.</span>
					</h1>
					<p className='text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-10'>
						Move beyond shared hosting. Experience true isolation with Docker
						containers, NVMe storage, and Redis object caching built-in directly
						to the core.
					</p>
				</div>

				{/* Abstract Background Element */}
				<div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-50 rounded-full blur-3xl -z-10 opacity-60'></div>
			</div>

			{/* Section 1: The Core Tech (Bento Grid) */}
			<div className='py-20 bg-slate-50 border-y border-slate-200'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
						{/* Card 1: Large */}
						<div className='md:col-span-2 bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group'>
							<div className='absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-indigo-100 rounded-full blur-2xl group-hover:bg-indigo-200 transition-colors'></div>
							<div className='w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-6 text-indigo-600'>
								<Zap className='w-6 h-6' />
							</div>
							<h3 className='text-2xl font-bold text-slate-900 mb-3'>
								Instant Provisioning
							</h3>
							<p className='text-slate-600 text-lg'>
								Spin up a fresh WordPress instance in under 30 seconds using our
								orchestrated Docker Swarm clusters. No waiting for server
								configuration or DNS propagation.
							</p>
							<div className='mt-8 bg-slate-900 rounded-lg p-4 font-mono text-xs text-slate-300'>
								<div className='flex gap-2 mb-2'>
									<div className='w-3 h-3 rounded-full bg-red-500'></div>
									<div className='w-3 h-3 rounded-full bg-yellow-500'></div>
									<div className='w-3 h-3 rounded-full bg-green-500'></div>
								</div>
								<p>
									&gt; Provisioning container ID:{" "}
									<span className='text-indigo-400'>c92b-8a1f</span>
								</p>
								<p>
									&gt; Allocating volume...{" "}
									<span className='text-green-500'>Done (20ms)</span>
								</p>
								<p>
									&gt; Starting services...{" "}
									<span className='text-green-500'>Done (1.2s)</span>
								</p>
								<p className='animate-pulse'>&gt; Ready.</p>
							</div>
						</div>

						{/* Card 2 */}
						<div className='bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow'>
							<div className='w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6 text-blue-600'>
								<Globe className='w-6 h-6' />
							</div>
							<h3 className='text-xl font-bold text-slate-900 mb-3'>
								Global Edge Network
							</h3>
							<p className='text-slate-600'>
								Content delivered via Nginx-powered edge nodes. We cache your
								static assets automatically across 250+ locations.
							</p>
						</div>

						{/* Card 3 */}
						<div className='bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow'>
							<div className='w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center mb-6 text-rose-600'>
								<Heart className='w-6 h-6' />
							</div>
							<h3 className='text-xl font-bold text-slate-900 mb-3'>
								Auto-Healing
							</h3>
							<p className='text-slate-600'>
								If a container crashes, our orchestrator detects the health
								check failure and restarts it instantly on a healthy node.
							</p>
						</div>

						{/* Card 4 */}
						<div className='md:col-span-2 bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-8 items-center'>
							<div className='flex-1'>
								<div className='w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-6 text-emerald-600'>
									<Terminal className='w-6 h-6' />
								</div>
								<h3 className='text-2xl font-bold text-slate-900 mb-3'>
									Developer API
								</h3>
								<p className='text-slate-600 text-lg'>
									Full programmatic access to your infrastructure. Create sites,
									manage backups, and trigger deployments via our REST API.
								</p>
							</div>
							<div className='flex-1 w-full'>
								<div className='bg-slate-900 rounded-lg p-5 border border-slate-800 shadow-inner'>
									<code className='text-xs font-mono text-purple-400'>
										POST
									</code>{" "}
									<span className='text-xs font-mono text-slate-300'>
										/v1/instances
									</span>
									<pre className='mt-2 text-xs font-mono text-slate-400'>
										{`{
  "name": "new-client-site",
  "region": "us-east-1",
  "plan": "pro_v2"
}`}
									</pre>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Section 2: Deep Dive Tabs */}
			<div className='py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
				<div className='text-center mb-12'>
					<h2 className='text-3xl font-bold text-slate-900'>
						Engineered for Excellence
					</h2>
				</div>

				<div className='flex justify-center mb-12'>
					<div className='inline-flex bg-slate-100 p-1 rounded-xl'>
						{(["performance", "security", "workflow"] as const).map((tab) => (
							<button
								key={tab}
								onClick={() => setActiveTab(tab)}
								className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
									activeTab === tab
										? "bg-white text-indigo-600 shadow-sm"
										: "text-slate-600 hover:text-slate-900"
								}`}>
								{tab.charAt(0).toUpperCase() + tab.slice(1)}
							</button>
						))}
					</div>
				</div>

				<div className='bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-lg shadow-slate-200/50 min-h-[400px]'>
					<div className='grid md:grid-cols-2 h-full'>
						<div className='p-10 md:p-14 flex flex-col justify-center'>
							{activeTab === "performance" && (
								<div className='animate-fade-in'>
									<div className='w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-6'>
										<Cpu className='w-6 h-6' />
									</div>
									<h3 className='text-2xl font-bold text-slate-900 mb-4'>
										Blazing Fast Hardware
									</h3>
									<p className='text-slate-600 leading-relaxed mb-6'>
										We use Enterprise-grade NVMe SSDs and dedicated vCPUs to
										ensure your PHP workers never get blocked by "noisy
										neighbors". Coupled with our custom PHP-FPM tuning, WPCube
										instances handle 3x more requests per second than
										traditional VPS.
									</p>
									<ul className='space-y-3'>
										<li className='flex items-center gap-3 text-slate-700 text-sm'>
											<Check className='w-4 h-4 text-green-500' /> Dedicated
											Resources (No Overselling)
										</li>
										<li className='flex items-center gap-3 text-slate-700 text-sm'>
											<Check className='w-4 h-4 text-green-500' /> Object Cache
											Pro Included
										</li>
										<li className='flex items-center gap-3 text-slate-700 text-sm'>
											<Check className='w-4 h-4 text-green-500' /> Brotli
											Compression
										</li>
									</ul>
								</div>
							)}

							{activeTab === "security" && (
								<div className='animate-fade-in'>
									<div className='w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6'>
										<Shield className='w-6 h-6' />
									</div>
									<h3 className='text-2xl font-bold text-slate-900 mb-4'>
										Fortress-Level Security
									</h3>
									<p className='text-slate-600 leading-relaxed mb-6'>
										Every container is isolated. Even if one site is
										compromised, the rest of your infrastructure remains
										untouched. We also provide a WAF (Web Application Firewall)
										at the edge to block SQL injection and XSS attacks before
										they reach your app.
									</p>
									<ul className='space-y-3'>
										<li className='flex items-center gap-3 text-slate-700 text-sm'>
											<Check className='w-4 h-4 text-green-500' /> Container
											Isolation
										</li>
										<li className='flex items-center gap-3 text-slate-700 text-sm'>
											<Check className='w-4 h-4 text-green-500' /> Automated
											Malware Scanning
										</li>
										<li className='flex items-center gap-3 text-slate-700 text-sm'>
											<Check className='w-4 h-4 text-green-500' /> Free Wildcard
											SSLs
										</li>
									</ul>
								</div>
							)}

							{activeTab === "workflow" && (
								<div className='animate-fade-in'>
									<div className='w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6'>
										<GitBranch className='w-6 h-6' />
									</div>
									<h3 className='text-2xl font-bold text-slate-900 mb-4'>
										Git-Push Deployment
									</h3>
									<p className='text-slate-600 leading-relaxed mb-6'>
										Connect your GitHub repository and deploy theme changes with
										a simple `git push`. We build your assets, clear the cache,
										and swap containers with zero downtime.
									</p>
									<ul className='space-y-3'>
										<li className='flex items-center gap-3 text-slate-700 text-sm'>
											<Check className='w-4 h-4 text-green-500' /> Zero-Downtime
											Swaps
										</li>
										<li className='flex items-center gap-3 text-slate-700 text-sm'>
											<Check className='w-4 h-4 text-green-500' /> Preview
											Environments (PRs)
										</li>
										<li className='flex items-center gap-3 text-slate-700 text-sm'>
											<Check className='w-4 h-4 text-green-500' /> Rollback in
											1-Click
										</li>
									</ul>
								</div>
							)}
						</div>

						{/* Visual Side */}
						<div className='bg-slate-50 border-l border-slate-200 flex items-center justify-center p-10'>
							{/* Abstract Visual representation of the tab */}
							<div className='relative w-full max-w-sm aspect-square bg-white rounded-2xl shadow-xl border border-slate-200 p-6 flex flex-col gap-4'>
								<div className='h-4 w-1/3 bg-slate-100 rounded'></div>
								<div className='h-32 w-full bg-slate-50 rounded-lg border border-slate-100'></div>
								<div className='space-y-2'>
									<div className='h-3 w-full bg-slate-100 rounded'></div>
									<div className='h-3 w-5/6 bg-slate-100 rounded'></div>
									<div className='h-3 w-4/6 bg-slate-100 rounded'></div>
								</div>
								<div className='mt-auto flex justify-between items-center'>
									<div className='h-8 w-24 bg-indigo-600 rounded-lg'></div>
									<div className='h-8 w-8 rounded-full bg-slate-100'></div>
								</div>

								{/* Floating Elements based on tab */}
								{activeTab === "performance" && (
									<div className='absolute -right-4 top-10 bg-white p-3 rounded-lg shadow-lg border border-slate-100 animate-bounce'>
										<span className='text-green-600 font-bold font-mono'>
											TTFB: 45ms
										</span>
									</div>
								)}
								{activeTab === "security" && (
									<div className='absolute -left-4 bottom-20 bg-white p-3 rounded-lg shadow-lg border border-slate-100'>
										<div className='flex items-center gap-2'>
											<div className='w-2 h-2 rounded-full bg-green-500'></div>
											<span className='text-slate-600 text-xs font-bold'>
												Threat Blocked
											</span>
										</div>
									</div>
								)}
								{activeTab === "workflow" && (
									<div className='absolute -right-4 bottom-10 bg-slate-900 text-white p-3 rounded-lg shadow-lg border border-slate-800'>
										<span className='font-mono text-xs'>
											&gt; git push origin main
										</span>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* CTA Section */}
			<div className='bg-slate-900 py-24 text-center px-4'>
				<h2 className='text-3xl md:text-5xl font-bold text-white mb-6'>
					Ready to feel the speed?
				</h2>
				<p className='text-indigo-200 text-xl mb-10 max-w-2xl mx-auto'>
					Start your free trial today. No credit card required.
				</p>
				<button
					onClick={() => navigate("/signup")}
					className='bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-8 rounded-xl transition-all hover:scale-105 shadow-lg shadow-indigo-900/50 flex items-center gap-2 mx-auto'>
					Start Your Free Trial <ArrowRight className='w-5 h-5' />
				</button>
			</div>
		</div>
	);
};
