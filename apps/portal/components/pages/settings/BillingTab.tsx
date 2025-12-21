import React, { useState, useEffect } from "react";
import {
	CreditCard,
	CheckCircle2,
	Download,
	Zap,
	ArrowUpRight,
	AlertCircle,
	Loader2,
} from "lucide-react";
import { useDashboard } from "../../../context/DashboardContext";
import { useNavigate } from "react-router-dom";
import { dashboardService, type Invoice } from "../../../src/lib/dashboard";
import { UpgradeModal } from "../../modals/UpgradeModal";
import { PaymentMethodModal } from "../../modals/PaymentMethodModal";
import { SimpleDeleteModal } from "../../modals/SimpleDeleteModal";

export const BillingTab: React.FC = () => {
	const navigate = useNavigate();
	const { subscription, quotaUsed, quotaAllowed, refreshInstances } =
		useDashboard();
	const [showUpgradeModal, setShowUpgradeModal] = useState(false);
	const [showPaymentModal, setShowPaymentModal] = useState(false);
	const [invoices, setInvoices] = useState<Invoice[]>([]);
	const [loadingInvoices, setLoadingInvoices] = useState(true);

	const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
	const [loadingMethods, setLoadingMethods] = useState(true);

	const [deleteModal, setDeleteModal] = useState<{
		isOpen: boolean;
		id: string | null;
	}>({ isOpen: false, id: null });
	const [isDeleting, setIsDeleting] = useState(false);
	const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

	// Fetch invoices & Payment Methods on mount
	useEffect(() => {
		fetchData();
	}, []);

	const fetchData = async () => {
		try {
			setLoadingInvoices(true);
			setLoadingMethods(true);
			const [invoicesData, methodsData] = await Promise.all([
				dashboardService.getInvoices(),
				dashboardService.getPaymentMethods(),
			]);
			setInvoices(invoicesData);
			setPaymentMethods(methodsData);
		} catch (error) {
			console.error("Failed to fetch billing data:", error);
		} finally {
			setLoadingInvoices(false);
			setLoadingMethods(false);
		}
	};

	// --- Actions ---

	const handleDownloadInvoice = (invoiceId: string) => {
		// Open download URL in new tab with credentials
		const downloadUrl = dashboardService.getInvoiceDownloadUrl(invoiceId);
		window.open(downloadUrl, "_blank");
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
			// Refresh
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
			// Refresh to see updated default status
			const methods = await dashboardService.getPaymentMethods();
			setPaymentMethods(methods);
		} catch (err) {
			console.error("Failed to set default payment method", err);
			alert("Failed to update default payment method.");
		} finally {
			setSettingDefaultId(null);
		}
	};

	const handlePaymentSuccess = async () => {
		// Refresh payment methods
		const methods = await dashboardService.getPaymentMethods();
		setPaymentMethods(methods);
	};

	const handleUpgradeSuccess = async () => {
		// Refresh subscription data
		if (refreshInstances) {
			await refreshInstances(true);
		}
		fetchData();
	};

	return (
		<div className='space-y-8 animate-in slide-in-from-left-2 duration-300 relative'>
			{/* Modals */}
			<UpgradeModal
				isOpen={showUpgradeModal}
				onClose={() => setShowUpgradeModal(false)}
				onSuccess={handleUpgradeSuccess}
				currentPlanId={subscription?.planId}
			/>

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
						If this is your default payment method, subscription renewals may
						fail if you don't add another one.
					</>
				}
				isDeleting={isDeleting}
			/>

			{/* 1. Usage & Plan Overview */}
			<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
				{/* Plan Card */}
				<div className='bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col justify-between'>
					<div className='absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2'></div>

					<div>
						<div className='flex justify-between items-start mb-6'>
							<div>
								<p className='text-indigo-100 text-xs font-bold uppercase tracking-wider mb-1'>
									Current Plan
								</p>
								<h2 className='text-3xl font-extrabold'>
									{subscription?.planName || "Free Plan"}
								</h2>
							</div>
							<div className='bg-white/20 p-2 rounded-lg backdrop-blur-sm'>
								<Zap className='w-6 h-6 text-white' />
							</div>
						</div>

						<div className='space-y-4'>
							<div>
								<div className='flex justify-between text-sm font-medium mb-2'>
									<span>Instance Usage</span>
									<span>
										{quotaUsed} /{" "}
										{quotaAllowed === -1 ? "Unlimited" : quotaAllowed} Active
									</span>
								</div>
								<div className='w-full bg-indigo-900/50 rounded-full h-2'>
									<div
										className='bg-white h-2 rounded-full'
										style={{
											width: `${
												quotaAllowed === -1
													? 0
													: Math.min(100, (quotaUsed / quotaAllowed) * 100)
											}%`,
										}}></div>
								</div>
							</div>
							<p className='text-xs text-indigo-200'>
								Next billing date: <strong>December 1, 2023</strong>
							</p>
						</div>
					</div>

					<div className='mt-8 flex gap-3'>
						<button
							onClick={() => navigate("/plans")}
							className='flex-1 bg-white text-indigo-900 font-bold py-2 rounded-lg text-sm hover:bg-indigo-50 transition-colors shadow-sm'>
							View All Plans
						</button>
						<button
							onClick={() => setShowUpgradeModal(true)}
							className='px-3 py-2 bg-indigo-900/50 hover:bg-indigo-900/80 rounded-lg text-white transition-colors border border-indigo-500/30'>
							<ArrowUpRight className='w-5 h-5' />
						</button>
					</div>
				</div>

				{/* Payment Method */}
				<div className='bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between'>
					<div>
						<h3 className='font-bold text-slate-900 mb-4 flex items-center gap-2'>
							<CreditCard className='w-5 h-5 text-slate-400' /> Payment Method
						</h3>

						{loadingMethods ? (
							<div className='flex items-center justify-center py-6 text-slate-400'>
								<Loader2 className='w-5 h-5 animate-spin mr-2' />
								Loading...
							</div>
						) : paymentMethods.length > 0 ? (
							<div className='space-y-4'>
								{paymentMethods.map((method) => (
									<div
										key={method.id}
										className={`border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 relative group transition-all ${
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
													className='text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1.5 rounded transition-colors'>
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
												<svg
													xmlns='http://www.w3.org/2000/svg'
													width='16'
													height='16'
													viewBox='0 0 24 24'
													fill='none'
													stroke='currentColor'
													strokeWidth='2'
													strokeLinecap='round'
													strokeLinejoin='round'>
													<path d='M3 6h18' />
													<path d='M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6' />
													<path d='M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2' />
												</svg>
											</button>
										</div>
									</div>
								))}

								<div className='flex items-start gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200'>
									<AlertCircle className='w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5' />
									<p className='text-xs text-slate-600'>
										Your default card will be charged automatically for
										subscription renewals.
									</p>
								</div>
							</div>
						) : (
							<div className='text-center py-6 border-2 border-dashed border-slate-200 rounded-xl'>
								<div className='w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3'>
									<CreditCard className='w-6 h-6 text-slate-400' />
								</div>
								<p className='text-sm font-medium text-slate-900 mb-1'>
									No payment method
								</p>
								<p className='text-xs text-slate-500 mb-4'>
									Add a card to enable automatic billing
								</p>
							</div>
						)}
					</div>

					<button
						onClick={() => setShowPaymentModal(true)}
						className='w-full mt-6 border border-slate-300 text-slate-700 font-bold py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2'>
						<svg
							xmlns='http://www.w3.org/2000/svg'
							width='16'
							height='16'
							viewBox='0 0 24 24'
							fill='none'
							stroke='currentColor'
							strokeWidth='2'
							strokeLinecap='round'
							strokeLinejoin='round'>
							<path d='M5 12h14' />
							<path d='M12 5v14' />
						</svg>
						{paymentMethods.length > 0
							? "Add Another Card"
							: "Add Payment Method"}
					</button>
				</div>
			</div>

			{/* 2. Invoice History */}
			<div>
				<div className='flex items-center justify-between mb-4'>
					<h3 className='text-lg font-bold text-slate-900'>Invoice History</h3>
					<button className='text-sm font-medium text-indigo-600 hover:text-indigo-800'>
						Download All
					</button>
				</div>

				<div className='bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden'>
					<table className='min-w-full divide-y divide-slate-200'>
						<thead className='bg-slate-50'>
							<tr>
								<th className='px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase'>
									Invoice ID
								</th>
								<th className='px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase'>
									Date
								</th>
								<th className='px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase'>
									Amount
								</th>
								<th className='px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase'>
									Status
								</th>
								<th className='px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase'>
									Action
								</th>
							</tr>
						</thead>
						<tbody className='bg-white divide-y divide-slate-200'>
							{loadingInvoices ? (
								<tr>
									<td colSpan={5} className='px-6 py-12 text-center'>
										<Loader2 className='w-6 h-6 animate-spin mx-auto text-slate-400' />
										<p className='mt-2 text-sm text-slate-500'>
											Loading invoices...
										</p>
									</td>
								</tr>
							) : invoices.length === 0 ? (
								<tr>
									<td
										colSpan={5}
										className='px-6 py-12 text-center text-sm text-slate-500'>
										No invoices yet
									</td>
								</tr>
							) : (
								invoices.map((inv) => (
									<tr
										key={inv.id}
										className='hover:bg-slate-50 transition-colors'>
										<td className='px-6 py-4 text-sm font-medium text-slate-900'>
											{inv.invoiceNumber}
										</td>
										<td className='px-6 py-4 text-sm text-slate-500'>
											{new Date(inv.issuedAt).toLocaleDateString("en-US", {
												year: "numeric",
												month: "short",
												day: "numeric",
											})}
										</td>
										<td className='px-6 py-4 text-sm font-mono text-slate-700'>
											${(inv.amount / 100).toFixed(2)}
										</td>
										<td className='px-6 py-4 text-sm'>
											<span
												className={`px-3 py-1 rounded-full text-xs font-medium ${
													inv.status === "paid"
														? "bg-green-100 text-green-800"
														: inv.status === "overdue"
														? "bg-red-100 text-red-800"
														: "bg-slate-100 text-slate-800"
												}`}>
												{inv.status.charAt(0).toUpperCase() +
													inv.status.slice(1)}
											</span>
										</td>
										<td className='px-6 py-4 text-right'>
											<button
												onClick={() => handleDownloadInvoice(inv.id)}
												className='text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center gap-1 ml-auto transition-colors'>
												<Download className='w-4 h-4' />
												Download
											</button>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
};
