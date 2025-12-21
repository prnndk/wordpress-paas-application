import React, { useState } from "react";
import { User, Mail, Lock, Shield, Save, Loader2, Check } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { updateProfile, changePassword } from "../../src/lib/auth";

export const ProfilePage: React.FC = () => {
	const { user, refreshUser } = useAuth();

	// Profile form state
	const [firstName, setFirstName] = useState(
		user?.fullName?.split(" ")[0] || user?.name?.split(" ")[0] || ""
	);
	const [lastName, setLastName] = useState(
		user?.fullName?.split(" ").slice(1).join(" ") ||
			user?.name?.split(" ").slice(1).join(" ") ||
			""
	);
	const [email] = useState(user?.email || "");

	// Password form state
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	// Loading and feedback states
	const [profileLoading, setProfileLoading] = useState(false);
	const [passwordLoading, setPasswordLoading] = useState(false);
	const [profileSuccess, setProfileSuccess] = useState(false);
	const [passwordSuccess, setPasswordSuccess] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Two-Factor state (placeholder)
	const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

	const getInitials = () => {
		const fullName = user?.fullName || user?.name || user?.email || "";
		const parts = fullName.split(" ");
		if (parts.length >= 2) {
			return (parts[0][0] + parts[1][0]).toUpperCase();
		}
		return fullName.substring(0, 2).toUpperCase();
	};

	const handleSaveProfile = async () => {
		setError(null);
		setProfileLoading(true);
		setProfileSuccess(false);

		try {
			const fullName = `${firstName} ${lastName}`.trim();
			await updateProfile({ fullName, name: fullName });
			await refreshUser?.();
			setProfileSuccess(true);
			setTimeout(() => setProfileSuccess(false), 3000);
		} catch (err: any) {
			setError(err.message || "Failed to update profile");
		} finally {
			setProfileLoading(false);
		}
	};

	const handleChangePassword = async () => {
		setError(null);

		if (newPassword !== confirmPassword) {
			setError("New passwords do not match");
			return;
		}

		if (newPassword.length < 8) {
			setError("Password must be at least 8 characters");
			return;
		}

		setPasswordLoading(true);
		setPasswordSuccess(false);

		try {
			await changePassword(currentPassword, newPassword);
			setPasswordSuccess(true);
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
			setTimeout(() => setPasswordSuccess(false), 3000);
		} catch (err: any) {
			setError(err.message || "Failed to change password");
		} finally {
			setPasswordLoading(false);
		}
	};

	return (
		<div className='max-w-4xl mx-auto space-y-8'>
			<div>
				<h1 className='text-2xl font-bold text-slate-900'>User Profile</h1>
				<p className='text-slate-500 mt-1'>
					Manage your personal information and security settings.
				</p>
			</div>

			{/* Error Message */}
			{error && (
				<div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg'>
					{error}
				</div>
			)}

			<div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
				{/* Sidebar Info */}
				<div className='md:col-span-1 space-y-6'>
					<div className='bg-white shadow-sm rounded-xl border border-slate-200 p-6 text-center'>
						<div className='mx-auto h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-3xl border-4 border-white shadow-sm'>
							{user?.avatarUrl ? (
								<img
									src={user.avatarUrl}
									alt='Avatar'
									className='w-full h-full rounded-full object-cover'
								/>
							) : (
								getInitials()
							)}
						</div>
						<h2 className='mt-4 text-lg font-bold text-slate-900'>
							{user?.fullName || user?.name || "User"}
						</h2>
						<p className='text-sm text-slate-500'>{user?.email}</p>
						<div className='mt-4'>
							<span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
								{user?.roles?.includes("admin")
									? "Administrator"
									: "Verified Account"}
							</span>
						</div>
					</div>
				</div>

				{/* Forms */}
				<div className='md:col-span-2 space-y-6'>
					{/* Personal Info */}
					<div className='bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden'>
						<div className='px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2'>
							<User className='w-5 h-5 text-slate-400' />
							<h3 className='text-md font-bold text-slate-900'>
								Personal Information
							</h3>
						</div>
						<div className='p-6 space-y-4'>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								<div>
									<label className='block text-sm font-medium text-slate-700'>
										First Name
									</label>
									<input
										type='text'
										value={firstName}
										onChange={(e) => setFirstName(e.target.value)}
										className='mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-slate-700'>
										Last Name
									</label>
									<input
										type='text'
										value={lastName}
										onChange={(e) => setLastName(e.target.value)}
										className='mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500'
									/>
								</div>
							</div>
							<div>
								<label className='block text-sm font-medium text-slate-700'>
									Email Address
								</label>
								<div className='mt-1 relative rounded-md shadow-sm'>
									<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
										<Mail className='h-4 w-4 text-slate-400' />
									</div>
									<input
										type='email'
										value={email}
										disabled
										className='block w-full rounded-md border border-slate-300 pl-10 px-3 py-2 text-sm bg-slate-50 text-slate-500 cursor-not-allowed'
									/>
								</div>
								<p className='mt-1 text-xs text-slate-400'>
									Email cannot be changed
								</p>
							</div>
							<div className='pt-2 flex justify-end items-center gap-3'>
								{profileSuccess && (
									<span className='text-sm text-green-600 flex items-center gap-1'>
										<Check className='w-4 h-4' /> Saved!
									</span>
								)}
								<button
									onClick={handleSaveProfile}
									disabled={profileLoading}
									className='inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50'>
									{profileLoading ? (
										<Loader2 className='w-4 h-4 mr-2 animate-spin' />
									) : (
										<Save className='w-4 h-4 mr-2' />
									)}
									Save Changes
								</button>
							</div>
						</div>
					</div>

					{/* Security */}
					<div className='bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden'>
						<div className='px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2'>
							<Shield className='w-5 h-5 text-slate-400' />
							<h3 className='text-md font-bold text-slate-900'>Security</h3>
						</div>
						<div className='p-6 space-y-6'>
							{/* Password */}
							<div className='space-y-4'>
								<h4 className='text-sm font-medium text-slate-900 flex items-center gap-2'>
									<Lock className='w-4 h-4 text-slate-400' /> Change Password
								</h4>
								<div className='grid grid-cols-1 gap-4'>
									<input
										type='password'
										placeholder='Current Password'
										value={currentPassword}
										onChange={(e) => setCurrentPassword(e.target.value)}
										className='block w-full rounded-md border border-slate-300 px-3 py-2 text-sm'
									/>
									<input
										type='password'
										placeholder='New Password'
										value={newPassword}
										onChange={(e) => setNewPassword(e.target.value)}
										className='block w-full rounded-md border border-slate-300 px-3 py-2 text-sm'
									/>
									<input
										type='password'
										placeholder='Confirm New Password'
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										className='block w-full rounded-md border border-slate-300 px-3 py-2 text-sm'
									/>
								</div>
								<div className='flex items-center gap-3'>
									<button
										onClick={handleChangePassword}
										disabled={
											passwordLoading ||
											!currentPassword ||
											!newPassword ||
											!confirmPassword
										}
										className='text-sm text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed'>
										{passwordLoading ? "Updating..." : "Update Password"}
									</button>
									{passwordSuccess && (
										<span className='text-sm text-green-600 flex items-center gap-1'>
											<Check className='w-4 h-4' /> Password updated!
										</span>
									)}
								</div>
							</div>

							<div className='border-t border-slate-100 pt-6'>
								<div className='flex items-center justify-between'>
									<div>
										<h4 className='text-sm font-medium text-slate-900'>
											Two-Factor Authentication
										</h4>
										<p className='text-sm text-slate-500 mt-1'>
											Add an extra layer of security to your account.
										</p>
									</div>
									<div className='flex items-center'>
										{/* Toggle Switch */}
										<button
											onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
											className={`${
												twoFactorEnabled ? "bg-indigo-600" : "bg-slate-200"
											} relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}>
											<span
												className={`${
													twoFactorEnabled ? "translate-x-5" : "translate-x-0"
												} pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}></span>
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
