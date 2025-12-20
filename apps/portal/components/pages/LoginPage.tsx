import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
	Box,
	Lock,
	Mail,
	ArrowRight,
	Loader2,
	AlertCircle,
} from "lucide-react";
import { ApiRequestError } from "../../src/lib/api";

export const LoginPage: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const { login } = useAuth();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isLoggingIn, setIsLoggingIn] = useState(false);

	// Check if we were redirected from a protected page
	const from = location.state?.from?.pathname || "/dashboard";

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsLoggingIn(true);

		try {
			await login(email, password);
			navigate(from, { replace: true });
		} catch (err) {
			if (err instanceof ApiRequestError) {
				setError(err.message);
			} else {
				setError("An unexpected error occurred. Please try again.");
			}
		} finally {
			setIsLoggingIn(false);
		}
	};

	return (
		<div className='min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
			<div className='sm:mx-auto sm:w-full sm:max-w-md'>
				<div
					className='flex justify-center gap-2 items-center cursor-pointer'
					onClick={() => navigate("/")}>
					<div className='w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md'>
						<Box className='w-6 h-6' />
					</div>
					<h2 className='text-3xl font-extrabold text-slate-900 tracking-tight'>
						WPCube
					</h2>
				</div>
				<h2 className='mt-6 text-center text-2xl font-bold text-slate-900'>
					Sign in to your account
				</h2>
				<p className='mt-2 text-center text-sm text-slate-600'>
					Or{" "}
					<Link
						to='/signup'
						className='font-medium text-indigo-600 hover:text-indigo-500'>
						start your 14-day free trial
					</Link>
				</p>
			</div>

			<div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'>
				<div className='bg-white py-8 px-4 shadow-xl shadow-slate-200/50 border border-slate-100 sm:rounded-xl sm:px-10'>
					{error && (
						<div className='mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3'>
							<AlertCircle className='w-5 h-5 text-red-600 flex-shrink-0 mt-0.5' />
							<p className='text-sm text-red-700'>{error}</p>
						</div>
					)}

					<form className='space-y-6' onSubmit={handleLogin}>
						<div>
							<label
								htmlFor='email'
								className='block text-sm font-medium text-slate-700'>
								Email address
							</label>
							<div className='mt-1 relative rounded-md shadow-sm'>
								<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
									<Mail className='h-5 w-5 text-slate-400' />
								</div>
								<input
									id='email'
									name='email'
									type='email'
									autoComplete='email'
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className='block w-full pl-10 sm:text-sm border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 py-2 border transition-colors'
									placeholder='you@example.com'
								/>
							</div>
						</div>

						<div>
							<label
								htmlFor='password'
								className='block text-sm font-medium text-slate-700'>
								Password
							</label>
							<div className='mt-1 relative rounded-md shadow-sm'>
								<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
									<Lock className='h-5 w-5 text-slate-400' />
								</div>
								<input
									id='password'
									name='password'
									type='password'
									autoComplete='current-password'
									required
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className='block w-full pl-10 sm:text-sm border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 py-2 border transition-colors'
								/>
							</div>
						</div>

						<div className='flex items-center'>
							<input
								id='remember-me'
								name='remember-me'
								type='checkbox'
								className='h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded'
							/>
							<label
								htmlFor='remember-me'
								className='ml-2 block text-sm text-slate-900'>
								Remember me
							</label>
						</div>

						<div>
							<button
								type='submit'
								disabled={isLoggingIn}
								className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all ${
									isLoggingIn ? "opacity-70 cursor-not-allowed" : ""
								}`}>
								{isLoggingIn ? (
									<span className='flex items-center gap-2'>
										<Loader2 className='w-4 h-4 animate-spin' /> Signing in...
									</span>
								) : (
									<span className='flex items-center gap-2'>
										Sign in <ArrowRight className='w-4 h-4' />
									</span>
								)}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};
