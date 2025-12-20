import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Zap,
	ChevronRight,
	Terminal,
	Check,
	Globe,
	Cpu,
	GitBranch,
	ArrowRight,
	ChevronDown,
	Box,
} from "lucide-react";

export const LandingPage: React.FC = () => {
	const navigate = useNavigate();
	const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
		"monthly"
	);

	// FAQ State wrapper
	const FaqItem = ({
		question,
		answer,
	}: {
		question: string;
		answer: string;
	}) => {
		const [isOpen, setIsOpen] = useState(false);
		return (
			<div className='border-b border-slate-200'>
				<button
					className='w-full py-6 flex justify-between items-center text-left focus:outline-none'
					onClick={() => setIsOpen(!isOpen)}>
					<span className='text-lg font-medium text-slate-900'>{question}</span>
					<ChevronDown
						className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${
							isOpen ? "transform rotate-180" : ""
						}`}
					/>
				</button>
				<div
					className={`overflow-hidden transition-all duration-300 ${
						isOpen ? "max-h-96 pb-6" : "max-h-0"
					}`}>
					<p className='text-slate-600 leading-relaxed'>{answer}</p>
				</div>
			</div>
		);
	};

	return (
		<div className='bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-700'>
			{/* 1. Hero Section */}
			<div className='relative pt-16 pb-20 lg:pt-32 lg:pb-32 overflow-hidden'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative'>
					<div className='lg:grid lg:grid-cols-2 gap-16 items-center'>
						{/* Left Content */}
						<div className='max-w-2xl'>
							<div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wide mb-6'>
								<span className='flex h-2 w-2 rounded-full bg-indigo-600'></span>
								v2.0 Now Available
							</div>
							<h1 className='text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-6'>
								The Docker-Powered WordPress Platform for{" "}
								<span className='text-indigo-600'>Enterprise.</span>
							</h1>
							<p className='text-lg text-slate-600 mb-8 leading-relaxed max-w-lg'>
								Experience isolated containers, zero-downtime deployments, and
								instant scaling. The power of Kubernetes, the simplicity of a
								click.
							</p>

							<div className='flex flex-col sm:flex-row gap-4 mb-8'>
								<button
									onClick={() => navigate("/signup")}
									className='inline-flex justify-center items-center px-8 py-4 text-base font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transform hover:-translate-y-1'>
									Start 14-Day Free Trial{" "}
									<ChevronRight className='ml-2 w-5 h-5' />
								</button>
								<button
									onClick={() => navigate("/demo")}
									className='inline-flex justify-center items-center px-8 py-4 text-base font-semibold rounded-xl text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors'>
									View Live Demo
								</button>
							</div>

							<div className='flex items-center gap-6 text-sm text-slate-500 font-medium'>
								<div className='flex items-center gap-1.5'>
									<Check className='w-4 h-4 text-green-500' /> No credit card
									required
								</div>
								<div className='flex items-center gap-1.5'>
									<Check className='w-4 h-4 text-green-500' /> Open Source Core
								</div>
							</div>
						</div>

						{/* Right Visual (Code Snippet) */}
						<div className='mt-16 lg:mt-0 relative'>
							<div className='absolute -inset-4 bg-indigo-100 rounded-full blur-3xl opacity-30 animate-pulse'></div>
							<div className='relative rounded-xl bg-slate-900 shadow-2xl border border-slate-800 overflow-hidden transform rotate-1 hover:rotate-0 transition-transform duration-500'>
								<div className='flex items-center gap-2 px-4 py-3 bg-slate-800 border-b border-slate-700'>
									<div className='w-3 h-3 rounded-full bg-red-500'></div>
									<div className='w-3 h-3 rounded-full bg-yellow-500'></div>
									<div className='w-3 h-3 rounded-full bg-green-500'></div>
									<div className='ml-2 text-xs text-slate-400 font-mono'>
										root@wpcube-cli:~
									</div>
								</div>
								<div className='p-6 font-mono text-sm'>
									<div className='flex items-center gap-2 text-green-400 mb-2'>
										<ChevronRight className='w-4 h-4' />
										<span>
											wpcube create --name="my-enterprise-site" --plan=pro
										</span>
									</div>
									<div className='text-slate-300 space-y-1 pl-6'>
										<p>
											[+] Authenticating credentials...{" "}
											<span className='text-green-500'>Done</span>
										</p>
										<p>
											[+] Provisioning isolated container...{" "}
											<span className='text-green-500'>Done</span>
										</p>
										<p>
											[+] Allocating 2 vCPU, 4GB RAM...{" "}
											<span className='text-green-500'>Done</span>
										</p>
										<p>
											[+] Configuring Nginx reverse proxy...{" "}
											<span className='text-green-500'>Done</span>
										</p>
										<p>
											[+] Mounting persistent SSD volume...{" "}
											<span className='text-green-500'>Done</span>
										</p>
										<p className='text-indigo-400 mt-4'>
											{" "}
											Success! Instance is running at
											https://my-enterprise-site.wpcube.local
										</p>
										<div className='flex items-center gap-2 mt-2'>
											<span className='animate-pulse inline-block w-2 h-4 bg-slate-500'></span>
										</div>
									</div>
								</div>
							</div>

							{/* Floating Badge */}
							<div className='absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-slate-100 flex items-center gap-3 animate-bounce hidden md:flex'>
								<div className='bg-green-100 p-2 rounded-lg'>
									<Zap className='w-6 h-6 text-green-600' />
								</div>
								<div>
									<p className='text-xs text-slate-500 font-bold uppercase'>
										Deployment Time
									</p>
									<p className='text-xl font-bold text-slate-900'>0.8s</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* 2. Social Proof */}
			<div className='bg-slate-50 border-y border-slate-200 py-12'>
				<div className='max-w-7xl mx-auto px-4 text-center'>
					<p className='text-sm font-semibold text-slate-500 uppercase tracking-wider mb-8'>
						Trusted by forward-thinking engineering teams at
					</p>
					<div className='flex flex-wrap justify-center gap-12 lg:gap-20 items-center opacity-60 grayscale hover:grayscale-0 transition-all duration-500'>
						{["Acme Corp", "TechFlow", "UniLab", "Nebula", "Vertex"].map(
							(brand) => (
								<span
									key={brand}
									className='text-xl md:text-2xl font-bold text-slate-400 flex items-center gap-2'>
									<Box className='w-6 h-6' /> {brand}
								</span>
							)
						)}
					</div>
				</div>
			</div>

			{/* 3. Features (Bento Grid) */}
			<div id='features' className='py-24 bg-white'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='text-center max-w-3xl mx-auto mb-20'>
						<h2 className='text-indigo-600 font-semibold tracking-wide uppercase text-sm mb-3'>
							Why WPCube?
						</h2>
						<p className='text-3xl md:text-4xl font-bold text-slate-900 mb-6'>
							Built for performance, designed for peace of mind.
						</p>
						<p className='text-lg text-slate-600'>
							We've stripped away the bloat of traditional hosting and replaced
							it with lean, containerized architecture.
						</p>
						<div className='mt-8'>
							<button
								onClick={() => navigate("/features")}
								className='text-indigo-600 font-medium hover:text-indigo-700 flex items-center justify-center gap-1 mx-auto'>
								Explore all features <ChevronRight className='w-4 h-4' />
							</button>
						</div>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
						{/* Card 1: Large */}
						<div className='md:col-span-2 bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:border-indigo-100 hover:shadow-xl transition-all duration-300 group'>
							<div className='w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform'>
								<Terminal className='w-6 h-6 text-indigo-600' />
							</div>
							<h3 className='text-xl font-bold text-slate-900 mb-3'>
								Infrastructure as Code
							</h3>
							<p className='text-slate-600 mb-6 max-w-lg'>
								Every WordPress site gets its own isolated Docker container. No
								more "bad neighbor" effects or cross-site infection risks found
								in shared hosting environments.
							</p>
							<div className='bg-white rounded-lg p-4 border border-slate-200 font-mono text-xs text-slate-500'>
								version: '3.8'
								<br />
								services:
								<br />
								&nbsp;&nbsp;wordpress:
								<br />
								&nbsp;&nbsp;&nbsp;&nbsp;image: wpcube/wordpress:latest
								<br />
								&nbsp;&nbsp;&nbsp;&nbsp;restart: always
							</div>
						</div>

						{/* Card 2 */}
						<div className='bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:border-indigo-100 hover:shadow-xl transition-all duration-300 group'>
							<div className='w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform'>
								<Globe className='w-6 h-6 text-blue-600' />
							</div>
							<h3 className='text-xl font-bold text-slate-900 mb-3'>
								Global Edge CDN
							</h3>
							<p className='text-slate-600'>
								Static assets are automatically cached and served from 250+ PoPs
								worldwide. Lightning fast TTFB, guaranteed.
							</p>
						</div>

						{/* Card 3 */}
						<div className='bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:border-indigo-100 hover:shadow-xl transition-all duration-300 group'>
							<div className='w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform'>
								<GitBranch className='w-6 h-6 text-purple-600' />
							</div>
							<h3 className='text-xl font-bold text-slate-900 mb-3'>
								DevOps Ready
							</h3>
							<p className='text-slate-600'>
								CI/CD pipelines integrated out of the box. Push to Git, and we
								build and deploy your theme changes instantly.
							</p>
						</div>

						{/* Card 4: Large */}
						<div className='md:col-span-2 bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:border-indigo-100 hover:shadow-xl transition-all duration-300 group'>
							<div className='w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform'>
								<Cpu className='w-6 h-6 text-green-600' />
							</div>
							<h3 className='text-xl font-bold text-slate-900 mb-3'>
								Intelligent Auto-Scaling
							</h3>
							<p className='text-slate-600'>
								Traffic spike? Viral post? We monitor CPU and RAM usage in
								real-time and allocate more resources instantly without
								downtime.
							</p>
							<div className='mt-6 h-1 bg-slate-200 rounded-full overflow-hidden'>
								<div className='h-full bg-green-500 w-3/4 animate-pulse'></div>
							</div>
							<div className='flex justify-between mt-2 text-xs font-medium text-slate-500'>
								<span>Load: 75%</span>
								<span>Scaling Up...</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* 4. How it works */}
			<div
				id='how-it-works'
				className='py-24 bg-slate-50 border-t border-slate-200'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='text-center mb-16'>
						<h2 className='text-3xl md:text-4xl font-bold text-slate-900'>
							From Zero to Live in 3 Steps
						</h2>
					</div>

					<div className='grid md:grid-cols-3 gap-12 relative'>
						{/* Connecting Line (Desktop) */}
						<div className='hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-slate-200 -z-10'></div>

						{/* Step 1 */}
						<div className='relative flex flex-col items-center text-center'>
							<div className='w-24 h-24 bg-white rounded-full border-4 border-slate-100 flex items-center justify-center text-2xl font-bold text-indigo-600 shadow-sm mb-6 z-10'>
								1
							</div>
							<h3 className='text-xl font-bold text-slate-900 mb-2'>Connect</h3>
							<p className='text-slate-600'>
								Create your account and select a high-performance resource plan
								tailored to your needs.
							</p>
						</div>

						{/* Step 2 */}
						<div className='relative flex flex-col items-center text-center'>
							<div className='w-24 h-24 bg-white rounded-full border-4 border-slate-100 flex items-center justify-center text-2xl font-bold text-indigo-600 shadow-sm mb-6 z-10'>
								2
							</div>
							<h3 className='text-xl font-bold text-slate-900 mb-2'>
								Provision
							</h3>
							<p className='text-slate-600'>
								Our orchestration engine spins up your dedicated Docker
								container and database in seconds.
							</p>
						</div>

						{/* Step 3 */}
						<div className='relative flex flex-col items-center text-center'>
							<div className='w-24 h-24 bg-white rounded-full border-4 border-slate-100 flex items-center justify-center text-2xl font-bold text-indigo-600 shadow-sm mb-6 z-10'>
								3
							</div>
							<h3 className='text-xl font-bold text-slate-900 mb-2'>Launch</h3>
							<p className='text-slate-600'>
								Access your WP Admin instantly with SSL pre-installed and start
								building your masterpiece.
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* 5. Pricing Section (Summary) */}
			<div className='py-24 bg-white'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='text-center max-w-3xl mx-auto mb-16'>
						<h2 className='text-3xl md:text-4xl font-bold text-slate-900 mb-6'>
							Simple, transparent pricing
						</h2>

						{/* Billing Toggle */}
						<div className='flex items-center justify-center gap-4 text-sm font-medium select-none'>
							<span
								className={`${
									billingCycle === "monthly"
										? "text-slate-900"
										: "text-slate-500"
								} transition-colors duration-200`}>
								Monthly
							</span>

							<div
								onClick={() =>
									setBillingCycle((prev) =>
										prev === "monthly" ? "yearly" : "monthly"
									)
								}
								className='w-14 h-7 bg-indigo-100 rounded-full relative cursor-pointer transition-colors duration-300 flex items-center px-1'
								role='button'
								aria-label='Toggle billing cycle'>
								<div
									className={`w-5 h-5 bg-indigo-600 rounded-full shadow-md transform transition-transform duration-300 ${
										billingCycle === "yearly"
											? "translate-x-7"
											: "translate-x-0"
									}`}></div>
							</div>

							<span
								className={`${
									billingCycle === "yearly"
										? "text-slate-900"
										: "text-slate-500"
								} transition-colors duration-200 flex items-center gap-2`}>
								Yearly
								<span className='text-indigo-600 text-xs bg-indigo-50 px-2 py-0.5 rounded-full font-bold border border-indigo-100'>
									Save 20%
								</span>
							</span>
						</div>
					</div>

					<div className='grid md:grid-cols-3 gap-8 max-w-5xl mx-auto'>
						{/* Starter */}
						<div className='p-8 rounded-3xl border border-slate-200 bg-white hover:border-slate-300 transition-colors'>
							<h3 className='text-lg font-semibold text-slate-900 mb-2'>
								Starter
							</h3>
							<p className='text-slate-500 text-sm mb-6'>
								For hobbyists and personal blogs.
							</p>
							<div className='mb-6 h-20'>
								<span className='text-4xl font-bold text-slate-900'>$0</span>
								<span className='text-slate-500'>/mo</span>
								<div className='text-xs text-transparent mt-1 select-none'>
									Free Forever
								</div>
							</div>
							<button
								onClick={() => navigate("/signup")}
								className='w-full py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors mb-8'>
								Start Free Trial
							</button>
							<ul className='space-y-4 text-sm text-slate-600'>
								<li className='flex items-center gap-3'>
									<Check className='w-4 h-4 text-green-500' /> 1 vCPU
								</li>
								<li className='flex items-center gap-3'>
									<Check className='w-4 h-4 text-green-500' /> 2GB RAM
								</li>
								<li className='flex items-center gap-3'>
									<Check className='w-4 h-4 text-green-500' /> 10GB NVMe Storage
								</li>
								<li className='flex items-center gap-3'>
									<Check className='w-4 h-4 text-green-500' /> Weekly Backups
								</li>
							</ul>
						</div>

						{/* Pro - Highlighted */}
						<div className='p-8 rounded-3xl border-2 border-indigo-600 bg-white shadow-xl relative scale-105 z-10'>
							<div className='absolute top-0 right-0 left-0 -mt-4 flex justify-center'>
								<span className='bg-indigo-600 text-white text-xs font-bold uppercase tracking-wide py-1 px-3 rounded-full'>
									Best Value
								</span>
							</div>
							<h3 className='text-lg font-semibold text-slate-900 mb-2'>Pro</h3>
							<p className='text-slate-500 text-sm mb-6'>
								For growing agencies and businesses.
							</p>
							<div className='mb-6 h-20'>
								<div className='flex items-baseline'>
									<span className='text-4xl font-bold text-slate-900'>
										${billingCycle === "monthly" ? 29 : 24}
									</span>
									<span className='text-slate-500 ml-1'>/mo</span>
								</div>
								{billingCycle === "yearly" && (
									<div className='text-xs text-indigo-600 font-medium mt-1 animate-fade-in'>
										Billed $288 yearly
									</div>
								)}
								{billingCycle === "monthly" && (
									<div className='text-xs text-transparent mt-1 select-none'>
										Billed monthly
									</div>
								)}
							</div>
							<button
								onClick={() => navigate("/signup")}
								className='w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors mb-8 shadow-lg shadow-indigo-200'>
								Get Started
							</button>
							<ul className='space-y-4 text-sm text-slate-600'>
								<li className='flex items-center gap-3'>
									<Check className='w-4 h-4 text-green-500' /> 2 vCPU
								</li>
								<li className='flex items-center gap-3'>
									<Check className='w-4 h-4 text-green-500' /> 4GB RAM
								</li>
								<li className='flex items-center gap-3'>
									<Check className='w-4 h-4 text-green-500' /> 40GB NVMe Storage
								</li>
								<li className='flex items-center gap-3'>
									<Check className='w-4 h-4 text-green-500' /> Daily Backups
								</li>
								<li className='flex items-center gap-3'>
									<Check className='w-4 h-4 text-green-500' /> White-label
									Dashboard
								</li>
							</ul>
						</div>

						{/* Enterprise */}
						<div className='p-8 rounded-3xl border border-slate-200 bg-white hover:border-slate-300 transition-colors'>
							<h3 className='text-lg font-semibold text-slate-900 mb-2'>
								Enterprise
							</h3>
							<p className='text-slate-500 text-sm mb-6'>
								For universities & large organizations.
							</p>
							<div className='mb-6 h-20'>
								<div className='flex items-baseline'>
									<span className='text-4xl font-bold text-slate-900'>
										${billingCycle === "monthly" ? 99 : 79}
									</span>
									<span className='text-slate-500 ml-1'>/mo</span>
								</div>
								{billingCycle === "yearly" && (
									<div className='text-xs text-slate-500 mt-1 animate-fade-in'>
										Billed $948 yearly
									</div>
								)}
								{billingCycle === "monthly" && (
									<div className='text-xs text-transparent mt-1 select-none'>
										Billed monthly
									</div>
								)}
							</div>
							<button
								onClick={() => navigate("/enterprise")}
								className='w-full py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors mb-8'>
								Contact Sales
							</button>
							<ul className='space-y-4 text-sm text-slate-600'>
								<li className='flex items-center gap-3'>
									<Check className='w-4 h-4 text-green-500' /> 8 vCPU
								</li>
								<li className='flex items-center gap-3'>
									<Check className='w-4 h-4 text-green-500' /> 16GB RAM
								</li>
								<li className='flex items-center gap-3'>
									<Check className='w-4 h-4 text-green-500' /> 200GB NVMe
									Storage
								</li>
								<li className='flex items-center gap-3'>
									<Check className='w-4 h-4 text-green-500' /> Hourly Backups
								</li>
								<li className='flex items-center gap-3'>
									<Check className='w-4 h-4 text-green-500' /> Dedicated Support
								</li>
							</ul>
						</div>
					</div>

					<div className='text-center mt-12'>
						<button
							onClick={() => navigate("/pricing")}
							className='text-indigo-600 font-medium hover:text-indigo-700 flex items-center justify-center gap-1 mx-auto'>
							View detailed comparison <ChevronRight className='w-4 h-4' />
						</button>
					</div>
				</div>
			</div>

			{/* 6. FAQ Section */}
			<div id='faq' className='py-24 bg-slate-50'>
				<div className='max-w-3xl mx-auto px-4 sm:px-6 lg:px-8'>
					<h2 className='text-3xl font-bold text-slate-900 text-center mb-12'>
						Frequently Asked Questions
					</h2>
					<div className='space-y-2'>
						<FaqItem
							question='Is this shared hosting?'
							answer='No. WPCube uses containerization technology. Each WordPress site gets its own dedicated Docker container with guaranteed resources (CPU/RAM). Your site is completely isolated from others.'
						/>
						<FaqItem
							question='Can I use my own domain?'
							answer="Absolutely. You can map any custom domain to your WPCube instance. We also provide a free SSL certificate via Let's Encrypt for every domain."
						/>
						<FaqItem
							question='How do I migrate my existing site?'
							answer='We offer a free migration plugin. Simply install it on your current site, enter your WPCube API key, and our automated system handles the rest.'
						/>
						<FaqItem
							question='What happens if I exceed my limits?'
							answer="Our auto-scaling technology handles traffic spikes gracefully. If you consistently exceed your plan limits, we'll notify you to upgrade. We never shut down sites for traffic surges."
						/>
					</div>
				</div>
			</div>

			{/* 7. CTA Banner */}
			<div className='py-20 px-4'>
				<div className='max-w-7xl mx-auto rounded-3xl bg-indigo-600 px-6 py-16 md:px-12 md:py-20 text-center shadow-2xl shadow-indigo-200 relative overflow-hidden'>
					{/* Decorative circles */}
					<div className='absolute top-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-x-1/2 -translate-y-1/2'></div>
					<div className='absolute bottom-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full translate-x-1/2 translate-y-1/2'></div>

					<h2 className='text-3xl md:text-5xl font-bold text-white mb-6 relative z-10'>
						Ready to scale your WordPress workflow?
					</h2>
					<p className='text-indigo-100 text-lg md:text-xl max-w-2xl mx-auto mb-10 relative z-10'>
						Join thousands of developers who have switched to containerized
						hosting.
					</p>
					<button
						onClick={() => navigate("/signup")}
						className='inline-flex justify-center items-center px-8 py-4 text-base font-bold rounded-xl text-indigo-600 bg-white hover:bg-indigo-50 transition-all shadow-lg transform hover:-translate-y-1 relative z-10'>
						Get Started Now <ArrowRight className='ml-2 w-5 h-5' />
					</button>
				</div>
			</div>
		</div>
	);
};
