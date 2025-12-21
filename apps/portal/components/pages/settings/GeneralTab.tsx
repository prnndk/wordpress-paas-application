import React, { useState, useRef, useEffect } from "react";
import {
	Upload,
	Trash2,
	AlertTriangle,
	Save,
	Loader2,
	RefreshCw,
	X,
	Check,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import {
	updateProfile,
	updateSettings,
	deleteAccount,
	uploadAvatar,
} from "../../../src/lib/auth";

import { ConfirmationModal } from "../../modals/ConfirmationModal";

export const GeneralTab: React.FC = () => {
	const { user, refreshUser } = useAuth();
	const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
	const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);

	const [loading, setLoading] = useState(false);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	// Form State - initialize from user data
	const [formData, setFormData] = useState({
		workspaceName: user?.fullName || user?.name || "",
		timezone: user?.timezone || "UTC",
		language: user?.language || "en",
	});

	// Update form when user changes
	useEffect(() => {
		if (user) {
			setFormData({
				workspaceName: user.fullName || user.name || "",
				timezone: user.timezone || "UTC",
				language: user.language || "en",
			});
		}
	}, [user]);

	// Avatar State
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [avatarUrl, setAvatarUrl] = useState<string | null>(
		user?.avatarUrl || null
	);
	const [isUploading, setIsUploading] = useState(false);

	// Danger Zone State
	const [transferStep, setTransferStep] = useState<
		"idle" | "input" | "confirm"
	>("idle");
	const [transferEmail, setTransferEmail] = useState("");
	const [deleteConfirm, setDeleteConfirm] = useState("");
	const [deletePassword, setDeletePassword] = useState("");
	const [deleteLoading, setDeleteLoading] = useState(false);

	// --- Handlers ---

	const handleSave = async () => {
		setLoading(true);
		setSuccessMsg(null);
		setError(null);

		try {
			// Update profile (name/fullName)
			await updateProfile({
				fullName: formData.workspaceName,
				name: formData.workspaceName,
			});

			// Update settings (timezone, language)
			await updateSettings({
				timezone: formData.timezone,
				language: formData.language,
			});

			await refreshUser?.();
			setSuccessMsg("Changes saved successfully.");
			setTimeout(() => setSuccessMsg(null), 3000);
		} catch (err: any) {
			setError(err.message || "Failed to save changes");
		} finally {
			setLoading(false);
		}
	};

	const triggerFileUpload = () => {
		fileInputRef.current?.click();
	};

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setIsUploading(true);
			setError(null);
			try {
				// Upload file to server via MinIO
				const result = await uploadAvatar(file);
				setAvatarUrl(result.avatarUrl);
				await refreshUser?.();
			} catch (err: any) {
				setError(err.message || "Failed to upload image");
			} finally {
				setIsUploading(false);
			}
		}
	};

	const handleRemoveAvatar = () => {
		setIsAvatarModalOpen(true);
	};

	const confirmRemoveAvatar = async () => {
		setIsRemovingAvatar(true);
		setError(null);
		try {
			setAvatarUrl(null);
			await updateProfile({ avatarUrl: "" });
			await refreshUser?.();
			if (fileInputRef.current) fileInputRef.current.value = "";
			setIsAvatarModalOpen(false);
		} catch (err: any) {
			setError(err.message || "Failed to remove avatar");
		} finally {
			setIsRemovingAvatar(false);
		}
	};

	const handleTransfer = () => {
		if (transferStep === "idle") setTransferStep("input");
		else if (transferStep === "input" && transferEmail) {
			setTransferStep("confirm");
		} else if (transferStep === "confirm") {
			alert(
				`Ownership transferred to ${transferEmail}. You have been logged out.`
			);
			window.location.reload();
		}
	};

	const handleDeleteWorkspace = async () => {
		if (deleteConfirm === formData.workspaceName && deletePassword) {
			setDeleteLoading(true);
			setError(null);
			try {
				await deleteAccount(deletePassword);
				alert("Account deleted. Redirecting to login...");
				window.location.href = "/login";
			} catch (err: any) {
				setError(
					err.message || "Failed to delete account. Check your password."
				);
			} finally {
				setDeleteLoading(false);
			}
		}
	};

	const getInitials = () => {
		const name = formData.workspaceName || user?.email || "";
		const parts = name.split(" ");
		if (parts.length >= 2) {
			return (parts[0][0] + parts[1][0]).toUpperCase();
		}
		return name.substring(0, 2).toUpperCase();
	};

	return (
		<div className='space-y-10 animate-in slide-in-from-left-2 duration-300 pb-10'>
			{/* Error Message */}
			{error && (
				<div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg'>
					{error}
					<button
						onClick={() => setError(null)}
						className='ml-2 text-red-500 hover:text-red-700'>
						×
					</button>
				</div>
			)}

			{/* 1. Branding Section */}
			<div className='flex flex-col md:flex-row gap-8 items-start pb-10 border-b border-slate-200'>
				<div className='w-full md:w-1/3'>
					<h3 className='text-lg font-bold text-slate-900'>Profile Picture</h3>
					<p className='text-sm text-slate-500 mt-1'>
						This image will appear on your profile and in the dashboard.
					</p>
				</div>
				<div className='w-full md:w-2/3 flex items-center gap-6'>
					<div className='relative group'>
						<div
							className={`w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold border-4 border-white shadow-md overflow-hidden ${
								avatarUrl ? "bg-white" : "bg-indigo-100 text-indigo-600"
							}`}>
							{isUploading ? (
								<Loader2 className='w-8 h-8 animate-spin text-indigo-600' />
							) : avatarUrl ? (
								<img
									src={avatarUrl}
									alt='Profile'
									className='w-full h-full object-cover'
								/>
							) : (
								getInitials()
							)}
						</div>
						{/* Hidden Input */}
						<input
							type='file'
							ref={fileInputRef}
							className='hidden'
							accept='image/*'
							onChange={handleFileChange}
						/>
					</div>
					<div className='flex flex-col gap-3'>
						<button
							onClick={triggerFileUpload}
							disabled={isUploading}
							className='px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2'>
							<Upload className='w-4 h-4' />{" "}
							{isUploading ? "Uploading..." : "Upload New Image"}
						</button>
						{avatarUrl && (
							<button
								onClick={handleRemoveAvatar}
								className='text-xs text-red-600 hover:text-red-700 font-medium text-left flex items-center gap-1'>
								<Trash2 className='w-3 h-3' /> Remove Photo
							</button>
						)}
						<p className='text-xs text-slate-400'>
							Recommended: 400x400px (JPG, PNG)
						</p>
					</div>
				</div>
			</div>

			{/* 2. Profile Info */}
			<div className='flex flex-col md:flex-row gap-8 items-start pb-10 border-b border-slate-200'>
				<div className='w-full md:w-1/3'>
					<h3 className='text-lg font-bold text-slate-900'>Account Settings</h3>
					<p className='text-sm text-slate-500 mt-1'>
						Update your account preferences.
					</p>
				</div>
				<div className='w-full md:w-2/3 space-y-6'>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
						<div className='md:col-span-2'>
							<label className='block text-sm font-bold text-slate-700 mb-2'>
								Display Name
							</label>
							<input
								type='text'
								value={formData.workspaceName}
								onChange={(e) =>
									setFormData({ ...formData, workspaceName: e.target.value })
								}
								className='w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all'
							/>
						</div>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
						<div>
							<label className='block text-sm font-bold text-slate-700 mb-2'>
								Timezone
							</label>
							<select
								value={formData.timezone}
								onChange={(e) =>
									setFormData({ ...formData, timezone: e.target.value })
								}
								className='w-full px-4 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'>
								<option value='UTC'>(GMT+00:00) UTC</option>
								<option value='America/New_York'>
									(GMT-05:00) Eastern Time
								</option>
								<option value='America/Los_Angeles'>
									(GMT-08:00) Pacific Time
								</option>
								<option value='Europe/London'>(GMT+00:00) London</option>
								<option value='Europe/Paris'>(GMT+01:00) Paris</option>
								<option value='Asia/Tokyo'>(GMT+09:00) Tokyo</option>
								<option value='Asia/Jakarta'>(GMT+07:00) Jakarta</option>
								<option value='Asia/Singapore'>(GMT+08:00) Singapore</option>
							</select>
						</div>
						<div>
							<label className='block text-sm font-bold text-slate-700 mb-2'>
								Language
							</label>
							<select
								value={formData.language}
								onChange={(e) =>
									setFormData({ ...formData, language: e.target.value })
								}
								className='w-full px-4 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'>
								<option value='en'>English (US)</option>
								<option value='id'>Bahasa Indonesia</option>
								<option value='es'>Español</option>
								<option value='de'>Deutsch</option>
								<option value='fr'>Français</option>
								<option value='ja'>日本語</option>
							</select>
						</div>
					</div>

					<div className='flex items-center justify-end pt-4 gap-4'>
						{successMsg && (
							<span className='text-sm font-medium text-green-600 animate-in fade-in flex items-center gap-1'>
								<Check className='w-4 h-4' /> {successMsg}
							</span>
						)}
						<button
							onClick={handleSave}
							disabled={loading}
							className='px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70'>
							{loading ? (
								<Loader2 className='w-4 h-4 animate-spin' />
							) : (
								<Save className='w-4 h-4' />
							)}
							{loading ? "Saving..." : "Save Changes"}
						</button>
					</div>
				</div>
			</div>

			{/* 3. Danger Zone */}
			<div className='border border-red-200 rounded-xl overflow-hidden bg-red-50/30'>
				<div className='px-6 py-4 border-b border-red-100 bg-red-50 flex items-center gap-2'>
					<AlertTriangle className='w-5 h-5 text-red-600' />
					<h3 className='font-bold text-red-900'>Danger Zone</h3>
				</div>
				<div className='p-6 space-y-8'>
					{/* Transfer Ownership Flow */}
					<div className='flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-red-100 gap-4'>
						<div className='max-w-xl'>
							<h4 className='text-sm font-bold text-slate-900'>
								Transfer Account
							</h4>
							<p className='text-sm text-slate-600 mt-1'>
								Transfer this account to another email address. You will lose
								access.
							</p>
						</div>

						{transferStep === "idle" && (
							<button
								onClick={() => setTransferStep("input")}
								className='px-4 py-2 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-bold rounded-lg text-sm transition-colors flex items-center gap-2 whitespace-nowrap'>
								<RefreshCw className='w-4 h-4' /> Transfer
							</button>
						)}

						{transferStep !== "idle" && (
							<div className='flex items-center gap-2 w-full md:w-auto'>
								<input
									type='email'
									placeholder="New owner's email"
									className='px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500'
									value={transferEmail}
									onChange={(e) => setTransferEmail(e.target.value)}
									disabled={transferStep === "confirm"}
								/>
								{transferStep === "input" ? (
									<button
										onClick={handleTransfer}
										disabled={!transferEmail}
										className='bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-slate-800'>
										Next
									</button>
								) : (
									<button
										onClick={handleTransfer}
										className='bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-red-700'>
										Confirm Transfer
									</button>
								)}
								<button
									onClick={() => {
										setTransferStep("idle");
										setTransferEmail("");
									}}
									className='p-2 text-slate-500 hover:text-slate-700'>
									<X className='w-4 h-4' />
								</button>
							</div>
						)}
					</div>

					{/* Delete Account Flow */}
					<div className='flex flex-col gap-4'>
						<div>
							<h4 className='text-sm font-bold text-slate-900'>
								Delete Account
							</h4>
							<p className='text-sm text-slate-600 mt-1'>
								Permanently delete your account and all associated data. This
								cannot be undone.
							</p>
						</div>

						<div className='flex gap-4 items-center bg-white p-4 rounded-lg border border-red-100'>
							<div className='flex-1'>
								<label className='text-xs font-bold text-slate-500 uppercase block mb-1'>
									To confirm, type "{formData.workspaceName || "your name"}"
								</label>
								<input
									type='text'
									className='w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none'
									value={deleteConfirm}
									onChange={(e) => setDeleteConfirm(e.target.value)}
									placeholder={formData.workspaceName || "your name"}
								/>
							</div>
							<button
								disabled={deleteConfirm !== formData.workspaceName}
								onClick={handleDeleteWorkspace}
								className='px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed h-10 mt-5'>
								<Trash2 className='w-4 h-4' /> Delete Account
							</button>
						</div>
					</div>
				</div>
			</div>

			<ConfirmationModal
				isOpen={isAvatarModalOpen}
				onClose={() => !isRemovingAvatar && setIsAvatarModalOpen(false)}
				onConfirm={confirmRemoveAvatar}
				title='Remove Profile Picture'
				message='Are you sure you want to remove your profile picture? This action cannot be undone.'
				confirmText='Remove Picture'
				cancelText='Keep'
				isDestructive={true}
				isLoading={isRemovingAvatar}
			/>
		</div>
	);
};
