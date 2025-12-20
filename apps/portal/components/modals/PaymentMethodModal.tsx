import React, { useState } from "react";
import { X, CreditCard, Check, AlertCircle, Loader2 } from "lucide-react";
import { dashboardService } from "../../src/lib/dashboard";

interface PaymentMethodModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

export const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
	isOpen,
	onClose,
	onSuccess,
}) => {
	const [formData, setFormData] = useState({
		cardNumber: "",
		expMonth: "",
		expYear: "",
		cvv: "",
		cardholderName: "",
	});
	const [isProcessing, setIsProcessing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	if (!isOpen) return null;

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
		setError(null);
	};

	const detectCardBrand = (cardNumber: string): string => {
		const cleaned = cardNumber.replace(/\s/g, "");
		if (cleaned.startsWith("4")) return "visa";
		if (cleaned.startsWith("5")) return "mastercard";
		if (cleaned.startsWith("3")) return "amex";
		return "unknown";
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsProcessing(true);

		try {
			// Validate form
			const cleaned = formData.cardNumber.replace(/\s/g, "");
			if (cleaned.length < 13) {
				throw new Error("Invalid card number");
			}

			const month = parseInt(formData.expMonth);
			const year = parseInt(formData.expYear);
			if (month < 1 || month > 12) {
				throw new Error("Invalid expiration month");
			}
			if (year < new Date().getFullYear()) {
				throw new Error("Card is expired");
			}

			// Mock: create payment method
			const method = await dashboardService.addPaymentMethod({
				token: `tok_mock_${Date.now()}`,
				brand: detectCardBrand(formData.cardNumber),
				last4: cleaned.slice(-4),
				expMonth: month,
				expYear: year,
				setAsDefault: true,
			});

			// Success - show confirmation and notify parent
			setSuccess(true);
			setTimeout(() => {
				onSuccess();
				onClose();
			}, 1500);
		} catch (err: any) {
			const msg =
				err?.data?.message || err?.message || "Failed to add payment method";
			setError(msg);
		} finally {
			setIsProcessing(false);
		}
	};

	const handleClose = () => {
		if (!isProcessing && !success) {
			setFormData({
				cardNumber: "",
				expMonth: "",
				expYear: "",
				cvv: "",
				cardholderName: "",
			});
			setError(null);
			setSuccess(false);
			onClose();
		}
	};

	return (
		<div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
			<div className='bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto'>
				{/* Header */}
				<div className='sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between'>
					<div className='flex items-center gap-3'>
						<div className='p-2 bg-indigo-100 rounded-lg'>
							<CreditCard className='w-5 h-5 text-indigo-600' />
						</div>
						<div>
							<h2 className='text-xl font-bold text-slate-900'>
								Update Payment Method
							</h2>
							<p className='text-sm text-slate-500'>Add a new card</p>
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
					<div className='p-6 text-center'>
						<div className='mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4'>
							<Check className='w-8 h-8 text-green-600' />
						</div>
						<h3 className='text-lg font-semibold text-slate-900 mb-2'>
							Payment Method Added!
						</h3>
						<p className='text-sm text-slate-600'>
							Your card has been saved successfully
						</p>
					</div>
				)}

				{/* Form */}
				{!success && (
					<form onSubmit={handleSubmit} className='p-6 space-y-4'>
						{/* Error Alert */}
						{error && (
							<div className='flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800'>
								<AlertCircle className='w-4 h-4 flex-shrink-0' />
								<span>{error}</span>
							</div>
						)}

						{/* Mock Notice */}
						<div className='flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800'>
							<AlertCircle className='w-4 h-4 flex-shrink-0' />
							<span>
								<strong>Mock Mode:</strong> Any card number works (e.g., 4242
								4242 4242 4242)
							</span>
						</div>

						{/* Card Brand */}
						<div>
							<label className='block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider'>
								Card Brand
							</label>
							<div className='flex gap-2 mb-4'>
								{["visa", "mastercard", "amex"].map((brand) => (
									<button
										key={brand}
										type='button'
										onClick={
											() => setFormData((prev) => ({ ...prev, cardNumber: "" })) // clear if needed or just handle logic
										}
										className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-center capitalize ${
											detectCardBrand(formData.cardNumber) === brand
												? "border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600"
												: "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
										}`}>
										{brand}
									</button>
								))}
							</div>
						</div>

						{/* Cardholder Name */}
						<div>
							<label className='block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider'>
								Cardholder Name
							</label>
							<input
								type='text'
								name='cardholderName'
								value={formData.cardholderName}
								onChange={handleChange}
								placeholder='John Doe'
								required
								className='block w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all'
							/>
						</div>

						{/* Card Number */}
						<div>
							<label className='block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider'>
								Card Number
							</label>
							<div className='relative'>
								<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
									<CreditCard className='h-4 w-4 text-slate-400' />
								</div>
								<input
									type='text'
									name='cardNumber'
									value={formData.cardNumber}
									onChange={handleChange}
									placeholder='4242 4242 4242 4242'
									maxLength={19}
									required
									className='block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono'
								/>
							</div>
						</div>

						{/* Expiration & CVV */}
						<div className='grid grid-cols-3 gap-3'>
							<div>
								<label className='block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider'>
									Month
								</label>
								<input
									type='text'
									name='expMonth'
									value={formData.expMonth}
									onChange={handleChange}
									placeholder='MM'
									maxLength={2}
									required
									className='block w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center transition-all'
								/>
							</div>
							<div>
								<label className='block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider'>
									Year
								</label>
								<input
									type='text'
									name='expYear'
									value={formData.expYear}
									onChange={handleChange}
									placeholder='YYYY'
									maxLength={4}
									required
									className='block w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center transition-all'
								/>
							</div>
							<div>
								<label className='block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider'>
									CVV
								</label>
								<input
									type='text'
									name='cvv'
									value={formData.cvv}
									onChange={handleChange}
									placeholder='123'
									maxLength={4}
									required
									className='block w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center transition-all font-mono'
								/>
							</div>
						</div>

						{/* Submit Button */}
						<div className='pt-4 flex gap-3'>
							<button
								type='button'
								onClick={handleClose}
								disabled={isProcessing}
								className='flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors disabled:opacity-50'>
								Cancel
							</button>
							<button
								type='submit'
								disabled={isProcessing}
								className='flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2'>
								{isProcessing ? (
									<>
										<Loader2 className='w-4 h-4 animate-spin' />
										Processing...
									</>
								) : (
									"Add Card"
								)}
							</button>
						</div>
					</form>
				)}
			</div>
		</div>
	);
};
