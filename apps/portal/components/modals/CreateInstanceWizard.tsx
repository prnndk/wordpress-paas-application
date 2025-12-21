import React, { useState } from "react";
import { useDashboard } from "../../context/DashboardContext";
import {
	dashboardService,
	type CreateTenantPayload,
} from "../../src/lib/dashboard";
import { Link, useNavigate } from "react-router-dom";
import {
	X,
	Check,
	Globe,
	Layers,
	AlertCircle,
	Plus,
	Trash2,
	Box,
	ArrowRight,
	ArrowLeft,
	Loader2,
	Eye,
	EyeOff,
	Copy,
	ExternalLink,
	Zap,
	TrendingUp,
} from "lucide-react";

interface CreateInstanceWizardProps {
	isOpen: boolean;
	onClose: () => void;
}

interface CreatedInstance {
	id: string;
	name: string;
	endpoints?: {
		site: string;
		admin: string;
	};
	wpAdminUser: string;
	wpAdminPassword: string;
}

export const CreateInstanceWizard: React.FC<CreateInstanceWizardProps> = ({
	isOpen,
	onClose,
}) => {
	const {
		refreshInstances,
		subscription,
		quotaUsed,
		quotaAllowed,
		canCreateInstance,
	} = useDashboard();
	const navigate = useNavigate();
	const [currentStep, setCurrentStep] = useState(1);
	const [isDeploying, setIsDeploying] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showPassword, setShowPassword] = useState(false);
	const [createdInstance, setCreatedInstance] =
		useState<CreatedInstance | null>(null);
	const [copied, setCopied] = useState<string | null>(null);

	// --- Form State ---
	const [formData, setFormData] = useState({
		name: "",
		slug: "",
		region: "us-east-1",
		wpAdminUser: "admin",
		wpAdminPassword: "",
		wpAdminEmail: "",
		envVars: [] as { key: string; value: string }[],
	});

	const handleEnvVarChange = (
		index: number,
		field: "key" | "value",
		value: string
	) => {
		const newVars = [...formData.envVars];
		newVars[index][field] = value;
		setFormData({ ...formData, envVars: newVars });
	};

	const addEnvVar = () => {
		setFormData({
			...formData,
			envVars: [...formData.envVars, { key: "", value: "" }],
		});
	};

	const removeEnvVar = (index: number) => {
		const newVars = formData.envVars.filter((_, i) => i !== index);
		setFormData({ ...formData, envVars: newVars });
	};

	const copyToClipboard = async (text: string, field: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(field);
			setTimeout(() => setCopied(null), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	const handleDeploy = async () => {
		setIsDeploying(true);
		setError(null);

		try {
			const payload: CreateTenantPayload = {
				name: formData.name,
				slug: formData.slug,
				region: formData.region,
				env: formData.envVars.filter((v) => v.key.trim() !== ""),
				wpAdminUser: formData.wpAdminUser,
				wpAdminPassword: formData.wpAdminPassword,
				wpAdminEmail: formData.wpAdminEmail || undefined,
				siteTitle: formData.name, // Use instance name as site title
			};

			// Call API
			const result = await dashboardService.createTenant(payload);

			// Store created instance for success modal
			setCreatedInstance({
				id: result.id,
				name: result.name,
				endpoints: result.endpoints,
				wpAdminUser: result.wpAdminUser || formData.wpAdminUser,
				wpAdminPassword: result.wpAdminPassword || formData.wpAdminPassword,
			});

			// Refresh the instances list
			await refreshInstances(true);

			// Force polling to trigger backend "getService" logic (which logs errors)
			const pollId = setInterval(() => refreshInstances(true), 2000);
			setTimeout(() => clearInterval(pollId), 60000); // Poll for 1 minute

			// Move to success step
			setCurrentStep(5);
		} catch (err: any) {
			console.error("Failed to create instance:", err);

			// Handle quota exceeded error
			if (err?.error === "QuotaExceeded") {
				setError(
					`Instance limit reached. You have ${err.used} instances and your plan allows ${err.allowed}. Upgrade your plan to create more.`
				);
			} else {
				setError(
					err?.message || "Failed to create instance. Please try again."
				);
			}
		} finally {
			setIsDeploying(false);
		}
	};

	const handleClose = () => {
		// Reset form
		setCurrentStep(1);
		setFormData({
			name: "",
			slug: "",
			region: "us-east-1",
			wpAdminUser: "admin",
			wpAdminPassword: "",
			wpAdminEmail: "",
			envVars: [],
		});
		setError(null);
		setCreatedInstance(null);
		onClose();
	};

	const handleGoToDashboard = async () => {
		try {
			if (refreshInstances) await refreshInstances(true);
		} catch (err) {
			console.error("Failed to refresh instances before navigating:", err);
		}
		// close modal and navigate to instance details
		const targetId = createdInstance?.id;
		handleClose();
		if (targetId) {
			navigate(`/instance/${targetId}`);
		} else {
			navigate("/dashboard");
		}
	};

	const isStep1Valid =
		formData.name.length >= 3 &&
		formData.slug.length >= 3 &&
		/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(formData.slug);

	const isStep3Valid =
		formData.wpAdminUser.length >= 3 &&
		formData.wpAdminPassword.length >= 8 &&
		formData.wpAdminEmail.length > 0 &&
		/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.wpAdminEmail);

	if (!isOpen) return null;

	// Format quota display
	const quotaDisplay =
		quotaAllowed === -1
			? `${quotaUsed} / Unlimited`
			: `${quotaUsed} / ${quotaAllowed}`;

	// Steps: 1=Basics, 2=Variables, 3=Credentials, 4=Review (Deploy), 5=Success
	const STEPS = ["Basics", "Variables", "Credentials", "Review"];

	return (
		<div className='fixed inset-0 z-[100] flex items-center justify-center p-4'>
			<div
				className='absolute inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity'
				onClick={handleClose}
			/>

			<div className='relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh] md:h-[650px] animate-in fade-in zoom-in-95 duration-200'>
				{/* Left Sidebar: Steps & Subscription Info */}
				<div className='w-full md:w-64 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 p-6 flex-shrink-0'>
					<h2 className='text-lg font-extrabold text-slate-900 mb-6 flex items-center gap-2'>
						<Box className='w-6 h-6 text-indigo-600' /> New Instance
					</h2>

					{/* Subscription Summary */}
					<div className='mb-6 p-4 bg-white rounded-xl border border-slate-200 shadow-sm'>
						<div className='flex items-center justify-between mb-2'>
							<span className='text-xs font-bold text-slate-500 uppercase tracking-wider'>
								Current Plan
							</span>
							<span className='text-xs font-bold text-indigo-600 uppercase'>
								{subscription?.planName || "Free"}
							</span>
						</div>
						<div className='flex items-center justify-between'>
							<span className='text-xs text-slate-500'>Instances</span>
							<span
								className={`text-sm font-bold ${
									canCreateInstance ? "text-green-600" : "text-red-600"
								}`}>
								{quotaDisplay}
							</span>
						</div>
						{!canCreateInstance && (
							<div className='mt-3 pt-3 border-t border-slate-100'>
								<Link
									to='/plans'
									className='flex items-center justify-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors'>
									<TrendingUp className='w-3 h-3' /> Upgrade Plan
								</Link>
							</div>
						)}
					</div>

					{/* Steps */}
					<div className='flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0'>
						{STEPS.map((step, idx) => {
							const stepNum = idx + 1;
							const isActive = currentStep === stepNum;
							const isCompleted = currentStep > stepNum;
							const isSuccess = currentStep === 5;

							return (
								<div
									key={step}
									className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
										isSuccess && stepNum === 4
											? "bg-green-50 text-green-700"
											: isActive
											? "bg-indigo-50 text-indigo-700 shadow-sm"
											: isCompleted
											? "text-green-600"
											: "text-slate-500"
									}`}>
									<div
										className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${
											isSuccess && stepNum === 4
												? "border-green-600 bg-green-600 text-white"
												: isActive
												? "border-indigo-600 bg-white"
												: isCompleted
												? "border-green-600 bg-green-600 text-white"
												: "border-slate-300 bg-white"
										}`}>
										{isCompleted || (isSuccess && stepNum === 4) ? (
											<Check className='w-3 h-3' />
										) : (
											stepNum
										)}
									</div>
									{step}
								</div>
							);
						})}
					</div>
				</div>

				{/* Right Content */}
				<div className='flex-1 flex flex-col min-w-0'>
					<div className='flex-1 overflow-y-auto p-6 md:p-10'>
						{/* Quota Exceeded Banner */}
						{!canCreateInstance && currentStep !== 5 && (
							<div className='mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg'>
								<div className='flex items-start gap-3'>
									<AlertCircle className='w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5' />
									<div>
										<p className='text-sm font-bold text-amber-800'>
											Instance Limit Reached
										</p>
										<p className='text-xs text-amber-700 mt-1'>
											You've used all {quotaAllowed} instances in your{" "}
											{subscription?.planName || "Free"} plan. Upgrade to create
											more instances.
										</p>
										<Link
											to='/plans'
											className='mt-2 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800'>
											<Zap className='w-3 h-3' /> View Upgrade Options
										</Link>
									</div>
								</div>
							</div>
						)}

						{/* Error display */}
						{error && (
							<div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700'>
								<AlertCircle className='w-5 h-5 flex-shrink-0' />
								<p className='text-sm'>{error}</p>
							</div>
						)}

						{/* Step 1: Basics */}
						{currentStep === 1 && (
							<div className='space-y-8 animate-in slide-in-from-right-4 duration-300'>
								<div>
									<h3 className='text-2xl font-bold text-slate-900'>
										Let's get started
									</h3>
									<p className='text-slate-500 mt-1'>
										Name your instance and choose the URL slug.
									</p>
								</div>

								<div className='space-y-6 max-w-lg'>
									<div>
										<label className='block text-sm font-bold text-slate-700 mb-2'>
											Instance Name
										</label>
										<input
											type='text'
											className='w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all'
											placeholder='e.g. Production Blog'
											value={formData.name}
											onChange={(e) =>
												setFormData({ ...formData, name: e.target.value })
											}
											autoFocus
										/>
									</div>

									<div>
										<label className='block text-sm font-bold text-slate-700 mb-2'>
											URL Slug
										</label>
										<div className='flex items-stretch'>
											<span className='bg-slate-100 border border-r-0 border-slate-300 px-4 text-slate-500 text-sm font-mono rounded-l-lg font-medium h-10 flex items-center'>
												{import.meta.env.VITE_SERVER_IP || "wpcube.app"}/
											</span>
											<input
												type='text'
												className='flex-1 px-4 h-10 border border-slate-300 rounded-r-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all'
												placeholder='my-site'
												value={formData.slug}
												onChange={(e) =>
													setFormData({
														...formData,
														slug: e.target.value
															.toLowerCase()
															.replace(/[^a-z0-9-]/g, ""),
													})
												}
											/>
										</div>
										<p className='mt-1 text-xs text-slate-500'>
											Lowercase letters, numbers, and hyphens only
										</p>
									</div>

									<div>
										<label className='block text-sm font-bold text-slate-700 mb-3'>
											Region
										</label>
										<div className='grid grid-cols-2 gap-4'>
											{[
												{
													id: "us-east-1",
													name: "US East",
													loc: "N. Virginia",
													flag: "🇺🇸",
												},
												{
													id: "eu-central-1",
													name: "EU Central",
													loc: "Frankfurt",
													flag: "🇩🇪",
												},
												{
													id: "ap-south-1",
													name: "Asia Pacific",
													loc: "Mumbai",
													flag: "🇮🇳",
												},
												{
													id: "ca-central-1",
													name: "Canada",
													loc: "Montreal",
													flag: "🇨🇦",
												},
											].map((region) => (
												<div
													key={region.id}
													onClick={() =>
														setFormData({ ...formData, region: region.id })
													}
													className={`cursor-pointer border rounded-xl p-4 flex items-center gap-3 transition-all ${
														formData.region === region.id
															? "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600"
															: "border-slate-200 hover:border-indigo-300 hover:shadow-sm"
													}`}>
													<span className='text-2xl'>{region.flag}</span>
													<div>
														<div className='font-bold text-slate-900 text-sm'>
															{region.name}
														</div>
														<div className='text-xs text-slate-500'>
															{region.loc}
														</div>
													</div>
													{formData.region === region.id && (
														<Check className='ml-auto w-4 h-4 text-indigo-600' />
													)}
												</div>
											))}
										</div>
									</div>
								</div>
							</div>
						)}

						{/* Step 2: Variables */}
						{currentStep === 2 && (
							<div className='space-y-8 animate-in slide-in-from-right-4 duration-300'>
								<div>
									<h3 className='text-2xl font-bold text-slate-900'>
										Environment Variables
									</h3>
									<p className='text-slate-500 mt-1'>
										Configure custom environment variables for your instance.
									</p>
								</div>

								<div>
									<div className='flex justify-between items-center mb-4'>
										<label className='text-sm font-bold text-slate-900'>
											Environment Variables
										</label>
										<button
											onClick={addEnvVar}
											className='text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1'>
											<Plus className='w-3 h-3' /> Add Variable
										</button>
									</div>

									<div className='space-y-3 max-w-2xl'>
										{formData.envVars.length === 0 && (
											<div className='text-sm text-slate-500 italic bg-slate-50 p-4 rounded-lg border border-slate-200 text-center'>
												No environment variables configured.
											</div>
										)}
										{formData.envVars.map((v, i) => (
											<div key={i} className='flex gap-2'>
												<input
													placeholder='KEY'
													className='flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono uppercase placeholder:normal-case'
													value={v.key}
													onChange={(e) =>
														handleEnvVarChange(
															i,
															"key",
															e.target.value.toUpperCase()
														)
													}
												/>
												<input
													placeholder='VALUE'
													className='flex-[2] px-3 py-2 border border-slate-300 rounded-lg text-sm'
													value={v.value}
													onChange={(e) =>
														handleEnvVarChange(i, "value", e.target.value)
													}
												/>
												<button
													onClick={() => removeEnvVar(i)}
													className='p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors'>
													<Trash2 className='w-4 h-4' />
												</button>
											</div>
										))}
									</div>
								</div>
							</div>
						)}

						{/* Step 3: Credentials */}
						{currentStep === 3 && (
							<div className='space-y-8 animate-in slide-in-from-right-4 duration-300'>
								<div>
									<h3 className='text-2xl font-bold text-slate-900'>
										WordPress Admin Credentials
									</h3>
									<p className='text-slate-500 mt-1'>
										Set up your WordPress administrator account.
									</p>
								</div>

								<div className='space-y-6 max-w-lg'>
									<div>
										<label className='block text-sm font-bold text-slate-700 mb-2'>
											Admin Username
										</label>
										<input
											type='text'
											className='w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all'
											placeholder='admin'
											value={formData.wpAdminUser}
											onChange={(e) =>
												setFormData({
													...formData,
													wpAdminUser: e.target.value.replace(
														/[^a-zA-Z0-9_]/g,
														""
													),
												})
											}
										/>
										<p className='mt-1 text-xs text-slate-500'>
											Letters, numbers, and underscores only
										</p>
									</div>

									<div>
										<label className='block text-sm font-bold text-slate-700 mb-2'>
											Admin Password
										</label>
										<div className='relative'>
											<input
												type={showPassword ? "text" : "password"}
												className='w-full px-4 py-2.5 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all'
												placeholder='Enter a strong password'
												value={formData.wpAdminPassword}
												onChange={(e) =>
													setFormData({
														...formData,
														wpAdminPassword: e.target.value,
													})
												}
											/>
											<button
												type='button'
												onClick={() => setShowPassword(!showPassword)}
												className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600'>
												{showPassword ? (
													<EyeOff className='w-5 h-5' />
												) : (
													<Eye className='w-5 h-5' />
												)}
											</button>
										</div>
										<p className='mt-1 text-xs text-slate-500'>
											Minimum 8 characters
										</p>
									</div>

									<div>
										<label className='block text-sm font-bold text-slate-700 mb-2'>
											Admin Email
										</label>
										<input
											type='email'
											className='w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all'
											placeholder='admin@example.com'
											value={formData.wpAdminEmail}
											onChange={(e) =>
												setFormData({
													...formData,
													wpAdminEmail: e.target.value,
												})
											}
										/>
										<p className='mt-1 text-xs text-slate-500'>
											Email for WordPress admin notifications
										</p>
									</div>

									<div className='bg-amber-50 border border-amber-200 rounded-lg p-4'>
										<div className='flex items-start gap-3'>
											<AlertCircle className='w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5' />
											<div>
												<p className='text-sm font-medium text-amber-800'>
													Save these credentials
												</p>
												<p className='text-xs text-amber-700 mt-1'>
													Make sure to save your admin password. For security,
													it will only be shown once after creation.
												</p>
											</div>
										</div>
									</div>
								</div>
							</div>
						)}

						{/* Step 4: Review */}
						{currentStep === 4 && (
							<div className='space-y-8 animate-in slide-in-from-right-4 duration-300'>
								<div>
									<h3 className='text-2xl font-bold text-slate-900'>
										Review & Deploy
									</h3>
									<p className='text-slate-500 mt-1'>
										Confirm your instance configuration before deploying.
									</p>
								</div>

								<div className='bg-slate-50 rounded-xl p-6 border border-slate-200 max-w-lg'>
									<div className='space-y-4'>
										<div className='flex justify-between border-b border-slate-200 pb-3'>
											<span className='text-sm text-slate-600'>Name</span>
											<span className='text-sm font-bold text-slate-900'>
												{formData.name}
											</span>
										</div>
										<div className='flex justify-between border-b border-slate-200 pb-3'>
											<span className='text-sm text-slate-600'>URL</span>
											<span className='text-sm font-mono text-indigo-600'>
												{formData.slug}.wpcube.app
											</span>
										</div>
										<div className='flex justify-between border-b border-slate-200 pb-3'>
											<span className='text-sm text-slate-600'>Region</span>
											<span className='text-sm font-bold text-slate-900'>
												{formData.region}
											</span>
										</div>
										<div className='flex justify-between border-b border-slate-200 pb-3'>
											<span className='text-sm text-slate-600'>
												Environment Vars
											</span>
											<span className='text-sm text-slate-900'>
												{formData.envVars.length} configured
											</span>
										</div>
										<div className='flex justify-between'>
											<span className='text-sm text-slate-600'>Plan</span>
											<span className='text-sm font-bold text-indigo-600'>
												{subscription?.planName || "Free"} (Subscription)
											</span>
										</div>
									</div>
								</div>

								<p className='text-xs text-slate-500'>
									Resources will be allocated based on your subscription plan.
									No additional charges apply for creating instances within your
									quota.
								</p>
							</div>
						)}

						{/* Step 5: Success */}
						{currentStep === 5 && createdInstance && (
							<div className='space-y-8 animate-in slide-in-from-right-4 duration-300'>
								<div className='text-center max-w-lg mx-auto'>
									<div className='w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6'>
										<Check className='w-8 h-8' />
									</div>
									<h3 className='text-2xl font-bold text-slate-900'>
										Instance Created!
									</h3>
									<p className='text-slate-500 mt-2'>
										Your WordPress instance is being provisioned. Save the
										credentials below.
									</p>
								</div>

								<div className='bg-slate-50 rounded-xl border border-slate-200 overflow-hidden max-w-2xl mx-auto'>
									<div className='px-6 py-4 border-b border-slate-200 bg-white'>
										<span className='font-bold text-slate-900'>
											{createdInstance.name}
										</span>
									</div>
									<div className='p-6 space-y-4'>
										<div>
											<label className='block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1'>
												Site URL
											</label>
											<div className='flex items-center gap-2'>
												<code className='flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono'>
													{createdInstance.endpoints?.site || "#"}
												</code>
												<a
													href={createdInstance.endpoints?.site}
													target='_blank'
													rel='noopener noreferrer'
													className='p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors'>
													<ExternalLink className='w-4 h-4' />
												</a>
											</div>
										</div>

										<div>
											<label className='block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1'>
												WP Admin URL
											</label>
											<div className='flex items-center gap-2'>
												<code className='flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono'>
													{createdInstance.endpoints?.admin || "#"}
												</code>
												<a
													href={createdInstance.endpoints?.admin}
													target='_blank'
													rel='noopener noreferrer'
													className='p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors'>
													<ExternalLink className='w-4 h-4' />
												</a>
											</div>
										</div>

										<div className='pt-4 border-t border-slate-200'>
											<div className='bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4'>
												<div className='flex items-start gap-3'>
													<AlertCircle className='w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5' />
													<p className='text-sm text-amber-800'>
														<strong>Save these credentials now!</strong> The
														password will not be shown again.
													</p>
												</div>
											</div>

											<div className='grid grid-cols-2 gap-4'>
												<div>
													<label className='block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1'>
														Username
													</label>
													<div className='flex items-center gap-2'>
														<code className='flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono'>
															{createdInstance.wpAdminUser}
														</code>
														<button
															onClick={() =>
																copyToClipboard(
																	createdInstance.wpAdminUser,
																	"user"
																)
															}
															className={`p-2 rounded-lg transition-colors ${
																copied === "user"
																	? "text-green-600 bg-green-50"
																	: "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
															}`}>
															{copied === "user" ? (
																<Check className='w-4 h-4' />
															) : (
																<Copy className='w-4 h-4' />
															)}
														</button>
													</div>
												</div>
												<div>
													<label className='block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1'>
														Password
													</label>
													<div className='flex items-center gap-2'>
														<code className='flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono'>
															{createdInstance.wpAdminPassword}
														</code>
														<button
															onClick={() =>
																copyToClipboard(
																	createdInstance.wpAdminPassword,
																	"pass"
																)
															}
															className={`p-2 rounded-lg transition-colors ${
																copied === "pass"
																	? "text-green-600 bg-green-50"
																	: "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
															}`}>
															{copied === "pass" ? (
																<Check className='w-4 h-4' />
															) : (
																<Copy className='w-4 h-4' />
															)}
														</button>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						)}
					</div>

					{/* Footer Navigation */}
					<div className='p-6 border-t border-slate-100 flex justify-between items-center bg-white'>
						{currentStep === 5 ? (
							<>
								<div />
								<button
									onClick={handleGoToDashboard}
									className='bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-2.5 px-8 rounded-lg shadow-sm transition-colors flex items-center gap-2'>
									Go to Dashboard
								</button>
							</>
						) : (
							<>
								<button
									onClick={() =>
										setCurrentStep((prev) => Math.max(1, prev - 1))
									}
									disabled={currentStep === 1 || isDeploying}
									className={`flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors ${
										currentStep === 1 ? "invisible" : ""
									}`}>
									<ArrowLeft className='w-4 h-4' /> Back
								</button>

								{currentStep < 4 ? (
									<button
										onClick={() =>
											setCurrentStep((prev) => Math.min(4, prev + 1))
										}
										disabled={
											(currentStep === 1 && !isStep1Valid) || !canCreateInstance
										}
										className='bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-2.5 px-6 rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'>
										Continue <ArrowRight className='w-4 h-4' />
									</button>
								) : (
									<button
										onClick={handleDeploy}
										disabled={
											isDeploying || !isStep3Valid || !canCreateInstance
										}
										className='bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-2.5 px-8 rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'>
										{isDeploying ? (
											<Loader2 className='w-4 h-4 animate-spin' />
										) : (
											<Globe className='w-4 h-4' />
										)}
										{isDeploying ? "Provisioning..." : "Deploy Instance"}
									</button>
								)}
							</>
						)}
					</div>
				</div>

				{/* Close button */}
				<button
					onClick={handleClose}
					className='absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors'>
					<X className='w-5 h-5' />
				</button>
			</div>
		</div>
	);
};
