import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
	ArrowLeft,
	CheckCircle,
	Loader2,
	XCircle,
	CreditCard,
	ShieldCheck,
	Plus,
	Trash2,
} from "lucide-react";
import { dashboardService } from "../../src/lib/dashboard";
import { useDashboard } from "../../context/DashboardContext";
import { PaymentMethodModal } from "../modals/PaymentMethodModal";
import { SimpleDeleteModal } from "../modals/SimpleDeleteModal";

export const CheckoutPage: React.FC = () => {
	const { checkoutId } = useParams<{ checkoutId: string }>();
	const navigate = useNavigate();
	const { refreshInstances, subscription } = useDashboard();

	const [status, setStatus] = useState<
		"verifying" | "processing" | "success" | "error"
	>("verifying");
	const [message, setMessage] = useState("Initializing secure checkout...");
	const [plans, setPlans] = useState<any[]>([]);
	const [targetPlan, setTargetPlan] = useState<any>(null);
	const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
	const [prorationDetails, setProrationDetails] = useState<any>(null);

	// Modals & Action State
	const [showPaymentModal, setShowPaymentModal] = useState(false);
	const [deleteModal, setDeleteModal] = useState<{
		isOpen: boolean;
		id: string | null;
	}>({ isOpen: false, id: null });
	const [isDeleting, setIsDeleting] = useState(false);
	const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

	// Validation Effect: Prevent re-entry
	useEffect(() => {
		if (!checkoutId) return;

		const isInvalid = () => {
			try {
				const list = JSON.parse(
					localStorage.getItem("consumed_checkouts") || "[]"
				);
				return list.includes(checkoutId);
			} catch {
				return false;
			}
		};

		const checkSubscription = () => {
			if (targetPlan && subscription && subscription.planId === targetPlan.id) {
				return true;
			}
			return false;
		};

		if (isInvalid() || checkSubscription()) {
			navigate("/plans", { replace: true });
		}
	}, [checkoutId, targetPlan, subscription, navigate]);

	useEffect(() => {
		const initCheckout = async () => {
			if (!checkoutId) {
				setStatus("error");
				setMessage("Invalid checkout session.");
				return;
			}

			try {
				// 1. Fetch Plans & Payment Methods in parallel
				const [plansData, methodsData] = await Promise.all([
					dashboardService.getPlans(),
					dashboardService.getPaymentMethods(),
				]);

				setPlans(plansData);
				setPaymentMethods(methodsData);

				// 2. Decode Checkout ID
				if (checkoutId.startsWith("mock_json_")) {
					const base64 = checkoutId.substring(10);
					const jsonStr = atob(base64);
					const payload = JSON.parse(jsonStr);

					const plan = plansData.find((p: any) => p.id === payload.planId);
					if (plan) setTargetPlan(plan);

					setProrationDetails(payload);
				}
				// Legacy
				else if (checkoutId.startsWith("mock_")) {
					const base64 = checkoutId.substring(5);
					const decoded = atob(base64);
					const parts = decoded.split(":");

					if (parts.length >= 2) {
						const planId = parts[1];
						const plan = plansData.find((p: any) => p.id === planId);
						if (plan) setTargetPlan(plan);

						// Legacy amount parsing if present
						if (parts[3]) {
							setProrationDetails({
								netAmount: parseFloat(parts[3]),
								credit: 0,
							});
						}
					}
				}

				// Simulate loading provider UI
				setTimeout(() => {
					setStatus("processing");
					setMessage("Please review your payment details below.");
				}, 1000);
			} catch (err) {
				console.error("Checkout init failed:", err);
				setStatus("error");
				setMessage("Could not load checkout details.");
			}
		};

		initCheckout();
	}, [checkoutId]);

	// --- Payment Method Management Handlers ---

	const handlePaymentSuccess = async () => {
		const methods = await dashboardService.getPaymentMethods();
		setPaymentMethods(methods);
	};

	const confirmDelete = (id: string) => {
		setDeleteModal({ isOpen: true, id });
	};

	const handleDeletePaymentMethod = async () => {
		if (!deleteModal.id) return;
		try {
			setIsDeleting(true);
			await dashboardService.deletePaymentMethod(deleteModal.id);
			setDeleteModal({ isOpen: false, id: null });
			const methods = await dashboardService.getPaymentMethods();
			setPaymentMethods(methods);
		} catch (err) {
			console.error("Failed to delete payment method", err);
			alert("Could not delete payment method.");
		} finally {
			setIsDeleting(false);
		}
	};

	const handleSetDefault = async (id: string) => {
		try {
			setSettingDefaultId(id);
			await dashboardService.setDefaultPaymentMethod(id);
			const methods = await dashboardService.getPaymentMethods();
			setPaymentMethods(methods);
		} catch (err) {
			console.error("Failed to set default payment method", err);
			alert("Failed to update default payment method.");
		} finally {
			setSettingDefaultId(null);
		}
	};

	const handleConfirmPayment = async () => {
		if (!checkoutId) return;

		if (paymentMethods.length === 0) {
			alert("Please add a payment method first.");
			return;
		}

		try {
			setStatus("verifying");
			setMessage("Processing payment...");

			// Simulate network delay
			await new Promise((resolve) => setTimeout(resolve, 1500));

			// Call backend confirm
			await dashboardService.confirmCheckout(checkoutId, "success");

			// Mark as consumed
			const list = JSON.parse(
				localStorage.getItem("consumed_checkouts") || "[]"
			);
			if (!list.includes(checkoutId)) {
				list.push(checkoutId);
				localStorage.setItem("consumed_checkouts", JSON.stringify(list));
			}

			setStatus("success");
			setMessage("Payment successful! Upgrading your subscription...");

			// Force refresh data
			if (refreshInstances) {
				await refreshInstances(true);
			}

			// Redirect after delay
			setTimeout(() => {
				navigate("/plans");
			}, 3000);
		} catch (err: any) {
			setStatus("error");
			setMessage(err.message || "Payment processing failed. Please try again.");
		}
	};

	const handleCancel = () => {
		if (checkoutId) {
			const list = JSON.parse(
				localStorage.getItem("consumed_checkouts") || "[]"
			);
			if (!list.includes(checkoutId)) {
				list.push(checkoutId);
				localStorage.setItem("consumed_checkouts", JSON.stringify(list));
			}
		}
		navigate("/plans");
	};

	if (!checkoutId) return null;

	return (
		<div className='min-h-screen bg-slate-50 flex items-center justify-center p-4'>
			<PaymentMethodModal
				isOpen={showPaymentModal}
				onClose={() => setShowPaymentModal(false)}
				onSuccess={handlePaymentSuccess}
			/>

			<SimpleDeleteModal
				isOpen={deleteModal.isOpen}
				onClose={() => setDeleteModal({ isOpen: false, id: null })}
				onConfirm={handleDeletePaymentMethod}
				title='Delete Payment Method?'
				message={
					<>
						Are you sure you want to remove this payment method?
						<br />
						If this is your default payment method, please ensure you have
						another method to complete the checkout.
					</>
				}
				isDeleting={isDeleting}
			/>

			<div className='max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-300'>
				{/* Header */}
				<div className='bg-slate-900 px-6 py-6 text-white text-center'>
					<div className='flex justify-center mb-3'>
						<div className='bg-indigo-500 p-3 rounded-full'>
							<CreditCard className='w-8 h-8 text-white' />
						</div>
					</div>
					<h1 className='text-xl font-bold'>Secure Checkout</h1>
					<p className='text-slate-400 text-sm mt-1'>
						Simulated Payment Provider
					</p>
				</div>

				{/* Content */}
				<div className='p-8'>
					{status === "success" ? (
						<div className='text-center py-6'>
							<div className='w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-300'>
								<CheckCircle className='w-10 h-10' />
							</div>
							<h2 className='text-2xl font-bold text-slate-900 mb-2'>
								Success!
							</h2>
							<p className='text-slate-600 mb-6'>
								Your payment has been processed and your subscription upgraded.
							</p>
							<div className='text-sm text-slate-400'>
								Redirecting directly to dashboard...
							</div>
						</div>
					) : status === "error" ? (
						<div className='text-center py-6'>
							<div className='w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4'>
								<XCircle className='w-10 h-10' />
							</div>
							<h2 className='text-xl font-bold text-slate-900 mb-2'>
								Payment Failed
							</h2>
							<p className='text-red-600 mb-6'>{message}</p>
							<button
								onClick={() => setStatus("processing")}
								className='w-full py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors'>
								Try Again
							</button>
							<button
								onClick={handleCancel}
								className='mt-4 text-slate-500 hover:text-slate-800 text-sm font-medium'>
								Cancel and Return
							</button>
						</div>
					) : (
						<div>
							{/* Order Breakdown */}
							<div className='bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100'>
								<h3 className='text-sm font-semibold text-slate-800 mb-3 uppercase tracking-wide'>
									Order Breakdown
								</h3>

								{/* New Plan Price */}
								<div className='flex justify-between items-center mb-2 text-sm'>
									<span className='text-slate-600'>
										{targetPlan ? `${targetPlan.name} Plan` : "Subscription"}
									</span>
									<span className='font-medium text-slate-900'>
										{prorationDetails?.newPlanPrice
											? `$${(prorationDetails.newPlanPrice / 100).toFixed(2)}`
											: targetPlan
											? `$${(targetPlan.price / 100).toFixed(2)}`
											: "..."}
									</span>
								</div>

								{/* Proration Credit */}
								{prorationDetails && prorationDetails.credit > 0 && (
									<div className='flex justify-between items-start mb-2 text-sm animate-in slide-in-from-left duration-300'>
										<div className='flex flex-col'>
											<span className='text-green-600 font-medium'>
												Unused time credit ({prorationDetails.currentPlanName})
											</span>
											{prorationDetails.usedTimeMs > 0 && (
												<span className='text-xs text-slate-400'>
													Used for{" "}
													{Math.floor(
														prorationDetails.usedTimeMs / (1000 * 60 * 60 * 24)
													)}
													d{" "}
													{Math.floor(
														(prorationDetails.usedTimeMs %
															(1000 * 60 * 60 * 24)) /
															(1000 * 60 * 60)
													)}
													h{" "}
													{Math.floor(
														(prorationDetails.usedTimeMs % (1000 * 60 * 60)) /
															(1000 * 60)
													)}
													m{" "}
													{Math.floor(
														(prorationDetails.usedTimeMs % (1000 * 60)) / 1000
													)}
													s
												</span>
											)}
										</div>
										<span className='font-bold text-green-600'>
											-${(prorationDetails.credit / 100).toFixed(2)}
										</span>
									</div>
								)}

								<div className='border-t border-slate-200 my-2 pt-2 flex justify-between items-center'>
									<span className='font-bold text-slate-900'>
										Total Due Today
									</span>
									<span className='font-bold text-xl text-indigo-600'>
										{prorationDetails
											? prorationDetails.netAmount < 0
												? `-$${Math.abs(
														prorationDetails.netAmount / 100
												  ).toFixed(2)} (Refund)`
												: `$${(prorationDetails.netAmount / 100).toFixed(2)}`
											: "Calculating..."}
									</span>
								</div>

								<div className='text-right text-xs text-slate-400 mt-1'>
									Next billing date:{" "}
									{new Date(
										new Date().setMonth(new Date().getMonth() + 1)
									).toLocaleDateString()}
								</div>
							</div>

							{/* Payment Method Section */}
							<div className='mb-6'>
								<div className='flex justify-between items-center mb-2'>
									<h3 className='text-sm font-medium text-slate-700'>
										Payment Methods
									</h3>
								</div>

								{paymentMethods.length > 0 ? (
									<div className='space-y-3'>
										{paymentMethods.map((method) => (
											<div
												key={method.id}
												className={`border rounded-xl p-3 flex flex-col sm:flex-row sm:items-center gap-3 relative group transition-all ${
													method.isDefault
														? "bg-indigo-50/30 border-indigo-200 ring-1 ring-indigo-500/10"
														: "bg-white border-slate-200 hover:border-slate-300"
												}`}>
												<div className='w-auto min-w-[3rem] h-8 px-2 bg-white border border-slate-200 rounded flex items-center justify-center shrink-0 shadow-sm'>
													<span className='font-bold text-slate-700 text-[10px] uppercase tracking-wide'>
														{method.brand === "amex" ? "AMEX" : method.brand}
													</span>
												</div>
												<div className='flex-1 min-w-0'>
													<div className='flex items-center gap-2'>
														<p className='text-sm font-bold text-slate-900 truncate capitalize'>
															•••• {method.last4}
														</p>
														{method.isDefault && (
															<span className='px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded uppercase tracking-wide'>
																Default
															</span>
														)}
													</div>
													<p className='text-xs text-slate-500'>
														Expires {method.expMonth}/{method.expYear}
													</p>
												</div>

												<div className='flex items-center gap-2 ml-auto'>
													{!method.isDefault && (
														<button
															onClick={() => handleSetDefault(method.id)}
															disabled={settingDefaultId === method.id}
															className='text-[10px] font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1.5 rounded transition-colors whitespace-nowrap'>
															{settingDefaultId === method.id ? (
																<Loader2 className='w-3 h-3 animate-spin' />
															) : (
																"Set Default"
															)}
														</button>
													)}
													<button
														onClick={() => confirmDelete(method.id)}
														className='p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors'
														title='Delete card'>
														<span className='sr-only'>Delete</span>
														<Trash2 className='w-4 h-4' />
													</button>
												</div>
											</div>
										))}

										<button
											onClick={() => setShowPaymentModal(true)}
											className='text-xs text-indigo-600 font-medium hover:text-indigo-800 flex items-center gap-1 mx-auto mt-2'>
											<Plus className='w-3 h-3' /> Add another card
										</button>
									</div>
								) : (
									<button
										onClick={() => setShowPaymentModal(true)}
										className='w-full border border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors group'>
										<div className='bg-white p-2 rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform'>
											<CreditCard className='w-6 h-6 text-slate-400 group-hover:text-indigo-500 transition-colors' />
										</div>
										<p className='text-sm font-medium text-slate-900'>
											Add Payment Method
										</p>
										<p className='text-xs text-slate-500 mt-1'>
											Securely save your card for future billing
										</p>
									</button>
								)}
							</div>

							<button
								onClick={handleConfirmPayment}
								disabled={status === "verifying" || paymentMethods.length === 0}
								className={`
                                    w-full py-3.5 font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2
                                    ${
																			status === "verifying" ||
																			paymentMethods.length === 0
																				? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
																				: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200"
																		}
                                `}>
								{status === "verifying" ? (
									<>
										<Loader2 className='w-5 h-5 animate-spin' />
										Processing...
									</>
								) : (
									<>
										Confirm Payment{" "}
										<ShieldCheck className='w-4 h-4 ml-1 opacity-70' />
									</>
								)}
							</button>

							<div className='mt-4 text-center'>
								<button
									onClick={handleCancel}
									className='text-slate-400 hover:text-slate-600 text-sm font-medium flex items-center justify-center gap-1 mx-auto'>
									<ArrowLeft className='w-3 h-3' /> Cancel
								</button>
							</div>
						</div>
					)}
				</div>

				{/* Footer trust marks */}
				<div className='bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-center gap-4'>
					<div className='text-xs text-slate-400 font-medium flex items-center gap-1'>
						<ShieldCheck className='w-3 h-3' /> SSL Secure
					</div>
				</div>
			</div>
		</div>
	);
};
