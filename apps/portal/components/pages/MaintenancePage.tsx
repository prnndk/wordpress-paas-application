import React, { useState, useEffect } from "react";
import {
	Wrench,
	RefreshCw,
	Bell,
	Plus,
	Trash2,
	ToggleLeft,
	ToggleRight,
	Loader2,
	CheckCircle2,
	XCircle,
	AlertTriangle,
	Info,
	X,
	ChevronRight,
} from "lucide-react";
import {
	adminService,
	Announcement,
	RollingUpdateResult,
	CreateAnnouncementPayload,
} from "../../src/lib/admin";

export const MaintenancePage: React.FC = () => {
	const [currentImage, setCurrentImage] = useState<string>("");
	const [newImage, setNewImage] = useState<string>("");
	const [announcements, setAnnouncements] = useState<Announcement[]>([]);
	const [loading, setLoading] = useState(true);
	const [updating, setUpdating] = useState(false);
	const [updateResult, setUpdateResult] = useState<RollingUpdateResult | null>(
		null
	);
	const [forceUpdate, setForceUpdate] = useState(true);
	const [toast, setToast] = useState<string | null>(null);

	// Modal State
	const [showModal, setShowModal] = useState(false);
	const [announcementForm, setAnnouncementForm] =
		useState<CreateAnnouncementPayload>({
			title: "",
			message: "",
			type: "info",
			scheduledAt: undefined,
			expiresAt: undefined,
		});

	const showToast = (msg: string) => {
		setToast(msg);
		setTimeout(() => setToast(null), 3000);
	};

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [imageData, announcementsData] = await Promise.all([
					adminService.getCurrentImage(),
					adminService.getAnnouncements(),
				]);

				setCurrentImage(imageData.currentImage);
				setNewImage(imageData.currentImage);
				setAnnouncements(announcementsData);
			} catch (error: any) {
				console.error("Failed to fetch data:", error);
				showToast("Failed to load maintenance data");
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	const handleRollingUpdate = async () => {
		if (!newImage) return;

		setUpdating(true);
		setUpdateResult(null);

		try {
			const result = await adminService.startRollingUpdate(
				newImage,
				forceUpdate
			);
			setUpdateResult(result);
			if (result.success) {
				setCurrentImage(newImage);
				showToast("Rolling update completed successfully");
			}
		} catch (error: any) {
			setUpdateResult({
				success: false,
				servicesUpdated: [],
				errors: [error.message || "Failed to start rolling update"],
			});
		} finally {
			setUpdating(false);
		}
	};

	const createAnnouncement = async () => {
		try {
			const newAnnouncement = await adminService.createAnnouncement(
				announcementForm
			);
			setAnnouncements([newAnnouncement, ...announcements]);
			setShowModal(false);
			setAnnouncementForm({
				title: "",
				message: "",
				type: "info",
				scheduledAt: undefined,
				expiresAt: undefined,
			});
			showToast("Announcement created");
		} catch (error: any) {
			console.error("Failed to create announcement:", error);
			showToast("Failed to create announcement");
		}
	};

	const toggleAnnouncement = async (id: string, isActive: boolean) => {
		try {
			await adminService.toggleAnnouncement(id, isActive);
			setAnnouncements(
				announcements.map((a) => (a.id === id ? { ...a, isActive } : a))
			);
			showToast(`Announcement ${isActive ? "activated" : "deactivated"}`);
		} catch (error: any) {
			console.error("Failed to toggle announcement:", error);
			showToast("Failed to update announcement");
		}
	};

	const deleteAnnouncement = async (id: string) => {
		try {
			await adminService.deleteAnnouncement(id);
			setAnnouncements(announcements.filter((a) => a.id !== id));
			showToast("Announcement deleted");
		} catch (error: any) {
			console.error("Failed to delete announcement:", error);
			showToast("Failed to delete announcement");
		}
	};

	const getTypeIcon = (type: string) => {
		switch (type) {
			case "warning":
				return <AlertTriangle className='w-4 h-4 text-yellow-500' />;
			case "maintenance":
				return <Wrench className='w-4 h-4 text-orange-500' />;
			default:
				return <Info className='w-4 h-4 text-blue-500' />;
		}
	};

	if (loading) {
		return (
			<div className='flex items-center justify-center min-h-[400px]'>
				<Loader2 className='w-8 h-8 animate-spin text-indigo-600' />
			</div>
		);
	}

	return (
		<div className='bg-slate-50/50 min-h-screen space-y-8 animate-in fade-in duration-500 pb-10'>
			{/* Toast */}
			{toast && (
				<div className='fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl z-[9999] animate-in slide-in-from-bottom-5 border border-slate-700/50 backdrop-blur-sm'>
					{toast}
				</div>
			)}

			{/* Modal */}
			{showModal && (
				<div className='fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200'>
					<div className='bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100'>
						<div className='flex items-center justify-between mb-6'>
							<h3 className='text-xl font-bold text-slate-900'>
								Create Announcement
							</h3>
							<button
								onClick={() => setShowModal(false)}
								className='p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-700'>
								<X className='w-5 h-5' />
							</button>
						</div>

						<div className='space-y-5'>
							<div>
								<label className='block text-sm font-semibold text-slate-700 mb-1.5'>
									Title
								</label>
								<input
									type='text'
									value={announcementForm.title}
									onChange={(e) =>
										setAnnouncementForm({
											...announcementForm,
											title: e.target.value,
										})
									}
									placeholder='e.g., Scheduled Maintenance'
									className='w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm'
								/>
							</div>

							<div>
								<label className='block text-sm font-semibold text-slate-700 mb-1.5'>
									Message
								</label>
								<textarea
									value={announcementForm.message}
									onChange={(e) =>
										setAnnouncementForm({
											...announcementForm,
											message: e.target.value,
										})
									}
									placeholder='Detailed description of the announcement...'
									rows={4}
									className='w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm resize-none'
								/>
							</div>

							<div>
								<label className='block text-sm font-semibold text-slate-700 mb-1.5'>
									Type
								</label>
								<div className='relative'>
									<select
										value={announcementForm.type}
										onChange={(e) =>
											setAnnouncementForm({
												...announcementForm,
												type: e.target.value as any,
											})
										}
										className='w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm appearance-none bg-white'>
										<option value='info'>Info (Blue)</option>
										<option value='warning'>Warning (Yellow)</option>
										<option value='maintenance'>Maintenance (Red)</option>
									</select>
									<div className='absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-slate-500'>
										<ChevronRight className='w-4 h-4 rotate-90' />
									</div>
								</div>
							</div>

							<div className='grid grid-cols-2 gap-4'>
								<div>
									<label className='block text-sm font-semibold text-slate-700 mb-1.5'>
										Scheduled At
									</label>
									<input
										type='datetime-local'
										value={announcementForm.scheduledAt || ""}
										onChange={(e) =>
											setAnnouncementForm({
												...announcementForm,
												scheduledAt: e.target.value || undefined,
											})
										}
										className='w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs text-slate-600'
									/>
								</div>
								<div>
									<label className='block text-sm font-semibold text-slate-700 mb-1.5'>
										Expires At
									</label>
									<input
										type='datetime-local'
										value={announcementForm.expiresAt || ""}
										onChange={(e) =>
											setAnnouncementForm({
												...announcementForm,
												expiresAt: e.target.value || undefined,
											})
										}
										className='w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs text-slate-600'
									/>
								</div>
							</div>

							<button
								onClick={createAnnouncement}
								disabled={!announcementForm.title || !announcementForm.message}
								className='w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl font-semibold shadow-md shadow-indigo-200 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none mt-2'>
								Create Announcement
							</button>
						</div>
					</div>
				</div>
			)}

			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-2xl font-bold text-slate-900 tracking-tight'>
						System Maintenance
					</h1>
					<p className='text-slate-500 mt-1'>
						Manage platform updates and system-wide announcements
					</p>
				</div>
			</div>

			<div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
				{/* Rolling Update Section */}
				<div className='lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-fit'>
					<div className='p-6 border-b border-slate-100 bg-slate-50/50'>
						<div className='flex items-center gap-3 mb-1'>
							<div className='p-2 bg-indigo-100 rounded-lg text-indigo-600'>
								<RefreshCw className='w-5 h-5' />
							</div>
							<h2 className='text-lg font-bold text-slate-900'>
								Rolling Update
							</h2>
						</div>
						<p className='text-sm text-slate-500'>
							Update all WordPress instances to a new Docker image versions
						</p>
					</div>

					<div className='p-6 space-y-6'>
						<div>
							<label className='block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2'>
								Current Image
							</label>
							<div className='bg-slate-100 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-mono text-sm break-all'>
								{currentImage || "Loading..."}
							</div>
						</div>

						<div>
							<label className='block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2'>
								New Image Tag
							</label>
							<input
								type='text'
								value={newImage}
								onChange={(e) => setNewImage(e.target.value)}
								placeholder='prnndk/wp-paas-wordpress:latest'
								className='w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-sm'
							/>
						</div>

						<label className='flex items-center gap-3 cursor-pointer group'>
							<div className='relative flex items-center'>
								<input
									type='checkbox'
									checked={forceUpdate}
									onChange={(e) => setForceUpdate(e.target.checked)}
									className='peer sr-only'
								/>
								<div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
							</div>
							<span className='text-sm font-medium text-slate-700 group-hover:text-slate-900'>
								Force Pull Image
							</span>
						</label>

						<div className='space-y-3 pt-2'>
							<button
								onClick={handleRollingUpdate}
								disabled={
									updating ||
									!newImage ||
									(!forceUpdate && newImage === currentImage)
								}
								className='w-full inline-flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none'>
								{updating ? (
									<>
										<Loader2 className='w-5 h-5 mr-2 animate-spin' />
										Updating...
									</>
								) : (
									<>
										<RefreshCw className='w-5 h-5 mr-2' />
										Start Rolling Update
									</>
								)}
							</button>

							<button
								onClick={() => {
									setNewImage("prnndk/wp-paas-wordpress:latest");
									setForceUpdate(true);
								}}
								className='w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900 transition-colors'>
								Reset to Latest
							</button>
						</div>

						{updateResult && (
							<div
								className={`p-4 rounded-xl border ${
									updateResult.success
										? "bg-green-50 border-green-100 text-green-900"
										: "bg-red-50 border-red-100 text-red-900"
								} animate-in fade-in slide-in-from-top-2`}>
								<div className='flex items-start gap-3'>
									{updateResult.success ? (
										<CheckCircle2 className='w-5 h-5 text-green-600 flex-shrink-0 mt-0.5' />
									) : (
										<XCircle className='w-5 h-5 text-red-600 flex-shrink-0 mt-0.5' />
									)}
									<div>
										<span className='font-bold block mb-1'>
											{updateResult.success
												? "Update Complete"
												: "Update Failed"}
										</span>
										{updateResult.servicesUpdated.length > 0 && (
											<p className='text-sm opacity-90'>
												Updated: {updateResult.servicesUpdated.join(", ")}
											</p>
										)}
										{updateResult.errors.length > 0 && (
											<p className='text-sm opacity-90 mt-1'>
												Errors: {updateResult.errors.join(", ")}
											</p>
										)}
									</div>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Announcements Section */}
				<div className='lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-fit'>
					<div className='p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50'>
						<div className='flex items-center gap-3'>
							<div className='p-2 bg-amber-100 rounded-lg text-amber-600'>
								<Bell className='w-5 h-5' />
							</div>
							<div>
								<h2 className='text-lg font-bold text-slate-900'>
									Announcements
								</h2>
								<p className='text-sm text-slate-500 hidden sm:block'>
									Active announcements visible to all users
								</p>
							</div>
						</div>
						<button
							onClick={() => setShowModal(true)}
							className='inline-flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors shadow-sm'>
							<Plus className='w-4 h-4 mr-2' />
							New
						</button>
					</div>

					<div className='overflow-x-auto'>
						<table className='w-full'>
							<thead className='bg-slate-50 border-b border-slate-100'>
								<tr>
									<th className='px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-16'>
										Type
									</th>
									<th className='px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider'>
										Content
									</th>
									<th className='px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-24'>
										Status
									</th>
									<th className='px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-32'>
										Created
									</th>
									<th className='px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-24'>
										Actions
									</th>
								</tr>
							</thead>
							<tbody className='divide-y divide-slate-100'>
								{announcements.map((announcement) => (
									<tr
										key={announcement.id}
										className='hover:bg-slate-50/80 transition-colors group'>
										<td className='px-6 py-4'>
											<div
												className={`w-8 h-8 rounded-full flex items-center justify-center ${
													announcement.type === "warning"
														? "bg-yellow-100"
														: announcement.type === "maintenance"
														? "bg-orange-100"
														: "bg-blue-100"
												}`}>
												{getTypeIcon(announcement.type)}
											</div>
										</td>
										<td className='px-6 py-4'>
											<div>
												<div className='font-bold text-slate-900'>
													{announcement.title}
												</div>
												<div className='text-sm text-slate-500 max-w-md line-clamp-2 mt-0.5'>
													{announcement.message}
												</div>
											</div>
										</td>
										<td className='px-6 py-4'>
											<span
												className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${
													announcement.isActive
														? "bg-green-50 text-green-700 ring-green-600/20"
														: "bg-slate-100 text-slate-700 ring-slate-500/20"
												}`}>
												<span
													className={`w-1.5 h-1.5 rounded-full ${
														announcement.isActive
															? "bg-green-600"
															: "bg-slate-500"
													}`}></span>
												{announcement.isActive ? "Active" : "Inactive"}
											</span>
										</td>
										<td className='px-6 py-4 text-slate-500 text-xs font-medium'>
											{new Date(announcement.createdAt).toLocaleDateString()}
										</td>
										<td className='px-6 py-4 text-right'>
											<div className='flex items-center justify-end gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity'>
												<button
													title={
														announcement.isActive ? "Deactivate" : "Activate"
													}
													onClick={() =>
														toggleAnnouncement(
															announcement.id,
															!announcement.isActive
														)
													}
													className={`p-2 rounded-lg transition-colors ${
														announcement.isActive
															? "text-slate-400 hover:text-green-600 hover:bg-green-50"
															: "text-slate-300 hover:text-green-600 hover:bg-green-50"
													}`}>
													{announcement.isActive ? (
														<ToggleRight className='w-5 h-5' />
													) : (
														<ToggleLeft className='w-5 h-5' />
													)}
												</button>
												<button
													title='Delete'
													onClick={() => deleteAnnouncement(announcement.id)}
													className='p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors'>
													<Trash2 className='w-4 h-4' />
												</button>
											</div>
										</td>
									</tr>
								))}
								{announcements.length === 0 && (
									<tr>
										<td
											colSpan={5}
											className='px-6 py-16 text-center text-slate-500'>
											<div className='bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4'>
												<Bell className='w-8 h-8 text-slate-400' />
											</div>
											<h3 className='text-slate-900 font-medium mb-1'>
												No announcements
											</h3>
											<p className='text-slate-500 text-sm'>
												Create an announcement to notify users.
											</p>
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
};
