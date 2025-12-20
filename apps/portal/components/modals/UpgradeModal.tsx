import React, { useState, useEffect } from "react";
import { X, Check, Zap, Loader2, AlertCircle } from "lucide-react";
import { dashboardService } from "../../src/lib/dashboard";
import type { PlanInfo } from "../../src/types/auth";
import { useDashboard } from "../DashboardLayout";
interface UpgradeModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
	currentPlanId?: string;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
	isOpen,
	onClose,
	onSuccess,
	currentPlanId,
}) => {
	const { subscription, refreshInstances } = useDashboard();
	const [plans, setPlans] = useState<PlanInfo[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
	const [confirmingPlan, setConfirmingPlan] = useState<PlanInfo | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	useEffect(() => {
		if (isOpen) {
			fetchPlans();
			setConfirmingPlan(null);
			setSuccess(false);
		}
	}, [isOpen]);

	const fetchPlans = async () => {
		try {
			setLoading(true);
			const data = await dashboardService.getRecommendedPlans();
			setPlans(data);
		} catch (err) {
			console.error("Failed to fetch plans:", err);
			setError("Failed to load plans");
		} finally {
			setLoading(false);
		}
	};

	const initiateUpgrade = (plan: PlanInfo) => {
		setConfirmingPlan(plan);
	};

	const handleConfirmUpgrade = async () => {
		if (!confirmingPlan) return;

		setError(null);
		setIsProcessing(true);

		try {
			// Determine if upgrade or downgrade
			const actionType = getActionType(confirmingPlan.price);
			if (actionType === "Downgrade") {
				await dashboardService.downgradePlan(confirmingPlan.id);
				setSuccess(true);
				setTimeout(async () => {
					if (refreshInstances) {
						await refreshInstances(true);
					}
					onSuccess(); // Also trigger parent callback
					handleClose();
				}, 2000);
			} else {
				const result = await dashboardService.upgradePlan(confirmingPlan.id);
				window.location.href = result.redirectUrl;
			}
		} catch (err: any) {
			setError(err.message || "Failed to change plan");
		} finally {
			setIsProcessing(false);
		}
	};

	const handleClose = () => {
		if (!isProcessing && !success) {
			setSelectedPlan(null);
			setConfirmingPlan(null);
			setError(null);
			setSuccess(false);
			onClose();
		}
	};

	const getActionType = (targetPrice: number) => {
		const currentPrice = subscription?.price || 0;
		if (targetPrice < currentPrice) return "Downgrade";
		if (targetPrice > currentPrice) return "Upgrade";
		return "Change";
	};

	const getFeaturesList = (features: any) => {
		const list = [];
		if (features.maxInstances === -1) list.push("Unlimited Instances");
		else list.push(`${features.maxInstances} Instances`);

		list.push(`${features.storageGb} GB Storage`);

		if (features.sslCert) list.push("Free SSL Certificate");
		if (features.customDomain) list.push("Custom Domain");
		if (features.backups) list.push("Automated Backups");
		if (features.prioritySupport) list.push("Priority Support");

		return list;
	};

	if (!isOpen) return null;

	return (
		<div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
			<div className='bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto'>
				{/* Header */}
				<div className='sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10'>
					<div className='flex items-center gap-3'>
						<div className='p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg'>
							<Zap className='w-5 h-5 text-white' />
						</div>
						<div>
							<h2 className='text-xl font-bold text-slate-900'>
								{confirmingPlan
									? `Confirm ${getActionType(confirmingPlan.price)}`
									: "Upgrade Your Plan"}
							</h2>
							<p className='text-sm text-slate-500'>
								{confirmingPlan
									? "Review your plan changes"
									: "Choose a plan that fits your needs"}
							</p>
						</div>
					</div>
					<button
						onClick={handleClose}
						disabled={isProcessing || success}
						className='p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50'>
						<X className='w-5 h-5 text-slate-400' />
					</button>
				</div>

				{/* Success State */}
				{success && (
					<div className='p-8 text-center'>
						<div className='mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4'>
							<Check className='w-8 h-8 text-green-600' />
						</div>
						<h3 className='text-lg font-semibold text-slate-900 mb-2'>
							Change Successful!
						</h3>
						<p className='text-sm text-slate-600'>
							Your subscription has been updated. Refreshing...
						</p>
					</div>
				)}

				{/* Content */}
				{!success && (
					<div className='p-6'>
						{/* Error Alert */}
						{error && (
							<div className='mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800'>
								<AlertCircle className='w-4 h-4 flex-shrink-0' />
								<span>{error}</span>
							</div>
						)}

						{/* Loading State */}
						{loading && (
							<div className='py-12 text-center'>
								<Loader2 className='w-8 h-8 animate-spin mx-auto text-indigo-600 mb-3' />
								<p className='text-sm text-slate-600'>Loading plans...</p>
							</div>
						)}

						{/* Confirmation View */}
						{!loading && confirmingPlan && (
							<div className='max-w-md mx-auto'>
								<div className='bg-slate-50 rounded-xl p-6 border border-slate-200 mb-6'>
									<h4 className='font-semibold text-slate-900 mb-2'>
										New Plan Summary
									</h4>
									<div className='flex justify-between items-end mb-4'>
										<div>
											<div className='text-2xl font-bold text-indigo-600'>
												{confirmingPlan.name}
											</div>
											<div className='text-sm text-slate-500'>
												Billable Monthly
											</div>
										</div>
										<div className='text-xl font-bold text-slate-900'>
											${(confirmingPlan.price / 100).toFixed(0)}
										</div>
									</div>
									<div className='space-y-2 border-t border-slate-200 pt-4'>
										{getFeaturesList(confirmingPlan.features)
											.slice(0, 4)
											.map((f, i) => (
												<div
													key={i}
													className='flex gap-2 text-sm text-slate-700'>
													<Check className='w-4 h-4 text-green-600' /> {f}
												</div>
											))}
									</div>
								</div>

								{getActionType(confirmingPlan.price) === "Downgrade" && (
									<div className='mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800'>
										<p className='font-semibold flex items-center gap-2 mb-1'>
											<AlertCircle className='w-4 h-4' /> Warning: Downgrading
											Plan
										</p>
										<p>
											You are moving to a lower tier. Resource limits will
											decrease immediately.
										</p>
									</div>
								)}

								<div className='flex flex-col gap-3'>
									<button
										onClick={handleConfirmUpgrade}
										disabled={isProcessing}
										className='w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2'>
										{isProcessing ? (
											<Loader2 className='w-4 h-4 animate-spin' />
										) : (
											"Confirm Change"
										)}
									</button>
									<button
										onClick={() => setConfirmingPlan(null)}
										disabled={isProcessing}
										className='w-full py-3 text-slate-600 hover:bg-slate-50 font-bold rounded-xl'>
										Back
									</button>
								</div>
							</div>
						)}

						{/* Plans Grid */}
						{!loading && !confirmingPlan && (
							<div className='grid md:grid-cols-3 gap-4'>
								{plans.map((plan) => {
									const isCurrent = plan.id === currentPlanId;
									const actionType = getActionType(plan.price);
									const isDowngrade = actionType === "Downgrade";

									return (
										<div
											key={plan.id}
											className={`relative border-2 rounded-xl p-6 transition-all ${
												plan.recommended
													? "border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50"
													: isCurrent
													? "border-green-500 bg-green-50"
													: "border-slate-200 hover:border-indigo-300"
											}`}>
											{/* Recommended Badge */}
											{plan.recommended && (
												<div className='absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold rounded-full'>
													RECOMMENDED
												</div>
											)}

											{/* Current Badge */}
											{isCurrent && (
												<div className='absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-full'>
													CURRENT PLAN
												</div>
											)}

											{/* Plan Details */}
											<div className='text-center mb-4'>
												<h3 className='text-xl font-bold text-slate-900 mb-1'>
													{plan.name}
												</h3>
												<div className='text-3xl font-bold text-indigo-600'>
													${(plan.price / 100).toFixed(0)}*
													<span className='text-sm text-slate-600 font-normal'>
														/mo
													</span>
												</div>
											</div>

											{/* Features */}
											<ul className='space-y-2 mb-6'>
												{getFeaturesList(plan.features).map((feature, idx) => (
													<li
														key={idx}
														className='flex items-start gap-2 text-sm text-slate-700'>
														<Check className='w-4 h-4 text-green-600 flex-shrink-0 mt-0.5' />
														<span>{feature}</span>
													</li>
												))}
											</ul>

											{/* Action Button */}
											<button
												onClick={() => initiateUpgrade(plan)}
												disabled={isCurrent}
												className={`w-full py-2.5 rounded-lg font-medium transition-all ${
													isCurrent
														? "bg-slate-100 text-slate-500 cursor-not-allowed"
														: isDowngrade
														? "bg-amber-100 text-amber-900 hover:bg-amber-200"
														: "bg-indigo-600 hover:bg-indigo-700 text-white"
												}`}>
												{isCurrent ? "Current Plan" : `${actionType} Now`}
											</button>
										</div>
									);
								})}
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
};
