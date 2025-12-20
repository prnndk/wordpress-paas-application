import React, { useState, useEffect } from "react";
import {
	Check,
	Loader2,
	Zap,
	TrendingUp,
	ArrowRight,
	AlertTriangle,
} from "lucide-react";
import { dashboardService } from "../../src/lib/dashboard";
import { useDashboard } from "../DashboardLayout";
import type { PlanInfo } from "../../src/types/auth";
import { useNavigate } from "react-router-dom";

export const PlansPage: React.FC = () => {
	const navigate = useNavigate();
	const { subscription, refreshInstances, instances } = useDashboard();
	const [plans, setPlans] = useState<PlanInfo[]>([]);
	const [loading, setLoading] = useState(true);
	const [upgrading, setUpgrading] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	// Downgrade Resolution State
	const [instancesToDelete, setInstancesToDelete] = useState<Set<string>>(
		new Set()
	);

	useEffect(() => {
		loadPlans();
	}, []);

	const [confirmingPlan, setConfirmingPlan] = useState<PlanInfo | null>(null);
	const [previewData, setPreviewData] = useState<any>(null);
	const [loadingPreview, setLoadingPreview] = useState(false);

	const loadPlans = async () => {
		try {
			setLoading(true);
			const data = await dashboardService.getPlans();
			setPlans(data);
		} catch (err: any) {
			setError(err?.message || "Failed to load plans");
		} finally {
			setLoading(false);
		}
	};

	const initiateUpgrade = async (plan: PlanInfo) => {
		setConfirmingPlan(plan);
		setPreviewData(null);
		setInstancesToDelete(new Set()); // Reset selection

		// Fetch preview if not "free" to "free" (though backend handles it)
		try {
			setLoadingPreview(true);
			const data = await dashboardService.previewUpgrade(plan.id);
			setPreviewData(data);
		} catch (err) {
			console.error("Failed to load preview", err);
		} finally {
			setLoadingPreview(false);
		}
	};

	const handleUpgrade = async () => {
		if (!confirmingPlan) return;

		try {
			// Process Deletions First if any
			if (instancesToDelete.size > 0) {
				console.log(
					`Processing ${instancesToDelete.size} instance deletions before downgrade...`
				);
				const deletePromises = Array.from(instancesToDelete).map((id) => {
					console.log(`Deleting instance: ${id}`);
					return dashboardService.deleteTenant(id);
				});
				await Promise.all(deletePromises);
				console.log("Deletion complete. Proceeding with downgrade.");
			}

			const planId = confirmingPlan.id;
			setUpgrading(planId);
			setError(null);
			setConfirmingPlan(null); // Close modal
			setInstancesToDelete(new Set());

			// Determine if upgrade or downgrade
			const actionType = getActionType(confirmingPlan.price);

			if (actionType === "Downgrade") {
				await dashboardService.downgradePlan(planId);
				// Downgrade is immediate
				setSuccess(true);
				setTimeout(async () => {
					if (refreshInstances) {
						await refreshInstances(true);
					}
					setUpgrading(null);
					setSuccess(false);
				}, 2000);
			} else {
				// Upgrade requires checkout flow
				const result = await dashboardService.upgradePlan(planId);
				console.log("Redirecting to checkout:", result.redirectUrl);
				window.location.href = result.redirectUrl;
			}
		} catch (err: any) {
			setError(err?.message || "Plan change failed");
			setUpgrading(null);
		}
	};

	// Helper to determine action type
	const getActionType = (targetPrice: number) => {
		const currentPrice = subscription?.price || 0;
		if (targetPrice < currentPrice) return "Downgrade";
		if (targetPrice > currentPrice) return "Upgrade";
		return "Change";
	};

	const currentPlanId = subscription?.planId;

	if (loading) {
		return (
			<div className='min-h-screen bg-slate-50 p-8 flex items-center justify-center'>
				<Loader2 className='w-8 h-8 animate-spin text-indigo-600' />
			</div>
		);
	}

	return (
		<div className='min-h-screen bg-slate-50'>
			{/* Header */}
			<div className='bg-gradient-to-br from-indigo-600 to-indigo-800 text-white py-16 px-8'>
				<div className='max-w-7xl mx-auto text-center'>
					<h1 className='text-4xl font-extrabold mb-4'>
						Choose Your Perfect Plan
					</h1>
					<p className='text-xl text-indigo-100'>
						Scale your WordPress infrastructure with flexible pricing
					</p>
					{subscription && (
						<div className='mt-6 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg'>
							<Zap className='w-5 h-5' />
							<span className='font-medium'>
								Current Plan: {subscription.planName} ($
								{(subscription.price / 100).toFixed(0)}/mo)
							</span>
						</div>
					)}
				</div>
			</div>

			{/* Error Banner */}
			{error && (
				<div className='max-w-7xl mx-auto px-8 mt-6'>
					<div className='bg-red-50 border border-red-200 rounded-lg p-4 text-red-800'>
						{error}
					</div>
				</div>
			)}

			{/* Success Banner */}
			{success && (
				<div className='max-w-7xl mx-auto px-8 mt-6'>
					<div className='bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 flex items-center gap-2'>
						<Check className='w-5 h-5' />
						<span className='font-medium'>
							Plan change successful! Refreshing subscription data...
						</span>
					</div>
				</div>
			)}

			{/* Plans Grid */}
			<div className='max-w-7xl mx-auto px-8 py-12'>
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
					{plans.map((plan) => {
						const isCurrent = subscription?.planId === plan.id;
						// Infer recommended from name or price if not present, for UI zest
						const isRecommended =
							plan.recommended || plan.name === "Professional";

						const actionType = getActionType(plan.price);
						const isDowngrade = actionType === "Downgrade";

						const featuresList = [
							plan.features.maxInstances === -1
								? "Unlimited Instances"
								: `${plan.features.maxInstances} Instances`,
							`${plan.features.storageGb} GB Storage`,
							plan.features.prioritySupport
								? "Priority Support"
								: "Community Support",
							plan.features.sslCert ? "Free SSL Certificate" : null,
							plan.features.customDomain ? "Custom Domain" : null,
							plan.features.backups ? "Automated Backups" : null,
						].filter(Boolean);

						return (
							<div
								key={plan.id}
								className={`bg-white rounded-xl border-2 p-6 relative transition-all hover:shadow-lg flex flex-col ${
									isCurrent
										? "border-indigo-600 shadow-md"
										: isRecommended
										? "border-green-500"
										: "border-slate-200 hover:border-indigo-300"
								}`}>
								{/* Badges */}
								{isCurrent && (
									<div className='absolute top-4 right-4 bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded'>
										CURRENT
									</div>
								)}
								{isRecommended && !isCurrent && (
									<div className='absolute top-4 right-4 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1'>
										<TrendingUp className='w-3 h-3' /> POPULAR
									</div>
								)}

								{/* Plan Header */}
								<h3 className='text-xl font-bold text-slate-900 mb-2'>
									{plan.name}
								</h3>
								<div className='mb-6'>
									<span className='text-4xl font-extrabold text-slate-900'>
										${(plan.price / 100).toFixed(0)}*
									</span>
									<span className='text-slate-500 text-sm'>/month</span>
								</div>

								{/* Features */}
								<ul className='space-y-3 mb-6 flex-1'>
									{featuresList.map((feature, idx) => (
										<li
											key={idx}
											className='flex items-start gap-2 text-sm text-slate-700'>
											<Check className='w-4 h-4 text-green-600 flex-shrink-0 mt-0.5' />
											<span>{feature}</span>
										</li>
									))}
								</ul>

								{/* Action Button */}
								<div className='mt-auto'>
									{isCurrent ? (
										<button
											disabled
											className='w-full py-2.5 bg-slate-100 text-slate-500 font-bold rounded-lg cursor-default'>
											Current Plan
										</button>
									) : (
										<button
											onClick={() => initiateUpgrade(plan)}
											disabled={!!upgrading}
											className={`w-full py-2.5 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
												isDowngrade
													? "bg-amber-100 text-amber-900 hover:bg-amber-200"
													: "bg-indigo-600 hover:bg-indigo-700 text-white"
											}`}>
											{upgrading === plan.id ? (
												<Loader2 className='w-4 h-4 animate-spin' />
											) : (
												<>
													{actionType} <ArrowRight className='w-4 h-4' />
												</>
											)}
										</button>
									)}
								</div>
							</div>
						);
					})}
				</div>
				<p className='text-center text-slate-400 text-sm mt-8'>
					* Prices are in USD. Custom enterprise needs? Contact us.
				</p>
			</div>

			{/* Footer */}
			<div className='max-w-7xl mx-auto px-8 pb-12'>
				<div className='bg-white rounded-xl border border-slate-200 p-8 text-center'>
					<h3 className='text-xl font-bold text-slate-900 mb-2'>
						Need a custom solution?
					</h3>
					<p className='text-slate-600 mb-4'>
						Contact our sales team for enterprise-grade infrastructure
					</p>
					<button
						onClick={() => navigate("/contact-sales")}
						className='inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors'>
						Contact Sales
					</button>
				</div>
			</div>

			{/* Confirmation Modal */}
			{confirmingPlan && (
				<div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
					<div className='bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200'>
						<h3 className='text-xl font-bold text-slate-900 mb-2'>
							Confirm {getActionType(confirmingPlan.price)}
						</h3>
						<p className='text-slate-600 mb-6'>
							Are you sure you want to change your plan to{" "}
							<span className='font-semibold text-slate-900'>
								{confirmingPlan.name}
							</span>
							? This will update your subscription billing and resource limits.
						</p>

						{/* Downgrade Conflict Resolution */}
						{getActionType(confirmingPlan.price) === "Downgrade" &&
							confirmingPlan.features.maxInstances !== -1 &&
							instances.length > confirmingPlan.features.maxInstances && (
								<div className='mb-6'>
									<div className='bg-red-50 border border-red-200 rounded-lg p-4 mb-4'>
										<div className='flex items-start gap-3'>
											<AlertTriangle className='w-5 h-5 text-red-600 mt-0.5' />
											<div>
												<h4 className='text-sm font-bold text-red-900'>
													Usage Limits Exceeded
												</h4>
												<p className='text-sm text-red-700 mt-1'>
													You have {instances.length} active instances, but the{" "}
													<span className='font-semibold'>
														{confirmingPlan.name}
													</span>{" "}
													plan only allows{" "}
													{confirmingPlan.features.maxInstances}.
												</p>
												<p className='text-sm text-red-700 mt-2 font-medium'>
													Please select{" "}
													{instances.length -
														confirmingPlan.features.maxInstances}{" "}
													instance(s) to remove before confirming.
												</p>
											</div>
										</div>
									</div>

									{/* Instance Selection List */}
									<div className='bg-slate-50 rounded-lg border border-slate-200 max-h-48 overflow-y-auto'>
										{instances.map((instance) => (
											<div
												key={instance.id}
												onClick={() => {
													if (instancesToDelete.has(instance.id)) {
														const next = new Set(instancesToDelete);
														next.delete(instance.id);
														setInstancesToDelete(next);
													} else {
														setInstancesToDelete(
															new Set(instancesToDelete).add(instance.id)
														);
													}
												}}
												className={`p-3 flex items-center justify-between cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-100 transition-colors ${
													instancesToDelete.has(instance.id) ? "bg-red-50" : ""
												}`}>
												<div className='flex items-center gap-3'>
													<div
														className={`w-4 h-4 rounded border flex items-center justify-center ${
															instancesToDelete.has(instance.id)
																? "bg-red-600 border-red-600"
																: "border-slate-300 bg-white"
														}`}>
														{instancesToDelete.has(instance.id) && (
															<Check className='w-3 h-3 text-white' />
														)}
													</div>
													<div>
														<p className='text-sm font-medium text-slate-900'>
															{instance.name}
														</p>
														<p className='text-xs text-slate-500'>
															{instance.slug}
														</p>
													</div>
												</div>
												<span
													className={`text-xs px-2 py-1 rounded-full ${
														instance.status === "running"
															? "bg-green-100 text-green-700"
															: "bg-slate-100 text-slate-600"
													}`}>
													{instance.status}
												</span>
											</div>
										))}
									</div>
								</div>
							)}

						{/* Downgrade warning only if no conflict or resolved conflict (visual feedback) */}
						{getActionType(confirmingPlan.price) === "Downgrade" &&
							(confirmingPlan.features.maxInstances === -1 ||
								instances.length <= confirmingPlan.features.maxInstances) && (
								<div className='mb-6 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800'>
									Note: You are downgrading your plan. Changes to resource
									limits will apply immediately.
								</div>
							)}

						{/* Proration Preview Section */}
						<div className='mb-6 bg-slate-50 rounded-lg p-4 border border-slate-200'>
							<h4 className='text-xs font-bold text-slate-500 uppercase tracking-wide mb-3'>
								Cost Breakdown
							</h4>

							{loadingPreview ? (
								<div className='flex items-center gap-2 text-slate-500 text-sm'>
									<Loader2 className='w-4 h-4 animate-spin' /> Calculating...
								</div>
							) : previewData ? (
								<div className='space-y-2 text-sm'>
									<div className='flex justify-between'>
										<span className='text-slate-600'>
											{confirmingPlan.name} Plan
										</span>
										<span className='font-medium'>
											${(confirmingPlan.price / 100).toFixed(2)}
										</span>
									</div>

									{previewData.credit > 0 && (
										<div className='flex justify-between text-green-600'>
											<div className='flex flex-col'>
												<span className='font-medium'>Unused time credit</span>
												<span className='text-xs opacity-80'>
													{Math.floor(
														previewData.usedTimeMs / (1000 * 60 * 60 * 24)
													)}
													d{" "}
													{Math.floor(
														(previewData.usedTimeMs % (1000 * 60 * 60 * 24)) /
															(1000 * 60 * 60)
													)}
													h{" "}
													{Math.floor(
														(previewData.usedTimeMs % (1000 * 60 * 60)) /
															(1000 * 60)
													)}
													m{" "}
													{Math.floor(
														(previewData.usedTimeMs % (1000 * 60)) / 1000
													)}
													s used
												</span>
											</div>
											<span className='font-bold'>
												-${(previewData.credit / 100).toFixed(2)}
											</span>
										</div>
									)}

									<div className='border-t border-slate-200 pt-2 mt-2 flex justify-between items-center'>
										<span className='font-bold text-slate-900'>
											{previewData.netAmount < 0
												? "Refund Estimate"
												: "Total Due Now"}
										</span>
										<span
											className={`text-lg font-bold ${
												previewData.netAmount < 0
													? "text-green-600"
													: "text-indigo-600"
											}`}>
											{previewData.netAmount < 0
												? `$${Math.abs(previewData.netAmount / 100).toFixed(2)}`
												: `$${(previewData.netAmount / 100).toFixed(2)}`}
										</span>
									</div>
								</div>
							) : (
								<div className='text-slate-400 text-sm italic'>
									Details unavailable
								</div>
							)}
						</div>

						<div className='flex justify-end gap-3'>
							<button
								onClick={() => {
									setConfirmingPlan(null);
									setPreviewData(null);
								}}
								className='px-4 py-2 text-slate-600 hover:bg-slate-50 font-medium rounded-lg'>
								Cancel
							</button>
							<button
								onClick={handleUpgrade}
								disabled={
									getActionType(confirmingPlan.price) === "Downgrade" &&
									confirmingPlan.features.maxInstances !== -1 &&
									instances.length - instancesToDelete.size >
										confirmingPlan.features.maxInstances
								}
								className={`px-4 py-2 text-white font-bold rounded-lg transition-colors ${
									instancesToDelete.size > 0
										? "bg-red-600 hover:bg-red-700"
										: "bg-indigo-600 hover:bg-indigo-700"
								} disabled:opacity-50 disabled:cursor-not-allowed`}>
								{instancesToDelete.size > 0
									? `Delete ${instancesToDelete.size} & Confirm`
									: "Confirm Change"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
