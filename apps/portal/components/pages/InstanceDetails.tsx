import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDashboard } from "../DashboardLayout";
import { StatusBadge } from "../StatusBadge";
import { dashboardService } from "../../src/lib/dashboard";
import { createPortal } from "react-dom";

// Import Modals
import { LogViewerModal } from "../modals/LogViewerModal";
import { BackupManagerModal } from "../modals/BackupManagerModal";
import { DeleteConfirmationModal } from "../modals/DeleteConfirmationModal";

// Import new tabs
import { OverviewTab } from "./tabs/OverviewTab";
import { AnalyticsTab } from "./tabs/AnalyticsTab";
import { SettingsTab } from "./tabs/SettingsTab";
import { BackupsTab } from "./tabs/BackupsTab";

import {
	Server,
	ExternalLink,
	ArrowLeft,
	Settings,
	Power,
	RotateCw,
	Loader2,
	MoreHorizontal,
	Trash2,
	Database,
	Layers,
	Terminal,
	Play,
	StopCircle,
	Layout,
} from "lucide-react";

export const InstanceDetails: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();

	// Use global state
	const {
		instances,
		refreshInstances,
		updateInstanceStatus,
		addInstance,
		deleteInstance,
	} = useDashboard();

	const [instance, setInstance] = useState<any | null>(null);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<
		"overview" | "analytics" | "settings" | "backups"
	>("overview");
	const [actionLoading, setActionLoading] = useState(false);
	const [toast, setToast] = useState<string | null>(null);

	// Menu & Modal State
	const [activeMenu, setActiveMenu] = useState<{
		top: number;
		left: number;
	} | null>(null);
	const [modalType, setModalType] = useState<
		"none" | "logs" | "backup" | "delete"
	>("none");

	useEffect(() => {
		if (!id) return;

		// Don't hide loading if instances haven't been fetched yet
		// This prevents "Instance not found" from showing during initial load
		if (instances.length === 0) {
			setLoading(true);
			setInstance(null);
			return;
		}

		// Find instance in the global context
		const foundInstance = instances.find((i) => i.id === id);

		if (foundInstance) {
			// Enrich with missing details
			const enrichedInstance = {
				...foundInstance,
				endpoints: foundInstance.endpoints || {
					site: `http://${foundInstance.slug}`,
					admin: `http://${foundInstance.slug}/wp-admin/`,
				},
				db: {
					host: `db-cluster-${
						foundInstance.region.split("-")[1] || "01"
					}.internal`,
					name: `wp_${foundInstance.slug.replace(/-/g, "_")}`,
					user: `user_${foundInstance.id.split("_")[1] || "admin"}`,
				},
			};
			setInstance(enrichedInstance);
			setLoading(false);
		} else {
			// Only show "not found" if instances have been loaded
			setInstance(null);
			setLoading(false);
		}
	}, [id, instances]);

	// Real-time status polling & Immediate Refresh
	useEffect(() => {
		if (!id) return;

		// Immediate refresh on mount/id change (Delayed)
		const timer = setTimeout(() => {
			refreshInstances(true);
		}, 1500);

		const interval = setInterval(() => {
			refreshInstances(true);
		}, 5000); // Poll every 5 seconds
		return () => clearInterval(interval);
	}, [id, refreshInstances]);

	// Close menu on click outside
	useEffect(() => {
		const closeMenu = () => setActiveMenu(null);
		window.addEventListener("click", closeMenu);
		return () => window.removeEventListener("click", closeMenu);
	}, []);

	const showToast = (msg: string) => {
		setToast(msg);
		setTimeout(() => setToast(null), 3000);
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
			setTimeout(() => refreshInstances(true), 2000);
		} catch (err: any) {
			showToast(`Failed: ${err.message}`);
		} finally {
			setActionLoading(false);
		}
	};

	const handleMenuAction = (action: string) => {
		setActiveMenu(null);
		if (!instance) return;

		if (action === "dashboard") {
			refreshInstances(true);
			showToast("Refreshed data");
		} else if (action === "wp-admin") {
			const url =
				instance.endpoints?.admin ||
				`http://${instance.ip}/${instance.slug}/wp-admin/`;
			window.open(url, "_blank");
		} else if (activeTab !== "backups" && action === "backups") {
			setActiveTab("backups");
		} else if (action === "staging") {
			showToast("Cloning to staging...");
			setTimeout(() => {
				addInstance({
					...instance,
					id: `inst_${Math.floor(Math.random() * 9000)}`,
					name: `[Staging] ${instance.name}`,
					slug: `${instance.slug}-staging`,
					status: "running",
				});
				showToast("Staging environment created.");
			}, 1500);
		} else if (action === "logs") {
			setModalType("logs");
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

	if (loading)
		return (
			<div className='space-y-6 animate-in fade-in duration-300'>
				<div className='flex items-center justify-between'>
					<div className='h-4 w-24 bg-slate-200 rounded animate-pulse'></div>
				</div>

				<div className='bg-white shadow rounded-xl border border-slate-200 overflow-hidden'>
					{/* Header Skeleton */}
					<div className='p-6 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6'>
						<div className='flex items-center gap-4 w-full lg:w-auto'>
							<div className='w-16 h-16 bg-slate-200 rounded-2xl animate-pulse'></div>
							<div className='space-y-2'>
								<div className='h-8 w-48 bg-slate-200 rounded animate-pulse'></div>
								<div className='flex gap-2'>
									<div className='h-4 w-16 bg-slate-200 rounded animate-pulse'></div>
									<div className='h-4 w-24 bg-slate-200 rounded animate-pulse'></div>
								</div>
							</div>
						</div>
						<div className='flex gap-2'>
							<div className='h-10 w-24 bg-slate-200 rounded-lg animate-pulse'></div>
							<div className='h-10 w-24 bg-slate-200 rounded-lg animate-pulse'></div>
							<div className='h-10 w-32 bg-slate-200 rounded-lg animate-pulse'></div>
						</div>
					</div>

					{/* Tabs Skeleton */}
					<div className='px-6 border-b border-slate-200 flex gap-6'>
						{[1, 2, 3, 4].map((i) => (
							<div
								key={i}
								className='py-4 w-20 h-full flex items-center justify-center'>
								<div className='h-4 w-16 bg-slate-200 rounded animate-pulse'></div>
							</div>
						))}
					</div>

					{/* Content Skeleton */}
					<div className='p-6 min-h-[400px] space-y-6'>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
							<div className='h-32 bg-slate-200 rounded-xl animate-pulse'></div>
							<div className='h-32 bg-slate-200 rounded-xl animate-pulse'></div>
							<div className='h-32 bg-slate-200 rounded-xl animate-pulse'></div>
							<div className='h-32 bg-slate-200 rounded-xl animate-pulse'></div>
						</div>
					</div>
				</div>
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

	return (
		<div className='space-y-6 animate-in fade-in duration-300 relative'>
			{/* --- MODALS --- */}
			<LogViewerModal
				isOpen={modalType === "logs"}
				onClose={() => setModalType("none")}
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

			{/* Toast */}
			{toast && (
				<div className='fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl z-[9999] animate-in slide-in-from-bottom-5'>
					{toast}
				</div>
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
						<div className='flex-shrink-0 w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-200'>
							<Server className='w-8 h-8' />
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
									className='hidden sm:flex bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors text-sm items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'>
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
									className='hidden sm:flex bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors text-sm items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'>
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
									<Power className='w-4 h-4' />
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
							className='bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors text-sm whitespace-nowrap flex-1 sm:flex-none justify-center'>
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
					].map((tab) => (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id as any)}
							className={`py-4 text-sm font-bold border-b-2 transition-colors ${
								activeTab === tab.id
									? "border-indigo-600 text-indigo-600"
									: "border-transparent text-slate-500 hover:text-slate-700"
							}`}>
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
