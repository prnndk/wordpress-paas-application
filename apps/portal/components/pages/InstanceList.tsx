import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useDashboard } from "../../context/DashboardContext";
import { useAuth } from "../../context/AuthContext";
import {
	Search,
	Filter,
	MoreHorizontal,
	Power,
	RotateCw,
	Trash2,
	ExternalLink,
	Terminal,
	Loader2,
	Database,
	Layout,
	CheckSquare,
	Square,
	Copy,
	ArrowRight,
	Layers,
	Play,
	StopCircle,
	Users,
	Shield,
	Hammer,
} from "lucide-react";

import { LogViewerModal } from "../modals/LogViewerModal";

import { BackupManagerModal } from "../modals/BackupManagerModal";
import { DeleteConfirmationModal } from "../modals/DeleteConfirmationModal";
import { dashboardService } from "../../src/lib/dashboard";
import { adminService, type AdminTenant } from "../../src/lib/admin";
import type { Instance } from "../../context/DashboardContext";

export const InstanceList: React.FC = () => {
	const navigate = useNavigate();
	const { user } = useAuth();
	const {
		instances: myInstances,
		updateInstanceStatus,
		deleteInstance,
		addInstance,
		refreshInstances,
		setCreateModalOpen,
	} = useDashboard();

	// Check if user is admin
	const isAdmin = user?.roles?.includes("admin");

	// -- UI State --
	const [viewMode, setViewMode] = useState<"my" | "all">("my");
	const [adminTenants, setAdminTenants] = useState<AdminTenant[]>([]);
	const [loadingAdminTenants, setLoadingAdminTenants] = useState(false);

	const [filter, setFilter] = useState<"all" | "running" | "stopped">("all");
	const [search, setSearch] = useState("");
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [activeMenu, setActiveMenu] = useState<{
		id: string;
		top: number;
		left: number;
	} | null>(null);

	// Modals State
	const [logViewer, setLogViewer] = useState<{
		isOpen: boolean;
		instanceId: string;
		instanceName: string;
	}>({ isOpen: false, instanceId: "", instanceName: "" });

	const [backupManager, setBackupManager] = useState<{
		isOpen: boolean;
		instanceId: string;
		instanceName: string;
	}>({ isOpen: false, instanceId: "", instanceName: "" });

	const [deleteConfirm, setDeleteConfirm] = useState<{
		isOpen: boolean;
		instanceId: string;
		instanceName: string;
	}>({ isOpen: false, instanceId: "", instanceName: "" });

	// Action confirmation state (for start/stop/restart)
	const [actionConfirm, setActionConfirm] = useState<{
		isOpen: boolean;
		action: "start" | "stop" | "restart" | null;
		instanceId: string;
		instanceName: string;
	}>({ isOpen: false, action: null, instanceId: "", instanceName: "" });

	// Rebuild confirmation state
	const [rebuildConfirm, setRebuildConfirm] = useState<{
		isOpen: boolean;
		instanceId: string;
		instanceName: string;
	}>({ isOpen: false, instanceId: "", instanceName: "" });
	const [rebuildLoading, setRebuildLoading] = useState(false);

	const [bulkActionLoading, setBulkActionLoading] = useState(false);
	const [toast, setToast] = useState<{ message: string; visible: boolean }>({
		message: "",
		visible: false,
	});

	// Fetch Admin Tenants when view mode changes to 'all'
	useEffect(() => {
		if (isAdmin && viewMode === "all") {
			fetchAdminTenants();
		}
	}, [isAdmin, viewMode]);

	// Handle view mode switch from URL query param (optional, for direct linking)
	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const view = params.get("view");
		if (isAdmin && view === "all") {
			setViewMode("all");
		}
	}, [isAdmin]);

	const fetchAdminTenants = async (silent: boolean = false) => {
		try {
			if (!silent) setLoadingAdminTenants(true);
			const data = await adminService.getAllTenants();
			setAdminTenants(data);
		} catch (error) {
			console.error("Failed to fetch admin tenants", error);
			showToast("Failed to fetch all tenants");
		} finally {
			if (!silent) setLoadingAdminTenants(false);
		}
	};

	// Real-time polling for instance updates
	useEffect(() => {
		const interval = setInterval(() => {
			// Only refresh if page is visible
			if (!document.hidden) {
				if (viewMode === "all" && isAdmin) {
					fetchAdminTenants(true);
				} else {
					refreshInstances(true);
				}
			}
		}, 5000); // 5 seconds

		return () => clearInterval(interval);
	}, [viewMode, isAdmin, refreshInstances]);

	// Determine which list to display
	const displayInstances =
		viewMode === "all"
			? adminTenants.map((t) => ({
					id: t.id,
					name: t.name,
					slug: t.subdomain, // mapping subdomain to slug
					region: "us-east-1", // default or from data
					plan: t.planId,
					status: t.status as "running" | "stopped" | "provisioning" | "error",
					ip: "N/A", // Not always avail in list
					endpoints: {
						site: `http://${t.subdomain}.${import.meta.env.VITE_BASE_DOMAIN}`,
						admin: `http://${t.subdomain}.${
							import.meta.env.VITE_BASE_DOMAIN
						}/wp-admin`,
					},
					specs: { cpu: "N/A", ram: "N/A" }, // placeholder
					created_at: t.createdAt,
					// Extra admin fields
					ownerEmail: t.user?.email,
					replicas: t.docker?.desiredReplicas || t.replicas || 1,
					runningReplicas: t.docker?.runningReplicas || 0,
			  }))
			: myInstances;

	const showToast = (message: string) => {
		setToast({ message, visible: true });
		setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000);
	};

	// Close menu on click outside
	useEffect(() => {
		const handleClickOutside = () => setActiveMenu(null);
		document.addEventListener("click", handleClickOutside);
		return () => document.removeEventListener("click", handleClickOutside);
	}, []);

	const filteredInstances = displayInstances.filter((instance) => {
		const matchesFilter = filter === "all" || instance.status === filter;
		const matchesSearch =
			instance.name.toLowerCase().includes(search.toLowerCase()) ||
			instance.slug.toLowerCase().includes(search.toLowerCase()) ||
			// @ts-ignore
			instance.ownerEmail?.toLowerCase().includes(search.toLowerCase());

		return matchesFilter && matchesSearch;
	});

	const toggleSelection = (id: string) => {
		const newSet = new Set(selectedIds);
		if (newSet.has(id)) {
			newSet.delete(id);
		} else {
			newSet.add(id);
		}
		setSelectedIds(newSet);
	};

	const toggleSelectAll = () => {
		if (selectedIds.size === filteredInstances.length) {
			setSelectedIds(new Set());
		} else {
			setSelectedIds(new Set(filteredInstances.map((i) => i.id)));
		}
	};

	const handleAction = (
		action: string,
		instance: any // using any to accept both standard and admin shapes broadly
	) => {
		setActiveMenu(null);
		switch (action) {
			case "start":
			case "stop":
			case "restart":
				// Show confirmation dialog instead of immediate execution
				setActionConfirm({
					isOpen: true,
					action: action as "start" | "stop" | "restart",
					instanceId: instance.id,
					instanceName: instance.name,
				});
				break;
			case "logs":
				setLogViewer({
					isOpen: true,
					instanceId: instance.id,
					instanceName: instance.name,
				});
				break;
			case "backup":
				setBackupManager({
					isOpen: true,
					instanceId: instance.id,
					instanceName: instance.name,
				});
				break;
			case "delete":
				setDeleteConfirm({
					isOpen: true,
					instanceId: instance.id,
					instanceName: instance.name,
				});
				break;
			case "visit":
				if (instance.endpoints?.site) {
					window.open(instance.endpoints.site, "_blank");
				}
				break;
			case "wp-admin":
				if (instance.endpoints?.admin) {
					window.open(instance.endpoints.admin, "_blank");
				}
				break;
			case "view-details":
				navigate(`/instance/${instance.id}`);
				break;
			case "rebuild":
				setRebuildConfirm({
					isOpen: true,
					instanceId: instance.id,
					instanceName: instance.name,
				});
				break;
		}
	};

	// Execute action after confirmation
	const executeConfirmedAction = async () => {
		const { action, instanceId, instanceName } = actionConfirm;
		if (!action || !instanceId) return;

		setActionConfirm((prev) => ({ ...prev, isOpen: false }));

		// Get API method
		const method =
			action === "start"
				? dashboardService.startTenant
				: action === "stop"
				? dashboardService.stopTenant
				: dashboardService.restartTenant;

		// Optimistic update
		const newStatus =
			action === "start" || action === "restart" ? "provisioning" : "stopped";

		if (viewMode === "my") {
			updateInstanceStatus(instanceId, newStatus);
		} else {
			setAdminTenants((prev) =>
				prev.map((t) => (t.id === instanceId ? { ...t, status: newStatus } : t))
			);
		}

		try {
			await method(instanceId);
			showToast(
				`${
					action.charAt(0).toUpperCase() + action.slice(1)
				} command sent for ${instanceName}`
			);
			// Refresh after delay
			setTimeout(() => {
				if (viewMode === "all") fetchAdminTenants();
				else refreshInstances();
			}, 1500);
		} catch (err) {
			showToast(`Failed to ${action} instance`);
			if (viewMode === "all") fetchAdminTenants();
			else refreshInstances();
		}
	};

	const handleDeleteConfirm = async () => {
		const { instanceId } = deleteConfirm;
		if (!instanceId) return;

		try {
			await dashboardService.deleteTenant(instanceId);
			setDeleteConfirm((prev) => ({ ...prev, isOpen: false }));
			showToast("Instance deleted successfully");

			// Optimistic update
			if (viewMode === "my") {
				deleteInstance(instanceId);
			} else {
				setAdminTenants((prev) => prev.filter((t) => t.id !== instanceId));
			}

			// Refresh list
			setTimeout(() => {
				if (viewMode === "all") fetchAdminTenants();
				else refreshInstances();
			}, 1000);
		} catch (error) {
			console.error("Failed to delete instance", error);
			showToast("Failed to delete instance");
		}
	};

	const handleBulkAction = async (
		action: "start" | "stop" | "restart" | "delete"
	) => {
		if (selectedIds.size === 0 || bulkActionLoading) return;

		if (action === "delete") {
			if (
				!window.confirm(
					`Are you sure you want to delete ${selectedIds.size} instances? This cannot be undone.`
				)
			)
				return;
		}

		setBulkActionLoading(true);
		// Show initial toast
		const actionMap = {
			start: "Starting",
			stop: "Stopping",
			restart: "Restarting",
			delete: "Deleting",
		};
		showToast(`${actionMap[action]} ${selectedIds.size} instances...`);

		try {
			const promises = Array.from(selectedIds).map(async (id: string) => {
				// Optimistic update for non-delete actions
				if (action !== "delete") {
					const status = action === "stop" ? "stopped" : "provisioning";
					if (viewMode === "my") {
						updateInstanceStatus(id, status);
					} else {
						setAdminTenants((prev) =>
							prev.map((t) => (t.id === id ? { ...t, status: status } : t))
						);
					}
				}

				switch (action) {
					case "start":
						await dashboardService.startTenant(id);
						break;
					case "stop":
						await dashboardService.stopTenant(id);
						break;
					case "restart":
						await dashboardService.restartTenant(id);
						break;
					case "delete":
						await dashboardService.deleteTenant(id);
						break;
				}
			});

			await Promise.all(promises);
			showToast(`Bulk ${action} completed successfully`);
			setSelectedIds(new Set());
			if (viewMode === "all") fetchAdminTenants();
			else refreshInstances();
		} catch (error) {
			console.error("Bulk action failed", error);
			showToast("Some operations failed. Check console for details.");
			if (viewMode === "all") fetchAdminTenants();
			else refreshInstances();
		} finally {
			setBulkActionLoading(false);
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "running":
				return "bg-emerald-100 text-emerald-700 border-emerald-200";
			case "stopped":
				return "bg-slate-100 text-slate-700 border-slate-200";
			case "provisioning":
				return "bg-indigo-100 text-indigo-700 border-indigo-200";
			case "error":
				return "bg-red-100 text-red-700 border-red-200";
			default:
				return "bg-slate-100 text-slate-600 border-slate-200";
		}
	};

	return (
		<div className='max-w-7xl mx-auto pb-12'>
			{/* Toast */}
			{toast.visible &&
				createPortal(
					<div className='fixed bottom-8 right-8 bg-slate-900 text-white px-6 py-3 rounded-lg shadow-xl z-50 animate-in slide-in-from-bottom-5 fade-in duration-300'>
						{toast.message}
					</div>,
					document.body
				)}

			{/* Delete Confirmation Modal */}
			<DeleteConfirmationModal
				isOpen={deleteConfirm.isOpen}
				onClose={() => setDeleteConfirm((prev) => ({ ...prev, isOpen: false }))}
				onConfirm={handleDeleteConfirm}
				instanceName={deleteConfirm.instanceName}
			/>

			{/* Log Viewer Modal */}
			<LogViewerModal
				isOpen={logViewer.isOpen}
				onClose={() => setLogViewer((prev) => ({ ...prev, isOpen: false }))}
				instanceId={logViewer.instanceId}
				instanceName={logViewer.instanceName}
			/>

			{/* Rebuild Confirmation Modal */}
			{rebuildConfirm.isOpen &&
				createPortal(
					<div className='fixed inset-0 flex items-center justify-center z-[9999]'>
						<div
							className='absolute inset-0 bg-black/50 backdrop-blur-sm'
							onClick={() =>
								setRebuildConfirm((prev) => ({ ...prev, isOpen: false }))
							}></div>
						<div className='relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 animate-in zoom-in-95 fade-in duration-200'>
							<div className='text-center mb-6'>
								<div className='w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-amber-100 text-amber-600'>
									<Hammer className='w-8 h-8' />
								</div>
								<h3 className='text-xl font-bold text-slate-900'>
									Rebuild Instance?
								</h3>
								<p className='text-slate-500 mt-2'>
									This will recreate containers with the latest image. Your data
									will be preserved.
								</p>
								<p className='text-sm text-slate-400 mt-1'>
									Instance:{" "}
									<span className='font-semibold text-slate-700'>
										{rebuildConfirm.instanceName}
									</span>
								</p>
							</div>
							<div className='flex gap-3'>
								<button
									onClick={() =>
										setRebuildConfirm((prev) => ({ ...prev, isOpen: false }))
									}
									className='flex-1 px-4 py-3 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors'>
									Cancel
								</button>
								<button
									onClick={async () => {
										const { instanceId, instanceName } = rebuildConfirm;
										setRebuildConfirm((prev) => ({ ...prev, isOpen: false }));
										setRebuildLoading(true);
										try {
											if (viewMode === "my") {
												updateInstanceStatus(instanceId, "provisioning");
											} else {
												setAdminTenants((prev) =>
													prev.map((t) =>
														t.id === instanceId
															? { ...t, status: "provisioning" }
															: t
													)
												);
											}
											showToast(`Rebuilding ${instanceName}...`);
											await dashboardService.rebuildTenant(instanceId);
											showToast("Rebuild initiated successfully");
											setTimeout(() => {
												if (viewMode === "all") fetchAdminTenants();
												else refreshInstances();
											}, 2000);
										} catch (err: any) {
											showToast(`Rebuild failed: ${err.message}`);
											if (viewMode === "all") fetchAdminTenants();
											else refreshInstances();
										} finally {
											setRebuildLoading(false);
										}
									}}
									disabled={rebuildLoading}
									className='flex-1 px-4 py-3 text-sm font-semibold text-white bg-amber-600 rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50'>
									{rebuildLoading ? "Rebuilding..." : "Rebuild"}
								</button>
							</div>
						</div>
					</div>,
					document.body
				)}

			{/* Action Confirmation Modal */}
			{actionConfirm.isOpen &&
				createPortal(
					<div className='fixed inset-0 flex items-center justify-center z-[9999]'>
						<div
							className='absolute inset-0 bg-black/50 backdrop-blur-sm'
							onClick={() =>
								setActionConfirm((prev) => ({ ...prev, isOpen: false }))
							}></div>
						<div className='relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 animate-in zoom-in-95 fade-in duration-200'>
							<div className='text-center mb-6'>
								<div
									className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
										actionConfirm.action === "stop"
											? "bg-amber-100 text-amber-600"
											: actionConfirm.action === "restart"
											? "bg-blue-100 text-blue-600"
											: "bg-emerald-100 text-emerald-600"
									}`}>
									{actionConfirm.action === "stop" ? (
										<Power className='w-8 h-8' />
									) : actionConfirm.action === "restart" ? (
										<RotateCw className='w-8 h-8' />
									) : (
										<Play className='w-8 h-8' />
									)}
								</div>
								<h3 className='text-xl font-bold text-slate-900'>
									{actionConfirm.action?.charAt(0).toUpperCase() +
										(actionConfirm.action?.slice(1) || "")}{" "}
									Instance?
								</h3>
								<p className='text-slate-500 mt-2'>
									Are you sure you want to {actionConfirm.action}{" "}
									<span className='font-semibold text-slate-700'>
										{actionConfirm.instanceName}
									</span>
									?
								</p>
							</div>
							<div className='flex gap-3'>
								<button
									onClick={() =>
										setActionConfirm((prev) => ({ ...prev, isOpen: false }))
									}
									className='flex-1 px-4 py-3 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors'>
									Cancel
								</button>
								<button
									onClick={executeConfirmedAction}
									className={`flex-1 px-4 py-3 text-sm font-semibold text-white rounded-xl transition-colors ${
										actionConfirm.action === "stop"
											? "bg-amber-600 hover:bg-amber-700"
											: actionConfirm.action === "restart"
											? "bg-blue-600 hover:bg-blue-700"
											: "bg-emerald-600 hover:bg-emerald-700"
									}`}>
									{actionConfirm.action?.charAt(0).toUpperCase() +
										(actionConfirm.action?.slice(1) || "")}
								</button>
							</div>
						</div>
					</div>,
					document.body
				)}

			{/* Header */}
			<div className='flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8'>
				<div>
					<h1 className='text-3xl font-extrabold text-slate-900 tracking-tight'>
						{viewMode === "all" ? "All Tenants" : "My Instances"}
					</h1>
					<p className='text-slate-500 mt-1'>
						{viewMode === "all"
							? "Manage all platform instances"
							: "Manage and monitor your WordPress sites"}
					</p>
				</div>

				{/* Admin View Toggle */}
				{isAdmin && (
					<div className='flex bg-slate-100 p-1 rounded-lg'>
						<button
							onClick={() => setViewMode("my")}
							className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
								viewMode === "my"
									? "bg-white text-indigo-600 shadow-sm"
									: "text-slate-500 hover:text-slate-900"
							}`}>
							My Instances
						</button>
						<button
							onClick={() => setViewMode("all")}
							className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
								viewMode === "all"
									? "bg-white text-indigo-600 shadow-sm"
									: "text-slate-500 hover:text-slate-900"
							}`}>
							<Shield className='w-3 h-3' /> All Tenants
						</button>
					</div>
				)}
			</div>

			{/* Controls Toolbar */}
			<div className='bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4'>
				{/* Left: Search & Filter */}
				<div className='flex items-center gap-3 w-full md:w-auto'>
					<div className='relative flex-1 md:w-64'>
						<Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400' />
						<input
							type='text'
							placeholder='Search instances...'
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className='w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all'
						/>
					</div>
					<div className='flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1'>
						{(["all", "running", "stopped"] as const).map((s) => (
							<button
								key={s}
								onClick={() => setFilter(s)}
								className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
									filter === s
										? "bg-white text-indigo-600 shadow-sm"
										: "text-slate-500 hover:text-slate-700"
								}`}>
								{s}
							</button>
						))}
					</div>
				</div>

				{/* Right: Actions */}
				<div className='flex items-center gap-3 w-full md:w-auto justify-between md:justify-end'>
					{selectedIds.size > 0 && (
						<div className='flex items-center gap-2 animate-in fade-in duration-200'>
							<span className='text-xs font-medium text-slate-500'>
								{selectedIds.size} selected
							</span>
							<div className='h-4 w-px bg-slate-200 mx-2' />
							<button
								onClick={() => handleBulkAction("start")}
								className='p-2 text-slate-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors'
								title='Start Selected'>
								<Play className='w-4 h-4' />
							</button>
							<button
								onClick={() => handleBulkAction("stop")}
								className='p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors'
								title='Stop Selected'>
								<StopCircle className='w-4 h-4' />
							</button>
							<button
								onClick={() => handleBulkAction("restart")}
								className='p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors'
								title='Restart Selected'>
								<RotateCw className='w-4 h-4' />
							</button>
							<button
								onClick={() => handleBulkAction("delete")}
								className='p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors'
								title='Delete Selected'>
								<Trash2 className='w-4 h-4' />
							</button>
						</div>
					)}
					<button
						onClick={() =>
							viewMode === "all" ? fetchAdminTenants() : refreshInstances(true)
						} // Handle refresh based on mode
						className='p-2 text-slate-400 hover:text-indigo-600 transition-colors'
						title='Refresh List'>
						<RotateCw className='w-4 h-4' />
					</button>
				</div>
			</div>

			{/* List Content */}
			<div className='bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]'>
				{viewMode === "all" && loadingAdminTenants ? (
					<div className='flex flex-col items-center justify-center p-12 h-64'>
						<Loader2 className='w-8 h-8 animate-spin text-indigo-600 mb-4' />
						<p className='text-slate-500'>Loading all tenants...</p>
					</div>
				) : filteredInstances.length > 0 ? (
					<table className='w-full text-left border-collapse'>
						<thead>
							<tr className='bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider'>
								<th className='py-3 px-4 w-12 text-center'>
									<button
										onClick={toggleSelectAll}
										className='text-slate-400 hover:text-indigo-600 transition-colors'>
										{selectedIds.size === filteredInstances.length &&
										filteredInstances.length > 0 ? (
											<CheckSquare className='w-4 h-4 text-indigo-600' />
										) : (
											<Square className='w-4 h-4' />
										)}
									</button>
								</th>
								<th className='py-3 px-4'>Instance</th>
								{viewMode === "all" && <th className='py-3 px-4'>Owner</th>}
								{viewMode === "all" && <th className='py-3 px-4'>Replicas</th>}
								<th className='py-3 px-4'>Status</th>
								<th className='py-3 px-4 text-right'>Actions</th>
							</tr>
						</thead>
						<tbody className='divide-y divide-slate-100'>
							{filteredInstances.map((instance) => (
								<tr
									key={instance.id}
									className={`group hover:bg-slate-50/80 transition-colors ${
										selectedIds.has(instance.id) ? "bg-indigo-50/30" : ""
									}`}>
									<td className='py-4 px-4 text-center'>
										<button
											onClick={() => toggleSelection(instance.id)}
											className='text-slate-300 hover:text-indigo-600 transition-colors'>
											{selectedIds.has(instance.id) ? (
												<CheckSquare className='w-4 h-4 text-indigo-600' />
											) : (
												<Square className='w-4 h-4' />
											)}
										</button>
									</td>
									<td className='py-4 px-4'>
										<div className='flex items-center gap-3'>
											<div className='w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200 text-white font-bold text-lg'>
												{instance.name.charAt(0).toUpperCase()}
											</div>
											<div
												className='cursor-pointer'
												onClick={() => handleAction("view-details", instance)}>
												<h3 className='font-bold text-slate-900 group-hover:text-indigo-600 transition-colors'>
													{instance.name}
												</h3>
												<div className='flex items-center gap-2 text-xs text-slate-500 mt-0.5'>
													<span className='font-mono'>/{instance.slug}</span>
													<span>•</span>
													<span>{instance.plan}</span>
												</div>
											</div>
										</div>
									</td>
									{viewMode === "all" && (
										<td className='py-4 px-4 text-sm text-slate-600'>
											{/* @ts-ignore */}
											{instance.ownerEmail || "Unknown"}
										</td>
									)}
									{viewMode === "all" && (
										<td className='py-4 px-4 text-sm text-slate-600 font-mono'>
											{/* @ts-ignore */}
											{instance.runningReplicas ?? 0} / {instance.replicas ?? 1}
										</td>
									)}
									<td className='py-4 px-4'>
										<span
											className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(
												instance.status
											)}`}>
											{instance.status}
										</span>
									</td>
									<td className='py-4 px-4 text-right relative'>
										<button
											onClick={(e) => {
												e.stopPropagation();
												const rect = e.currentTarget.getBoundingClientRect();
												setActiveMenu(
													activeMenu?.id === instance.id
														? null
														: {
																id: instance.id,
																top: rect.bottom + window.scrollY + 4,
																left: rect.right + window.scrollX - 180,
														  }
												);
											}}
											className='p-2 text-slate-400 hover:bg-slate-100 peer-hover:text-slate-600 rounded-lg transition-colors'>
											<MoreHorizontal className='w-5 h-5' />
										</button>

										{/* Context Menu */}
										{activeMenu?.id === instance.id &&
											createPortal(
												<div
													className='fixed bg-white rounded-xl shadow-xl border border-slate-100 w-48 py-1 z-50 animate-in fade-in zoom-in-95 duration-100'
													style={{
														top: activeMenu.top,
														left: activeMenu.left,
													}}>
													<button
														onClick={() =>
															handleAction("view-details", instance)
														}
														className='w-full text-left px-4 py-2.5 text-sm md:hidden text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2'>
														<Layers className='w-4 h-4' /> View Details
													</button>
													<div className='px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider'>
														Power
													</div>
													{instance.status === "stopped" ? (
														<button
															onClick={() => handleAction("start", instance)}
															className='w-full text-left px-4 py-2.5 text-sm text-green-600 hover:bg-green-50 font-medium flex items-center gap-2'>
															<Play className='w-4 h-4' /> Start
														</button>
													) : (
														<>
															<button
																onClick={() =>
																	handleAction("restart", instance)
																}
																className='w-full text-left px-4 py-2.5 text-sm text-indigo-600 hover:bg-indigo-50 font-medium flex items-center gap-2'>
																<RotateCw className='w-4 h-4' /> Restart
															</button>
															<button
																onClick={() => handleAction("stop", instance)}
																className='w-full text-left px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 font-medium flex items-center gap-2'>
																<StopCircle className='w-4 h-4' /> Stop
															</button>
														</>
													)}

													<div className='h-px bg-slate-100 my-1' />
													<div className='px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider'>
														Tools
													</div>
													<button
														onClick={() => handleAction("visit", instance)}
														className='w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 font-medium flex items-center gap-2'>
														<ExternalLink className='w-4 h-4' /> Visit Site
													</button>
													<button
														onClick={() => handleAction("wp-admin", instance)}
														className='w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 font-medium flex items-center gap-2'>
														<Layout className='w-4 h-4' /> WP Admin
													</button>
													<button
														onClick={() => handleAction("logs", instance)}
														className='w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 font-medium flex items-center gap-2'>
														<Terminal className='w-4 h-4' /> Logs
													</button>
													<button
														onClick={() => handleAction("backup", instance)}
														className='w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 font-medium flex items-center gap-2'>
														<Database className='w-4 h-4' /> Backups
													</button>

													<div className='h-px bg-slate-100 my-1' />
													<button
														onClick={() => handleAction("delete", instance)}
														className='w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium flex items-center gap-2'>
														<Trash2 className='w-4 h-4' /> Delete
													</button>
												</div>,
												document.body
											)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				) : (
					<div className='flex flex-col items-center justify-center p-12 text-center'>
						<div className='bg-slate-100 p-4 rounded-full mb-4'>
							<Layers className='w-8 h-8 text-slate-400' />
						</div>
						<h3 className='text-lg font-bold text-slate-900 mb-1'>
							No instances found
						</h3>
						<p className='text-slate-500 mb-6 max-w-sm'>
							{search || filter !== "all"
								? "Try adjusting your search or filters to find what you're looking for."
								: viewMode === "all"
								? "There are no instances in the platform yet."
								: "You haven't created any instances yet. Launch your first WordPress site now!"}
						</p>
						{!search && filter === "all" && viewMode === "my" && (
							<button
								onClick={() => setCreateModalOpen(true)}
								className='px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2'>
								<Layers className='w-4 h-4' /> Create Instance
							</button>
						)}
					</div>
				)}
			</div>
		</div>
	);
};
