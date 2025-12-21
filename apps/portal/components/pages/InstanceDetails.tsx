import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDashboard } from "../../context/DashboardContext";
import { StatusBadge } from "../StatusBadge";
import { dashboardService } from "../../src/lib/dashboard";
import { adminService, type AdminTenant } from "../../src/lib/admin";
import { useAuth } from "../../context/AuthContext";
import { createPortal } from "react-dom";

// Import Modals
import { LogViewerModal } from "../modals/LogViewerModal";
import { BackupManagerModal } from "../modals/BackupManagerModal";
import { DeleteConfirmationModal } from "../modals/DeleteConfirmationModal";

// Import tabs
import { OverviewTab } from "./tabs/OverviewTab";
import { AnalyticsTab } from "./tabs/AnalyticsTab";
import { SettingsTab } from "./tabs/SettingsTab";
import { BackupsTab } from "./tabs/BackupsTab";

import {
	Server,
	ExternalLink,
	ArrowLeft,
	Power,
	RotateCw,
	Loader2,
	MoreHorizontal,
	Trash2,
	Database,
	Terminal,
	Layout,
	Activity,
	User,
	Calendar,
	AlertTriangle,
	CheckCircle,
	Shield,
	Layers,
	Play,
	Hammer,
} from "lucide-react";

export const InstanceDetails: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { user } = useAuth();

	// Use global state
	const {
		instances,
		refreshInstances,
		updateInstanceStatus,
		addInstance,
		deleteInstance,
	} = useDashboard();

	const isAdmin = user?.roles?.includes("admin");

	const [instance, setInstance] = useState<any | null>(null);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<
		"overview" | "analytics" | "settings" | "backups" | "admin"
	>("overview");
	const [actionLoading, setActionLoading] = useState(false);
	const [toast, setToast] = useState<{ message: string; visible: boolean }>({
		message: "",
		visible: false,
	});

	// Admin Specific State
	const [replicas, setReplicas] = useState(1);
	const [scaling, setScaling] = useState(false);
	const [scaleSuccess, setScaleSuccess] = useState(false);

	// Menu & Modal State
	const [activeMenu, setActiveMenu] = useState<{
		top: number;
		left: number;
	} | null>(null);
	const [modalType, setModalType] = useState<
		"none" | "logs" | "backup" | "delete" | "rebuild"
	>("none");

	// Ref to track if we've initialized the replicas state from DB
	// We use a Ref because setInterval captures the initial render's closure
	// where simple state checks might be stale or reset on unmount/remount
	const initializedReplicasRef = useRef(false);

	useEffect(() => {
		if (!id) return;
		initializedReplicasRef.current = false; // Reset on ID change
		fetchInstanceDetails(false); // Initial load with loading spinner
	}, [id]);

	// Primary fetch function - uses dashboardService.getTenant (role-aware API)
	const fetchInstanceDetails = async (silent = false) => {
		if (!silent) setLoading(true);
		try {
			// Use unified API that handles role-based access
			const data = await dashboardService.getTenant(id!);
			setInstance(data);

			// Only set replicas on initial load to avoid overwriting user input during interaction
			if (!initializedReplicasRef.current) {
				setReplicas(data.replicas ?? 1);
				initializedReplicasRef.current = true;
			}
		} catch (error: any) {
			console.error("Failed to fetch instance details", error);
			// If 403 (forbidden), user doesn't own this instance
			if (error?.response?.status === 403) {
				setInstance(null);
			}
		} finally {
			if (!silent) setLoading(false);
		}
	};

	// Fallback: Sync with global instances context if API fails or for quick updates
	const syncFromContext = () => {
		const foundInstance = instances.find((i) => i.id === id);
		if (foundInstance) {
			// Merge with current instance data to preserve detailed fields
			setInstance((prev: any) =>
				prev ? { ...prev, ...foundInstance } : foundInstance
			);
		}
	};

	// Sync with global instances context (for quick status updates between polls)
	useEffect(() => {
		if (instances.length > 0 && instance) {
			syncFromContext();
		}
	}, [instances, id]);

	// Real-time polling - silent fetch (no loading spinner)
	useEffect(() => {
		if (!id) return;
		const interval = setInterval(() => {
			if (!document.hidden) {
				fetchInstanceDetails(true); // silent = true
			}
		}, 5000);
		return () => clearInterval(interval);
	}, [id]);

	// Close menu on click outside
	useEffect(() => {
		const closeMenu = () => setActiveMenu(null);
		window.addEventListener("click", closeMenu);
		return () => window.removeEventListener("click", closeMenu);
	}, []);

	const showToast = (message: string) => {
		setToast({ message, visible: true });
		setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000);
	};

	const handleAction = async (action: "start" | "stop" | "restart") => {
		if (!id || actionLoading) return;
		setActionLoading(true);
		try {
			if (action === "start") {
				updateInstanceStatus(id, "provisioning");
				showToast("Starting instance...");
				await dashboardService.startTenant(id);
			} else if (action === "stop") {
				updateInstanceStatus(id, "stopped");
				showToast("Stopping instance...");
				await dashboardService.stopTenant(id);
			} else if (action === "restart") {
				updateInstanceStatus(id, "provisioning");
				showToast("Restarting instance...");
				await dashboardService.restartTenant(id);
			}
			setTimeout(() => {
				refreshInstances(true);
				if (isAdmin) fetchInstanceDetails(true); // Silent fetch to keep state
			}, 2000);
		} catch (err: any) {
			showToast(`Failed: ${err.message}`);
		} finally {
			setActionLoading(false);
		}
	};

	// Admin Scale Action
	const handleScale = async () => {
		if (!instance || scaling) return;
		const currentReplicas =
			instance.docker?.desiredReplicas ?? instance.replicas ?? 1;
		if (replicas === currentReplicas) return;

		setScaling(true);
		try {
			const result = await adminService.scaleTenant(instance.id, replicas);
			if (result.success) {
				setInstance((prev: any) => ({
					...prev,
					replicas: result.replicas,
					docker: prev.docker
						? { ...prev.docker, desiredReplicas: result.replicas }
						: undefined,
				}));
				setScaleSuccess(true);
				setTimeout(() => setScaleSuccess(false), 3000);
				showToast(`Scaled to ${result.replicas} replicas`);
			}
		} catch (err: any) {
			console.error("Failed to scale:", err);
			showToast(`Failed to scale: ${err.message}`);
		} finally {
			setScaling(false);
		}
	};

	const handleMenuAction = (action: string) => {
		setActiveMenu(null);
		if (!instance) return;

		if (action === "dashboard") {
			refreshInstances(true);
			if (isAdmin) fetchInstanceDetails(true); // Silent fetch
			showToast("Refreshed data");
		} else if (action === "wp-admin") {
			const url =
				instance.endpoints?.admin ||
				`http://${instance.slug}.${import.meta.env.VITE_BASE_DOMAIN}/wp-admin/`;
			window.open(url, "_blank");
		} else if (activeTab !== "backups" && action === "backups") {
			setActiveTab("backups");
		} else if (action === "logs") {
			setModalType("logs");
		} else if (action === "rebuild") {
			setModalType("rebuild");
		} else if (action === "delete") {
			setModalType("delete");
		} else if (["start", "stop", "restart"].includes(action)) {
			handleAction(action as any);
		}
	};

	const handleDeleteConfirm = async () => {
		if (instance) {
			try {
				await dashboardService.deleteTenant(instance.id);
				setModalType("none");
				showToast("Instance deleted successfully.");

				// Optimistic delete from context
				if (deleteInstance) deleteInstance(instance.id);

				setTimeout(() => navigate("/dashboard/instances"), 500);
			} catch (error: any) {
				showToast(`Failed to delete: ${error.message}`);
			}
		}
	};

	// Only show full page loader if we have NO data yet
	if (loading && !instance)
		return (
			<div className='flex items-center justify-center min-h-[400px]'>
				<Loader2 className='w-8 h-8 animate-spin text-indigo-600' />
			</div>
		);

	if (!instance)
		return (
			<div className='p-10 text-center'>
				<h2 className='text-xl font-bold text-slate-900'>Instance not found</h2>
				<p className='text-slate-500 mb-4'>
					The instance with ID {id} does not exist or has been deleted.
				</p>
				<button
					onClick={() => navigate("/dashboard/instances")}
					className='text-indigo-600 font-bold hover:underline'>
					Return to List
				</button>
			</div>
		);

	const isRunning = instance.status === "running";
	const currentReplicas =
		instance.docker?.desiredReplicas ?? instance.replicas ?? 1;
	const runningReplicas = instance.docker?.runningReplicas ?? 0;

	return (
		<div className='space-y-6 animate-in fade-in duration-300 relative'>
			{/* --- MODALS --- */}
			<LogViewerModal
				isOpen={modalType === "logs"}
				onClose={() => setModalType("none")}
				instanceId={instance.id}
				instanceName={instance.name}
			/>
			<BackupManagerModal
				isOpen={modalType === "backup"}
				onClose={() => setModalType("none")}
				instanceName={instance.name}
			/>
			<DeleteConfirmationModal
				isOpen={modalType === "delete"}
				onClose={() => setModalType("none")}
				onConfirm={handleDeleteConfirm}
				instanceName={instance.name}
			/>

			{/* Rebuild Confirmation Modal */}
			{modalType === "rebuild" &&
				createPortal(
					<div className='fixed inset-0 flex items-center justify-center z-[9999]'>
						<div
							className='absolute inset-0 bg-black/50 backdrop-blur-sm'
							onClick={() => setModalType("none")}></div>
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
										{instance.name}
									</span>
								</p>
							</div>
							<div className='flex gap-3'>
								<button
									onClick={() => setModalType("none")}
									className='flex-1 px-4 py-3 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors'>
									Cancel
								</button>
								<button
									onClick={async () => {
										setModalType("none");
										setActionLoading(true);
										try {
											updateInstanceStatus(id!, "provisioning");
											showToast("Rebuilding instance...");
											await dashboardService.rebuildTenant(id!);
											showToast("Rebuild initiated successfully");
											setTimeout(() => {
												refreshInstances(true);
												fetchInstanceDetails(true);
											}, 2000);
										} catch (err: any) {
											showToast(`Rebuild failed: ${err.message}`);
										} finally {
											setActionLoading(false);
										}
									}}
									disabled={actionLoading}
									className='flex-1 px-4 py-3 text-sm font-semibold text-white bg-amber-600 rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50'>
									{actionLoading ? "Rebuilding..." : "Rebuild"}
								</button>
							</div>
						</div>
					</div>,
					document.body
				)}

			{/* Toast */}
			{toast.visible &&
				createPortal(
					<div className='fixed bottom-8 right-8 bg-slate-900 text-white px-6 py-3 rounded-lg shadow-xl z-50 animate-in slide-in-from-bottom-5 fade-in duration-300'>
						{toast.message}
					</div>,
					document.body
				)}

			{/* Header Area */}
			<div className='flex items-center justify-between'>
				<button
					onClick={() => navigate("/dashboard/instances")}
					className='text-slate-500 hover:text-indigo-600 flex items-center gap-1 text-sm font-bold mb-4'>
					<ArrowLeft className='w-4 h-4' /> Back to List
				</button>
			</div>

			<div className='bg-white shadow rounded-xl border border-slate-200 overflow-hidden'>
				{/* Main Info */}
				<div className='p-6 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6'>
					<div className='flex items-center gap-4 w-full lg:w-auto min-w-0'>
						<div className='flex-shrink-0 w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white border border-indigo-200 shadow-lg shadow-indigo-100'>
							{/* <Server className='w-8 h-8' /> */}
							{/* Server icon replaced with letter for nicer UI */}
							<span className='text-3xl font-bold'>
								{instance.name.charAt(0).toUpperCase()}
							</span>
						</div>
						<div className='min-w-0 flex-1'>
							<h1
								className='text-2xl font-extrabold text-slate-900 truncate pr-4'
								title={instance.name}>
								{instance.name}
							</h1>
							<div className='flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-slate-500'>
								<StatusBadge status={instance.status} />
								<span className='hidden sm:inline text-slate-300'>•</span>
								<span
									className='font-mono text-xs hidden sm:inline truncate max-w-[100px] bg-slate-100 px-1.5 py-0.5 rounded'
									title={instance.id}>
									{instance.id}
								</span>
								<span className='hidden md:inline text-slate-300'>•</span>
								<a
									href={instance.endpoints?.site || instance.url}
									target='_blank'
									rel='noreferrer'
									className='text-indigo-600 hover:underline flex items-center gap-1 min-w-0 max-w-[150px] sm:max-w-xs'>
									<span className='truncate'>{instance.slug}</span>{" "}
									<ExternalLink className='w-3 h-3 flex-shrink-0' />
								</a>
							</div>
						</div>
					</div>

					<div className='flex flex-wrap gap-2 items-center w-full lg:w-auto justify-start lg:justify-end'>
						{instance.status === "running" ? (
							<>
								<button
									onClick={() => handleAction("restart")}
									disabled={actionLoading}
									className='hidden sm:flex bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 font-bold py-2 px-4 rounded-lg transition-all text-sm items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'>
									{actionLoading ? (
										<Loader2 className='w-4 h-4 animate-spin' />
									) : (
										<RotateCw className='w-4 h-4' />
									)}
									Restart
								</button>
								<button
									onClick={() => handleAction("stop")}
									disabled={actionLoading}
									className='hidden sm:flex bg-white border border-slate-200 text-slate-700 hover:bg-amber-50 hover:text-amber-600 font-bold py-2 px-4 rounded-lg transition-all text-sm items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'>
									{actionLoading ? (
										<Loader2 className='w-4 h-4 animate-spin' />
									) : (
										<Power className='w-4 h-4' />
									)}
									Stop
								</button>
							</>
						) : (
							<button
								onClick={() => handleAction("start")}
								disabled={actionLoading}
								className='hidden sm:flex bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors text-sm items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'>
								{actionLoading ? (
									<Loader2 className='w-4 h-4 animate-spin' />
								) : (
									<Play className='w-4 h-4' />
								)}
								Start
							</button>
						)}
						<button
							onClick={() =>
								window.open(
									instance.endpoints?.admin || `${instance.url}/wp-admin/`,
									"_blank"
								)
							}
							className='bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors text-sm whitespace-nowrap flex-1 sm:flex-none justify-center flex items-center gap-2'>
							<Layout className='w-4 h-4' />
							Open WP-Admin
						</button>

						{/* 3-Dot Menu Button */}
						<button
							onClick={(e) => {
								e.stopPropagation();
								const rect = e.currentTarget.getBoundingClientRect();
								setActiveMenu({
									top: rect.bottom + window.scrollY + 6,
									left:
										window.innerWidth < 640
											? rect.left
											: rect.right + window.scrollX - 224, // Responsive alignment
								});
							}}
							className={`p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-indigo-600 transition-colors ${
								activeMenu ? "bg-slate-50 text-indigo-600" : ""
							}`}>
							<MoreHorizontal className='w-5 h-5' />
						</button>
					</div>
				</div>

				{/* Tabs */}
				<div className='px-6 border-b border-slate-200 flex gap-6 overflow-x-auto'>
					{[
						{ id: "overview", label: "Overview" },
						{ id: "analytics", label: "Analytics" },
						{ id: "settings", label: "Settings" },
						{ id: "backups", label: "Backups" },
						// Add Admin Tab conditionally
						...(isAdmin ? [{ id: "admin", label: "Admin" }] : []),
					].map((tab) => (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id as any)}
							className={`py-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
								activeTab === tab.id
									? "border-indigo-600 text-indigo-600"
									: "border-transparent text-slate-500 hover:text-slate-700"
							}`}>
							{tab.id === "admin" && <Shield className='w-3 h-3' />}
							{tab.label}
						</button>
					))}
				</div>

				{/* Tab Content */}
				<div className='p-6 bg-slate-50 min-h-[600px]'>
					{activeTab === "overview" && <OverviewTab instance={instance} />}

					{activeTab === "analytics" && <AnalyticsTab />}

					{activeTab === "settings" && <SettingsTab instance={instance} />}

					{activeTab === "backups" && (
						<BackupsTab instanceName={instance.name} />
					)}

					{/* Admin Tab Content */}
					{activeTab === "admin" && isAdmin && (
						<div className='space-y-6'>
							{/* Stats Grid */}
							<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
								<div className='bg-white rounded-xl p-5 border border-slate-200'>
									<div className='flex items-center gap-3 mb-3'>
										<Activity className='w-5 h-5 text-green-500' />
										<span className='text-sm text-slate-500'>Running</span>
									</div>
									<p className='text-2xl font-semibold text-slate-900'>
										{runningReplicas}/{currentReplicas}
									</p>
								</div>
								<div className='bg-white rounded-xl p-5 border border-slate-200'>
									<div className='flex items-center gap-3 mb-3'>
										<Layers className='w-5 h-5 text-indigo-500' />
										<span className='text-sm text-slate-500'>Plan</span>
									</div>
									<p className='text-2xl font-semibold text-slate-900 capitalize'>
										{instance.planId || instance.plan || "starter"}
									</p>
								</div>
								<div className='bg-white rounded-xl p-5 border border-slate-200'>
									<div className='flex items-center gap-3 mb-3'>
										<User className='w-5 h-5 text-purple-500' />
										<span className='text-sm text-slate-500'>Owner</span>
									</div>
									<p
										className='text-lg font-semibold text-slate-900 truncate'
										title={instance.user?.email}>
										{instance.user?.email || "—"}
									</p>
								</div>
								<div className='bg-white rounded-xl p-5 border border-slate-200'>
									<div className='flex items-center gap-3 mb-3'>
										<Calendar className='w-5 h-5 text-orange-500' />
										<span className='text-sm text-slate-500'>Created</span>
									</div>
									<p className='text-lg font-semibold text-slate-900'>
										{instance.createdAt
											? new Date(instance.createdAt).toLocaleDateString()
											: "N/A"}
									</p>
								</div>
							</div>

							{/* Scale Section */}
							<div className='bg-white rounded-xl border border-slate-200 overflow-hidden'>
								<div className='px-6 py-4 border-b border-slate-100'>
									<h2 className='font-medium text-slate-900'>Scale Replicas</h2>
									<p className='text-sm text-slate-500 mt-1'>
										Adjust the number of running instances
									</p>
								</div>
								<div className='p-6 space-y-6'>
									{/* Slider */}
									<div>
										<div className='flex items-center justify-between mb-2'>
											<span className='text-sm text-slate-500'>Replicas</span>
											<span className='text-sm font-medium text-slate-900'>
												{replicas}
											</span>
										</div>
										<input
											type='range'
											min='1'
											max='10'
											value={replicas}
											onChange={(e) => setReplicas(parseInt(e.target.value))}
											className='w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer'
											disabled={scaling}
										/>
										<div className='flex justify-between mt-1 text-xs text-slate-400'>
											<span>1</span>
											<span>5</span>
											<span>10</span>
										</div>
									</div>

									{/* Action Row */}
									<div className='flex items-center justify-between'>
										<div className='text-sm text-slate-500'>
											{replicas !== currentReplicas ? (
												<span>
													Change from <strong>{currentReplicas}</strong> to{" "}
													<strong className='text-indigo-600'>
														{replicas}
													</strong>
												</span>
											) : (
												<span>No changes</span>
											)}
										</div>
										<button
											onClick={handleScale}
											disabled={scaling || replicas === currentReplicas}
											className='px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2'>
											{scaling ? (
												<>
													<Loader2 className='w-4 h-4 animate-spin' />
													Applying...
												</>
											) : scaleSuccess ? (
												<>
													<CheckCircle className='w-4 h-4' />
													Applied!
												</>
											) : (
												"Apply"
											)}
										</button>
									</div>

									{/* Warning */}
									{replicas > 5 && (
										<div className='flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-4 py-3 rounded-lg'>
											<AlertTriangle className='w-4 h-4' />
											High replica count may increase resource usage
										</div>
									)}
								</div>
							</div>

							{/* Info Section */}
							<div className='bg-white rounded-xl border border-slate-200'>
								<div className='px-6 py-4 border-b border-slate-100'>
									<h2 className='font-medium text-slate-900'>
										Internal Details
									</h2>
								</div>
								<div className='divide-y divide-slate-100'>
									<div className='px-6 py-4 flex items-center justify-between'>
										<div className='flex items-center gap-3'>
											<Database className='w-5 h-5 text-slate-400' />
											<span className='text-slate-600'>Database Name</span>
										</div>
										<span className='font-mono text-sm text-slate-900'>
											{instance.dbName}
										</span>
									</div>
									<div className='px-6 py-4 flex items-center justify-between'>
										<div className='flex items-center gap-3'>
											<User className='w-5 h-5 text-slate-400' />
											<span className='text-slate-600'>Owner Email</span>
										</div>
										<span className='text-sm text-slate-900'>
											{instance.user?.email || "—"}
										</span>
									</div>
									<div className='px-6 py-4 flex items-center justify-between'>
										<div className='flex items-center gap-3'>
											<Server className='w-5 h-5 text-slate-400' />
											<span className='text-slate-600'>Docker Image</span>
										</div>
										<span className='font-mono text-sm text-slate-500 truncate max-w-[300px]'>
											{instance.docker?.image || "—"}
										</span>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* --- ACTION MENU PORTAL --- */}
			{activeMenu &&
				createPortal(
					<div
						className='fixed z-[9999] w-56 bg-white rounded-lg shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right'
						style={{ top: activeMenu.top, left: activeMenu.left }}
						onClick={(e) => e.stopPropagation()}>
						<div className='py-1 border-b border-slate-100'>
							<span className='px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider block'>
								Navigation
							</span>
							<button
								onClick={() => handleMenuAction("dashboard")}
								className='w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2'>
								<Layout className='w-4 h-4 text-slate-400' /> Dashboard Refresh
							</button>
							<button
								onClick={() => handleMenuAction("wp-admin")}
								className='w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2'>
								<ExternalLink className='w-4 h-4 text-slate-400' /> Open
								WP-Admin
							</button>
						</div>

						<div className='py-1 border-b border-slate-100'>
							<span className='px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider block'>
								Power
							</span>
							{isRunning ? (
								<>
									<button
										onClick={() => handleMenuAction("restart")}
										className='w-full text-left px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2'>
										<RotateCw className='w-4 h-4' /> Restart
									</button>
									<button
										onClick={() => handleMenuAction("stop")}
										className='w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2'>
										<Power className='w-4 h-4 text-slate-400' /> Stop Instance
									</button>
								</>
							) : (
								<button
									onClick={() => handleMenuAction("start")}
									className='w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2'>
									<Power className='w-4 h-4' /> Start Instance
								</button>
							)}
						</div>

						<div className='py-1 border-b border-slate-100'>
							<span className='px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider block'>
								Maintenance
							</span>
							<button
								onClick={() => handleMenuAction("logs")}
								className='w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2'>
								<Terminal className='w-4 h-4 text-slate-400' /> View Logs
							</button>
							<button
								onClick={() => handleMenuAction("rebuild")}
								className='w-full text-left px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2'>
								<Hammer className='w-4 h-4' /> Rebuild
							</button>
							<button
								onClick={() => handleMenuAction("backups")}
								className='w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2'>
								<Database className='w-4 h-4 text-slate-400' /> Backups
							</button>
						</div>

						<div className='py-1 bg-red-50/30'>
							<button
								onClick={() => handleMenuAction("delete")}
								className='w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2'>
								<Trash2 className='w-4 h-4' /> Delete Instance
							</button>
						</div>
					</div>,
					document.body
				)}
		</div>
	);
};
