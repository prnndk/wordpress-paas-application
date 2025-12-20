import React, { useState } from "react";
import {
	Globe,
	Save,
	RefreshCw,
	AlertTriangle,
	Trash2,
	CheckCircle2,
	Loader2,
	Lock,
} from "lucide-react";

interface SettingsTabProps {
	instance: any;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ instance }) => {
	const [formData, setFormData] = useState({
		name: instance?.name || "",
		domain: "",
		debugMode: false,
	});

	const [isVerifying, setIsVerifying] = useState(false);
	const [domainVerified, setDomainVerified] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [deleteConfirm, setDeleteConfirm] = useState("");

	const handleVerifyDomain = () => {
		if (!formData.domain) return;
		setIsVerifying(true);
		setDomainVerified(false);
		setTimeout(() => {
			setIsVerifying(false);
			setDomainVerified(true);
		}, 2000);
	};

	const handleSave = () => {
		setIsSaving(true);
		setTimeout(() => {
			setIsSaving(false);
			alert("Settings saved successfully!");
		}, 1500);
	};

	return (
		<div className='space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto'>
			{/* Section 1: General */}
			<div className='bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden'>
				<div className='px-6 py-4 border-b border-slate-100 bg-slate-50/50'>
					<h3 className='font-bold text-slate-900'>General Information</h3>
					<p className='text-xs text-slate-500 mt-0.5'>
						Basic configuration for your instance.
					</p>
				</div>
				<div className='p-6 space-y-6'>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
						<div>
							<label className='block text-sm font-bold text-slate-700 mb-2'>
								Site Name
							</label>
							<input
								type='text'
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								className='w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none'
							/>
						</div>
						<div>
							<label className='block text-sm font-bold text-slate-700 mb-2'>
								Internal URL
							</label>
							<div className='flex items-center bg-slate-100 border border-slate-300 rounded-lg px-4 py-2 text-slate-500 cursor-not-allowed'>
								<Lock className='w-4 h-4 mr-2' />
								{instance?.subdomain}.wpcube.app
							</div>
						</div>
					</div>

					<div className='border-t border-slate-100 pt-6'>
						<label className='block text-sm font-bold text-slate-700 mb-2'>
							Custom Domain
						</label>
						<div className='flex gap-2'>
							<div className='relative flex-1'>
								<Globe className='absolute left-3 top-2.5 w-5 h-5 text-slate-400' />
								<input
									type='text'
									placeholder='www.yourdomain.com'
									value={formData.domain}
									onChange={(e) => {
										setFormData({ ...formData, domain: e.target.value });
										setDomainVerified(false);
									}}
									className='w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none'
								/>
							</div>
							<button
								onClick={handleVerifyDomain}
								disabled={isVerifying || !formData.domain || domainVerified}
								className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors ${
									domainVerified
										? "bg-green-100 text-green-700 border border-green-200"
										: "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200"
								}`}>
								{isVerifying ? (
									<Loader2 className='w-4 h-4 animate-spin' />
								) : domainVerified ? (
									<CheckCircle2 className='w-4 h-4' />
								) : (
									<RefreshCw className='w-4 h-4' />
								)}
								{isVerifying
									? "Verifying..."
									: domainVerified
									? "Verified"
									: "Verify DNS"}
							</button>
						</div>
						{domainVerified && (
							<p className='text-xs text-green-600 mt-2 flex items-center gap-1'>
								<CheckCircle2 className='w-3 h-3' /> CNAME record found. SSL
								will be provisioned automatically on save.
							</p>
						)}
					</div>
				</div>
			</div>

			{/* Section 2: Advanced */}
			<div className='bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden'>
				<div className='px-6 py-4 border-b border-slate-100 bg-slate-50/50'>
					<h3 className='font-bold text-slate-900'>Advanced Configuration</h3>
					<p className='text-xs text-slate-500 mt-0.5'>
						Manage runtime environment and access.
					</p>
				</div>
				<div className='p-6 space-y-6'>
					<div className='flex items-center justify-between border-b border-slate-100 pb-6'>
						<div>
							<h4 className='text-sm font-bold text-slate-900'>
								WP_DEBUG Mode
							</h4>
							<p className='text-xs text-slate-500'>
								Displays PHP errors on the frontend. Not recommended for
								production.
							</p>
						</div>
						<button
							onClick={() =>
								setFormData({ ...formData, debugMode: !formData.debugMode })
							}
							className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
								formData.debugMode ? "bg-indigo-600" : "bg-slate-200"
							}`}>
							<span
								className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
									formData.debugMode ? "translate-x-6" : "translate-x-1"
								}`}
							/>
						</button>
					</div>

					<div className='flex items-center justify-between'>
						<div>
							<h4 className='text-sm font-bold text-slate-900'>SFTP Access</h4>
							<p className='text-xs text-slate-500'>
								Reset credentials for file transfer.
							</p>
						</div>
						<button
							onClick={() => alert("Check your email for new credentials.")}
							className='px-4 py-2 text-sm font-bold text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors'>
							Reset Password
						</button>
					</div>
				</div>
			</div>

			{/* Floating Action Bar */}
			<div className='sticky bottom-6 bg-slate-900 text-white p-4 rounded-xl shadow-2xl flex justify-between items-center z-10'>
				<span className='text-sm font-medium pl-2'>
					Unsaved changes will be lost.
				</span>
				<button
					onClick={handleSave}
					disabled={isSaving}
					className='bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2'>
					{isSaving ? (
						<Loader2 className='w-4 h-4 animate-spin' />
					) : (
						<Save className='w-4 h-4' />
					)}
					{isSaving ? "Saving..." : "Save Changes"}
				</button>
			</div>

			{/* Section 3: Danger Zone */}
			<div className='border border-red-200 rounded-xl overflow-hidden bg-red-50/30'>
				<div className='px-6 py-4 border-b border-red-100 bg-red-50'>
					<h3 className='font-bold text-red-900 flex items-center gap-2'>
						<AlertTriangle className='w-5 h-5' /> Danger Zone
					</h3>
				</div>
				<div className='p-6'>
					<p className='text-sm text-slate-600 mb-4'>
						This action cannot be undone. This will permanently delete the
						<strong> {instance?.name}</strong> instance, database, and backups.
					</p>
					<div className='flex gap-4'>
						<input
							type='text'
							placeholder={`Type "${instance?.name}" to confirm`}
							value={deleteConfirm}
							onChange={(e) => setDeleteConfirm(e.target.value)}
							className='flex-1 px-4 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none'
						/>
						<button
							disabled={deleteConfirm !== instance?.name}
							className='px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'>
							<Trash2 className='w-4 h-4' /> Delete Instance
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
