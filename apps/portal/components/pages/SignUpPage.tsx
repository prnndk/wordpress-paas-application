import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
	Box,
	Lock,
	Mail,
	User,
	ArrowRight,
	Eye,
	EyeOff,
	Loader2,
	AlertCircle,
} from "lucide-react";
import { LegalModal } from "../modals/LegalModal";
import { useAuth } from "../../context/AuthContext";
import { ApiRequestError } from "../../src/lib/api";

export const SignUpPage: React.FC = () => {
	const navigate = useNavigate();
	const { register } = useAuth();
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

	// Legal Modal State
	const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
	const [legalTab, setLegalTab] = useState<"terms" | "privacy">("terms");

	const [formData, setFormData] = useState({
		name: "",
		email: "",
		password: "",
		confirmPassword: "",
		agreeToTerms: false,
	});

	const [errors, setErrors] = useState<{ password?: string; general?: string }>(
		{}
	);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value, type, checked } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: type === "checkbox" ? checked : value,
		}));
		// Clear errors on change
		if (name === "password" || name === "confirmPassword") {
			setErrors({});
		}
	};

	const openLegalModal = (tab: "terms" | "privacy") => {
		setLegalTab(tab);
		setIsLegalModalOpen(true);
	};

	const handleSignUp = async (e: React.FormEvent) => {
		e.preventDefault();
		setErrors({});

		if (formData.password !== formData.confirmPassword) {
			setErrors({ password: "Passwords do not match" });
			return;
		}

		setLoading(true);

		try {
			await register(formData.name, formData.email, formData.password);
			navigate("/dashboard");
		} catch (error) {
			if (error instanceof ApiRequestError) {
				setErrors({ general: error.message });
			} else {
				setErrors({
					general: "An unexpected error occurred. Please try again.",
				});
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className='min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
			{/* Legal Modal Component */}
			<LegalModal
				isOpen={isLegalModalOpen}
				onClose={() => setIsLegalModalOpen(false)}
				initialTab={legalTab}
			/>

			<div className='sm:mx-auto sm:w-full sm:max-w-md'>
				<div
					className='flex justify-center gap-2 items-center cursor-pointer'
					onClick={() => navigate("/")}>
					<div className='w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center text-white'>
						<Box className='w-6 h-6' />
					</div>
					<h2 className='text-3xl font-extrabold text-gray-900'>WPCube</h2>
				</div>
				<h2 className='mt-6 text-center text-2xl font-bold text-gray-900'>
					Start your 14-day free trial
				</h2>
				<p className='mt-2 text-center text-sm text-gray-600'>
					No credit card required. Cancel anytime.
				</p>
			</div>

			<div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'>
				<div className='bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10'>
					{errors.general && (
						<div className='mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3'>
							<AlertCircle className='w-5 h-5 text-red-600 flex-shrink-0 mt-0.5' />
							<p className='text-sm text-red-700'>{errors.general}</p>
						</div>
					)}

					<form className='space-y-6' onSubmit={handleSignUp}>
						{/* Full Name */}
						<div>
							<label
								htmlFor='name'
								className='block text-sm font-medium text-gray-700'>
								Full Name
							</label>
							<div className='mt-1 relative rounded-md shadow-sm'>
								<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
									<User className='h-5 w-5 text-gray-400' />
								</div>
								<input
									id='name'
									name='name'
									type='text'
									required
									value={formData.name}
									onChange={handleChange}
									className='focus:ring-brand-500 focus:border-brand-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border'
									placeholder='John Doe'
								/>
							</div>
						</div>

						{/* Email */}
						<div>
							<label
								htmlFor='email'
								className='block text-sm font-medium text-gray-700'>
								Email address
							</label>
							<div className='mt-1 relative rounded-md shadow-sm'>
								<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
									<Mail className='h-5 w-5 text-gray-400' />
								</div>
								<input
									id='email'
									name='email'
									type='email'
									autoComplete='email'
									required
									value={formData.email}
									onChange={handleChange}
									className='focus:ring-brand-500 focus:border-brand-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border'
									placeholder='you@example.com'
								/>
							</div>
						</div>

						{/* Password */}
						<div>
							<label
								htmlFor='password'
								className='block text-sm font-medium text-gray-700'>
								Password
							</label>
							<div className='mt-1 relative rounded-md shadow-sm'>
								<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
									<Lock className='h-5 w-5 text-gray-400' />
								</div>
								<input
									id='password'
									name='password'
									type={showPassword ? "text" : "password"}
									required
									value={formData.password}
									onChange={handleChange}
									className={`focus:ring-brand-500 focus:border-brand-500 block w-full pl-10 pr-10 sm:text-sm border-gray-300 rounded-md py-2 border ${
										errors.password
											? "border-red-300 focus:border-red-500 focus:ring-red-500"
											: ""
									}`}
									placeholder='••••••••'
								/>
								<button
									type='button'
									className='absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500'
									onClick={() => setShowPassword(!showPassword)}>
									{showPassword ? (
										<EyeOff className='h-5 w-5' />
									) : (
										<Eye className='h-5 w-5' />
									)}
								</button>
							</div>
						</div>

						{/* Confirm Password */}
						<div>
							<label
								htmlFor='confirmPassword'
								className='block text-sm font-medium text-gray-700'>
								Confirm Password
							</label>
							<div className='mt-1 relative rounded-md shadow-sm'>
								<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
									<Lock className='h-5 w-5 text-gray-400' />
								</div>
								<input
									id='confirmPassword'
									name='confirmPassword'
									type={showPassword ? "text" : "password"}
									required
									value={formData.confirmPassword}
									onChange={handleChange}
									className={`focus:ring-brand-500 focus:border-brand-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border ${
										errors.password
											? "border-red-300 focus:border-red-500 focus:ring-red-500"
											: ""
									}`}
									placeholder='••••••••'
								/>
							</div>
							{errors.password && (
								<p className='mt-2 text-sm text-red-600'>{errors.password}</p>
							)}
						</div>

						{/* Terms Checkbox */}
						<div className='flex items-start'>
							<div className='flex items-center h-5'>
								<input
									id='agreeToTerms'
									name='agreeToTerms'
									type='checkbox'
									required
									checked={formData.agreeToTerms}
									onChange={handleChange}
									className='h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded'
								/>
							</div>
							<div className='ml-2 text-sm'>
								<label htmlFor='agreeToTerms' className='text-gray-900'>
									I agree to the{" "}
									<span
										onClick={() => openLegalModal("terms")}
										className='text-indigo-600 hover:underline cursor-pointer font-medium'>
										Terms of Service
									</span>{" "}
									and{" "}
									<span
										onClick={() => openLegalModal("privacy")}
										className='text-indigo-600 hover:underline cursor-pointer font-medium'>
										Privacy Policy
									</span>
									.
								</label>
							</div>
						</div>

						<div>
							<button
								type='submit'
								disabled={loading}
								className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors ${
									loading ? "opacity-70 cursor-not-allowed" : ""
								}`}>
								{loading ? (
									<>
										<Loader2 className='animate-spin -ml-1 mr-2 h-4 w-4' />
										Creating Account...
									</>
								) : (
									<>
										Start Free Trial <ArrowRight className='ml-2 w-4 h-4' />
									</>
								)}
							</button>
						</div>
					</form>

					<div className='mt-6'>
						<div className='relative'>
							<div className='absolute inset-0 flex items-center'>
								<div className='w-full border-t border-gray-300' />
							</div>
							<div className='relative flex justify-center text-sm'>
								<span className='px-2 bg-white text-gray-500'>
									Already have an account?
								</span>
							</div>
						</div>

						<div className='mt-6 flex justify-center'>
							<Link
								to='/login'
								className='font-medium text-brand-600 hover:text-brand-500'>
								Sign in
							</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
