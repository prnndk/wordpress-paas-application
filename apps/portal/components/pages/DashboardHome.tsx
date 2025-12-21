import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDashboard } from "../../context/DashboardContext";
import { useAuth } from "../../context/AuthContext";
import {
	getCachedProfile,
	refreshProfile,
	type ClusterSummary,
	type AuditSummary,
} from "../../src/lib/auth";
import { adminService, type AdminStats } from "../../src/lib/admin";
import { dashboardService } from "../../src/lib/dashboard";
import { AuditLogModal } from "../modals/AuditLogModal";
import {
	Plus,
	Server,
	Activity,
	ArrowRight,
	FileText,
	Key,
	ExternalLink,
	Loader2,
	BarChart3,
	ChevronRight,
	CreditCard,
	Users,
	Shield,
	Wrench,
	Boxes,
	Cpu,
	Wifi,
} from "lucide-react";

export const DashboardHome: React.FC = () => {
	const navigate = useNavigate();
	const {
		instances,
		setCreateModalOpen,
		user,
		quotaUsed,
		quotaAllowed,
		subscription,
	} = useDashboard();
	const { user: authUser } = useAuth();

	const [clusterHealth, setClusterHealth] = useState<ClusterSummary | null>(
		null
	);
	const [auditSummary, setAuditSummary] = useState<AuditSummary | null>(null);
	const [loading, setLoading] = useState(true);
	const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
	const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
	const isAdmin = authUser?.roles?.includes("admin");

	// Prometheus metrics state for aggregated user instance metrics
	const [liveMetrics, setLiveMetrics] = useState<{
		totalCpu: number;
		totalMemory: number;
		totalContainers: number;
		networkRx: number;
		networkTx: number;
	} | null>(null);
	const [metricsLoading, setMetricsLoading] = useState(false);

	// Fetch data from cached profile or refresh
	useEffect(() => {
		async function fetchDashboardData() {
			try {
				setLoading(true);

				// First try cached profile
				let profile = getCachedProfile();

				// If no cached profile, refresh from backend
				if (!profile || !profile.cluster || !profile.auditSummary) {
					profile = await refreshProfile([
						"tenants",
						"subscriptions",
						"cluster",
						"audit",
					]);
				}

				if (profile) {
					setClusterHealth(profile.cluster || null);
					setAuditSummary(profile.auditSummary || null);
				}
			} catch (error) {
				console.error("Failed to fetch dashboard data:", error);
			} finally {
				setLoading(false);
			}
		}

		if (authUser?.id) {
			fetchDashboardData();
		}
	}, [authUser?.id]);

	// Fetch admin stats if user is admin
	useEffect(() => {
		if (isAdmin) {
			adminService.getStats().then(setAdminStats).catch(console.error);
		}
	}, [isAdmin]);

	// Fetch aggregated Prometheus metrics for all user instances
	const fetchLiveMetrics = useCallback(async () => {
		if (instances.length === 0) return;

		try {
			setMetricsLoading(true);
			// Aggregate metrics from all running instances
			const runningInstances = instances.filter(i => i.status === "running");
			let totalCpu = 0;
			let totalMemory = 0;
			let totalContainers = 0;
			let networkRx = 0;
			let networkTx = 0;

			// Fetch metrics for each instance
			const metricsPromises = runningInstances.map(async (inst) => {
				try {
					const response = await dashboardService.getPrometheusMetrics(inst.id);
					const data = (response as any).data || response;
					return data;
				} catch {
					return null;
				}
			});

			const results = await Promise.all(metricsPromises);
			results.forEach((data) => {
				if (data) {
					totalCpu += data.cpu?.current || 0;
					totalMemory += data.memory?.current || 0;
					totalContainers += data.containerCount || 0;
					networkRx += data.network?.rxRate || 0;
					networkTx += data.network?.txRate || 0;
				}
			});

			setLiveMetrics({ totalCpu, totalMemory, totalContainers, networkRx, networkTx });
		} catch (error) {
			console.error("Failed to fetch live metrics:", error);
		} finally {
			setMetricsLoading(false);
		}
	}, [instances]);

	useEffect(() => {
		fetchLiveMetrics();
		const interval = setInterval(fetchLiveMetrics, 30000); // Refresh every 30s
		return () => clearInterval(interval);
	}, [fetchLiveMetrics]);

	// Calculate dynamic stats from real data
	const activeCount = instances.filter((i) => i.status === "running").length;
	const totalInstances = instances.length;

	// Calculate Total Resources
	const totalResources = instances.reduce(
		(acc, inst) => {
			if (inst.status !== "running") return acc;
			const cpu = parseFloat(inst.specs.cpu) || 0;
			const ram = parseFloat(inst.specs.ram) || 0;
			return { cpu: acc.cpu + cpu, ram: acc.ram + ram };
		},
		{ cpu: 0, ram: 0 }
	);

	// Clean message from ALL non-printable characters
	const cleanMessage = (message: string): string => {
		return (
			message
				// Remove all control characters (0x00-0x1F and 0x7F-0x9F)
				.replace(/[\x00-\x1F\x7F-\x9F]/g, "")
				// Remove replacement character  (U+FFFD)
				.replace(/\uFFFD/g, "")
				// Remove other problematic Unicode characters
				.replace(/[\u0000-\u001F\u007F-\u009F\uFFFD]/g, "")
				// Remove duplicate timestamp at start (format: 2025-12-20T09:00:09.123456789Z)
				.replace(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z\s*/, "")
				// Trim whitespace
				.trim()
		);
	};

	// Format audit logs for display
	const formatAuditLog = (log: {
		id: string;
		timestamp: string;
		level: string;
		source: string;
		message: string;
		tenantId?: string;
	}) => {
		const timeAgo = getTimeAgo(new Date(log.timestamp));
		const cleanedMessage = cleanMessage(log.message);
		return {
			action:
				cleanedMessage.substring(0, 50) +
				(cleanedMessage.length > 50 ? "..." : ""),
			target: log.tenantId
				? `Tenant ${log.tenantId.substring(0, 8)}`
				: "System",
			time: timeAgo,
			user: user.name,
			avatar: user.name.substring(0, 2).toUpperCase(),
			level: log.level,
		};
	};

	const getTimeAgo = (date: Date): string => {
		const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
		if (seconds < 60) return `${seconds}s ago`;
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		return `${days}d ago`;
	};

	return (
		<div className='bg-slate-50/50 min-h-screen space-y-8 animate-in fade-in duration-500 pb-10'>
			{/* Audit Log Modal */}
			<AuditLogModal
				isOpen={isAuditModalOpen}
				onClose={() => setIsAuditModalOpen(false)}
			/>

			{/* Welcome Section with Gradient Banner */}
			<div className='relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-8 text-white shadow-lg'>
				<div className='relative z-10'>
					<h1 className='text-3xl font-bold'>
						Welcome back, {user.name?.split(" ")[0]}! 👋
					</h1>
					<p className='mt-2 text-indigo-100 max-w-2xl text-lg'>
						Your infrastructure is running smoothly. Here's what's happening
						today.
					</p>
					<div className='mt-6 flex gap-3'>
						<button
							onClick={() => setCreateModalOpen(true)}
							className='flex items-center gap-2 bg-white text-indigo-600 px-4 py-2 rounded-lg font-semibold hover:bg-indigo-50 transition-colors shadow-sm'>
							<Plus className='w-4 h-4' /> Deploy New Instance
						</button>
						<button
							onClick={() => navigate("/dashboard/instances")}
							className='flex items-center gap-2 bg-indigo-500/30 text-white border border-white/20 px-4 py-2 rounded-lg font-semibold hover:bg-indigo-500/50 transition-colors backdrop-blur-sm'>
							View All Instances
						</button>
					</div>
				</div>
				{/* Abstract Background Shapes */}
				<div className='absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-white/10 rounded-full blur-3xl'></div>
				<div className='absolute bottom-0 right-20 -mb-20 w-64 h-64 bg-indigo-400/20 rounded-full blur-2xl'></div>
			</div>

			{/* Key Stats Row */}
			<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
				{/* Total Instances Card */}
				<div className='bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group'>
					<div className='flex items-start justify-between mb-4'>
						<div className='p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform duration-300'>
							<Server className='w-6 h-6' />
						</div>
						<div
							className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${activeCount > 0
								? "bg-green-100 text-green-700"
								: "bg-slate-100 text-slate-600"
								}`}>
							<div
								className={`w-1.5 h-1.5 rounded-full ${activeCount > 0
									? "bg-green-500 animate-pulse"
									: "bg-slate-400"
									}`}></div>
							{activeCount > 0 ? "System Online" : "No Active Services"}
						</div>
					</div>
					<div>
						<p className='text-sm font-medium text-slate-500'>
							Total Instances
						</p>
						<h3 className='text-3xl font-bold text-slate-900 mt-1'>
							{totalInstances}
						</h3>
						<p className='text-sm text-slate-500 mt-2 flex items-center gap-1'>
							<span className='font-semibold text-green-600'>
								{activeCount}
							</span>{" "}
							running now
						</p>
					</div>
				</div>

				{/* Cluster Health Card */}
				<div className='bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group'>
					<div className='flex items-start justify-between mb-4'>
						<div className='p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform duration-300'>
							<Activity className='w-6 h-6' />
						</div>
						<div className='px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold'>
							Cluster Status
						</div>
					</div>
					<div>
						<p className='text-sm font-medium text-slate-500'>Health Check</p>
						{loading ? (
							<div className='flex items-center gap-2 mt-2 h-9'>
								<Loader2 className='w-5 h-5 animate-spin text-slate-400' />
								<span className='text-sm text-slate-400'>Checking...</span>
							</div>
						) : (
							<>
								<h3 className='text-3xl font-bold text-slate-900 mt-1'>
									{clusterHealth?.swarmStatus === "active"
										? "Healthy"
										: "Unknown"}
								</h3>
								<p className='text-sm text-slate-500 mt-2'>
									{clusterHealth?.totalNodes || 0} nodes active •{" "}
									{clusterHealth?.totalCpuCores || 0} cores available
								</p>
							</>
						)}
					</div>
				</div>

				{/* Resource Usage Card */}
				<div className='bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group'>
					<div className='flex items-start justify-between mb-4'>
						<div className='p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform duration-300'>
							<BarChart3 className='w-6 h-6' />
						</div>
						<div className='px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold'>
							Allocation
						</div>
					</div>
					<div>
						<p className='text-sm font-medium text-slate-500'>
							Resources Allocated
						</p>
						<div className='flex items-baseline gap-2 mt-1'>
							<h3 className='text-3xl font-bold text-slate-900'>
								{totalResources.cpu}
								<span className='text-lg font-medium text-slate-400 ml-1'>
									vCPU
								</span>
							</h3>
						</div>
						<p className='text-sm text-slate-500 mt-2'>
							{totalResources.ram}GB RAM total allocated
						</p>
					</div>
				</div>
			</div>

			{/* Admin Console Section - Only for admins */}
			{isAdmin && adminStats && (
				<div className='space-y-6'>
					{/* Admin Stats Grid */}
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
						<button
							onClick={() => navigate("/admin/users")}
							className='bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-left group'>
							<div className='flex items-center justify-between mb-3'>
								<div className='p-2.5 rounded-xl bg-blue-100 text-blue-600 group-hover:scale-110 transition-transform'>
									<Users className='w-5 h-5' />
								</div>
								<ChevronRight className='w-4 h-4 text-slate-300 group-hover:text-slate-400' />
							</div>
							<p className='text-xs font-medium text-slate-500'>Total Users</p>
							<p className='text-2xl font-bold text-slate-900 mt-1 group-hover:text-indigo-600 transition-colors'>
								{adminStats.totalUsers}
							</p>
						</button>

						<button
							onClick={() => navigate("/dashboard/instances?view=all")}
							className='bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-left group'>
							<div className='flex items-center justify-between mb-3'>
								<div className='p-2.5 rounded-xl bg-green-100 text-green-600 group-hover:scale-110 transition-transform'>
									<Server className='w-5 h-5' />
								</div>
								<ChevronRight className='w-4 h-4 text-slate-300 group-hover:text-slate-400' />
							</div>
							<p className='text-xs font-medium text-slate-500'>
								Total Tenants
							</p>
							<p className='text-2xl font-bold text-slate-900 mt-1 group-hover:text-indigo-600 transition-colors'>
								{adminStats.totalTenants}
							</p>
						</button>

						<button
							onClick={() => navigate("/dashboard/instances?view=all")}
							className='bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-left group'>
							<div className='flex items-center justify-between mb-3'>
								<div className='p-2.5 rounded-xl bg-purple-100 text-purple-600 group-hover:scale-110 transition-transform'>
									<Activity className='w-5 h-5' />
								</div>
								<ChevronRight className='w-4 h-4 text-slate-300 group-hover:text-slate-400' />
							</div>
							<p className='text-xs font-medium text-slate-500'>
								Running Instances
							</p>
							<p className='text-2xl font-bold text-slate-900 mt-1 group-hover:text-indigo-600 transition-colors'>
								{adminStats.runningTenants}
							</p>
						</button>

						<button
							onClick={() => navigate("/admin/maintenance")}
							className='bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-left group'>
							<div className='flex items-center justify-between mb-3'>
								<div className='p-2.5 rounded-xl bg-orange-100 text-orange-600 group-hover:scale-110 transition-transform'>
									<Wrench className='w-5 h-5' />
								</div>
								<ChevronRight className='w-4 h-4 text-slate-300 group-hover:text-slate-400' />
							</div>
							<p className='text-xs font-medium text-slate-500'>
								Active Announcements
							</p>
							<p className='text-2xl font-bold text-slate-900 mt-1 group-hover:text-indigo-600 transition-colors'>
								{adminStats.activeAnnouncements}
							</p>
						</button>
					</div>

					{/* Management Tools */}
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
						<button
							onClick={() => navigate("/admin/users")}
							className='bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all text-left group flex items-center justify-between'>
							<div className='flex items-center gap-4'>
								<div className='p-3 rounded-xl bg-slate-50 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors'>
									<Users className='w-5 h-5' />
								</div>
								<div>
									<h3 className='font-bold text-slate-900 group-hover:text-indigo-600 transition-colors'>
										User Management
									</h3>
									<p className='text-xs text-slate-500'>
										View, enable/disable users
									</p>
								</div>
							</div>
							<ArrowRight className='w-4 h-4 text-slate-300 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all' />
						</button>

						<button
							onClick={() => navigate("/dashboard/instances?view=all")}
							className='bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all text-left group flex items-center justify-between'>
							<div className='flex items-center gap-4'>
								<div className='p-3 rounded-xl bg-slate-50 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors'>
									<Server className='w-5 h-5' />
								</div>
								<div>
									<h3 className='font-bold text-slate-900 group-hover:text-indigo-600 transition-colors'>
										Tenant Management
									</h3>
									<p className='text-xs text-slate-500'>
										View tenants, manage status
									</p>
								</div>
							</div>
							<ArrowRight className='w-4 h-4 text-slate-300 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all' />
						</button>

						<button
							onClick={() => navigate("/admin/services")}
							className='bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all text-left group flex items-center justify-between'>
							<div className='flex items-center gap-4'>
								<div className='p-3 rounded-xl bg-slate-50 text-slate-600 group-hover:bg-cyan-50 group-hover:text-cyan-600 transition-colors'>
									<Boxes className='w-5 h-5' />
								</div>
								<div>
									<h3 className='font-bold text-slate-900 group-hover:text-cyan-600 transition-colors'>
										Containers
									</h3>
									<p className='text-xs text-slate-500'>
										View all Docker services
									</p>
								</div>
							</div>
							<ArrowRight className='w-4 h-4 text-slate-300 group-hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-all' />
						</button>

						<button
							onClick={() => navigate("/admin/maintenance")}
							className='bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all text-left group flex items-center justify-between'>
							<div className='flex items-center gap-4'>
								<div className='p-3 rounded-xl bg-slate-50 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors'>
									<Wrench className='w-5 h-5' />
								</div>
								<div>
									<h3 className='font-bold text-slate-900 group-hover:text-indigo-600 transition-colors'>
										Maintenance
									</h3>
									<p className='text-xs text-slate-500'>
										Rolling updates, announcements
									</p>
								</div>
							</div>
							<ArrowRight className='w-4 h-4 text-slate-300 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all' />
						</button>
					</div>
				</div>
			)}

			{/* Live Metrics from Prometheus */}
			{instances.length > 0 && (
				<div className='bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-xl shadow-lg'>
					<div className='flex items-center justify-between mb-4'>
						<div className='flex items-center gap-3'>
							<div className='p-2 bg-green-500/20 rounded-lg'>
								<Activity className='w-5 h-5 text-green-400' />
							</div>
							<div>
								<h3 className='text-lg font-bold text-white'>Live Usage</h3>
								<p className='text-sm text-slate-400'>Real-time metrics from Prometheus</p>
							</div>
						</div>
						{metricsLoading && (
							<Loader2 className='w-4 h-4 animate-spin text-slate-400' />
						)}
					</div>

					<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
						{/* CPU */}
						<div className='bg-slate-800/50 p-4 rounded-xl border border-slate-700'>
							<div className='flex items-center gap-2 text-slate-400 text-xs font-semibold mb-2'>
								<Cpu className='w-3.5 h-3.5' /> CPU USAGE
							</div>
							<p className='text-2xl font-bold text-white'>
								{liveMetrics ? `${liveMetrics.totalCpu.toFixed(1)}%` : '--'}
							</p>
						</div>

						{/* Memory */}
						<div className='bg-slate-800/50 p-4 rounded-xl border border-slate-700'>
							<div className='flex items-center gap-2 text-slate-400 text-xs font-semibold mb-2'>
								<Server className='w-3.5 h-3.5' /> MEMORY
							</div>
							<p className='text-2xl font-bold text-white'>
								{liveMetrics ? `${(liveMetrics.totalMemory / (1024 * 1024 * 1024)).toFixed(2)} GB` : '--'}
							</p>
						</div>

						{/* Network RX */}
						<div className='bg-slate-800/50 p-4 rounded-xl border border-slate-700'>
							<div className='flex items-center gap-2 text-slate-400 text-xs font-semibold mb-2'>
								<Wifi className='w-3.5 h-3.5' /> NET IN
							</div>
							<p className='text-2xl font-bold text-emerald-400'>
								{liveMetrics ? `${(liveMetrics.networkRx / 1024).toFixed(1)} KB/s` : '--'}
							</p>
						</div>

						{/* Network TX */}
						<div className='bg-slate-800/50 p-4 rounded-xl border border-slate-700'>
							<div className='flex items-center gap-2 text-slate-400 text-xs font-semibold mb-2'>
								<Wifi className='w-3.5 h-3.5' /> NET OUT
							</div>
							<p className='text-2xl font-bold text-blue-400'>
								{liveMetrics ? `${(liveMetrics.networkTx / 1024).toFixed(1)} KB/s` : '--'}
							</p>
						</div>
					</div>
				</div>
			)}

			{/* Main Content Area */}
			<div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
				{/* Left Column: Instance List */}
				<div className='lg:col-span-2 space-y-6'>
					<div className='bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden'>
						<div className='px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-transparent'>
							<div>
								<h3 className='font-bold text-lg text-slate-900'>
									Your Instances
								</h3>
								<p className='text-sm text-slate-500'>
									Manage your active deployments
								</p>
							</div>
							{instances.length > 0 && (
								<button
									onClick={() => navigate("/dashboard/instances")}
									className='text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors'>
									View All <ArrowRight className='w-4 h-4' />
								</button>
							)}
						</div>

						{instances.length === 0 ? (
							<div className='p-12 text-center bg-slate-50/50'>
								<div className='w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100'>
									<Server className='w-10 h-10 text-indigo-300' />
								</div>
								<h4 className='text-xl font-bold text-slate-900 mb-2'>
									No instances yet
								</h4>
								<p className='text-slate-500 mb-8 max-w-sm mx-auto'>
									Deploy your first high-performance WordPress instance in
									seconds.
								</p>
								<button
									onClick={() => setCreateModalOpen(true)}
									className='bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md'>
									Start Deployment
								</button>
							</div>
						) : (
							<div className='divide-y divide-slate-100'>
								{instances.slice(0, 5).map((inst) => (
									<div
										key={inst.id}
										className='p-5 flex items-center justify-between hover:bg-slate-50/80 transition-all cursor-pointer group'
										onClick={() => navigate(`/instance/${inst.id}`)}>
										<div className='flex items-center gap-4'>
											<div
												className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm ${inst.status === "running"
													? "bg-green-100 text-green-700"
													: inst.status === "provisioning"
														? "bg-amber-100 text-amber-700"
														: inst.status === "error"
															? "bg-red-100 text-red-700"
															: "bg-slate-100 text-slate-500"
													}`}>
												WP
											</div>
											<div>
												<h4 className='font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-0.5'>
													{inst.name}
												</h4>
												<a
													href={inst.endpoints?.site}
													target='_blank'
													rel='noopener noreferrer'
													onClick={(e) => e.stopPropagation()}
													className='text-xs text-slate-500 hover:text-indigo-500 flex items-center gap-1 transition-colors'>
													{inst.endpoints?.site
														.replace(/^https?:\/\//, "")
														.replace(/\/$/, "") || inst.slug}
													<ExternalLink className='w-3 h-3' />
												</a>
											</div>
										</div>
										<div className='flex items-center gap-6'>
											<div className='hidden sm:block text-right'>
												<div className='text-xs font-medium text-slate-500 mb-1'>
													Resources
												</div>
												<div className='text-xs font-bold text-slate-700'>
													{inst.specs.cpu} / {inst.specs.ram}
												</div>
											</div>
											<div
												className={`px-3 py-1 rounded-full text-xs font-bold capitalize border ${inst.status === "running"
													? "bg-green-50 text-green-700 border-green-200"
													: inst.status === "provisioning"
														? "bg-amber-50 text-amber-700 border-amber-200"
														: "bg-slate-50 text-slate-600 border-slate-200"
													}`}>
												{inst.status}
											</div>
											<ChevronRight className='w-5 h-5 text-slate-300 group-hover:text-indigo-400 transition-colors' />
										</div>
									</div>
								))}
							</div>
						)}
					</div>

					{/* Community Banner */}
					<div
						className='bg-slate-900 rounded-xl p-8 text-white shadow-lg overflow-hidden relative group cursor-pointer'
						onClick={() => navigate("/community")}>
						<div className='relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6'>
							<div>
								<h3 className='font-bold text-xl mb-2'>
									Join our Developer Community
								</h3>
								<p className='text-slate-300 text-sm max-w-md'>
									Connect with other WordPress developers, share tips, and get
									help from our team.
								</p>
							</div>
							<button className='bg-white text-slate-900 px-6 py-2.5 rounded-lg font-bold hover:bg-indigo-50 transition-colors whitespace-nowrap shadow-sm'>
								Join Discord
							</button>
						</div>
						{/* Decorative Circles */}
						<div className='absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl group-hover:bg-indigo-500/30 transition-colors'></div>
						<div className='absolute left-10 -top-20 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl group-hover:bg-indigo-500/30 transition-colors'></div>
					</div>
				</div>

				{/* Right Column: Sidebar */}
				<div className='space-y-6'>
					{/* Quick Actions */}
					<div className='bg-white rounded-xl border border-slate-200 shadow-sm p-6'>
						<h4 className='font-bold text-slate-900 text-sm mb-4 uppercase tracking-wider flex items-center gap-2'>
							<span className='w-1 h-4 bg-indigo-500 rounded-full'></span>
							Quick Actions
						</h4>
						<div className='space-y-3'>
							<button
								onClick={() => navigate("/docs")}
								className='w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all text-left group'>
								<div className='bg-indigo-50 text-indigo-600 p-2.5 rounded-lg group-hover:bg-white group-hover:shadow-sm transition-all'>
									<FileText className='w-5 h-5' />
								</div>
								<div>
									<span className='block text-sm font-bold text-slate-700 group-hover:text-indigo-700 transition-colors'>
										Documentation
									</span>
									<span className='text-xs text-slate-500'>
										Guides & API References
									</span>
								</div>
							</button>
							<button
								onClick={() => navigate("/settings?tab=api")}
								className='w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all text-left group'>
								<div className='bg-purple-50 text-purple-600 p-2.5 rounded-lg group-hover:bg-white group-hover:shadow-sm transition-all'>
									<Key className='w-5 h-5' />
								</div>
								<div>
									<span className='block text-sm font-bold text-slate-700 group-hover:text-purple-700 transition-colors'>
										API Keys
									</span>
									<span className='text-xs text-slate-500'>
										Manage access tokens
									</span>
								</div>
							</button>
							<button
								onClick={() => navigate("/settings?tab=billing")}
								className='w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all text-left group'>
								<div className='bg-blue-50 text-blue-600 p-2.5 rounded-lg group-hover:bg-white group-hover:shadow-sm transition-all'>
									<CreditCard className='w-5 h-5' />
								</div>
								<div>
									<span className='block text-sm font-bold text-slate-700 group-hover:text-blue-700 transition-colors'>
										Billing
									</span>
									<span className='text-xs text-slate-500'>
										View invoices & usage
									</span>
								</div>
							</button>
						</div>
					</div>

					{/* Audit Log */}
					<div className='bg-white rounded-xl border border-slate-200 shadow-sm p-6'>
						<div className='flex items-center justify-between mb-4'>
							<h4 className='font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2'>
								<span className='w-1 h-4 bg-slate-400 rounded-full'></span>
								Activity Log
							</h4>
							<button
								onClick={() => setIsAuditModalOpen(true)}
								className='text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline'>
								View All
							</button>
						</div>

						{loading ? (
							<div className='flex items-center justify-center py-8'>
								<Loader2 className='w-6 h-6 animate-spin text-slate-300' />
							</div>
						) : !auditSummary || auditSummary.recent.length === 0 ? (
							<div className='py-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200'>
								<p className='text-sm text-slate-500'>No recent activity</p>
							</div>
						) : (
							<div className='space-y-0 relative'>
								{/* Connector Line */}
								<div className='absolute left-[19px] top-3 bottom-3 w-[2px] bg-slate-100 z-0'></div>

								{auditSummary.recent.slice(0, 5).map((log, index) => {
									const formatted = formatAuditLog(log);
									return (
										<div key={log.id} className='relative pl-10 py-3 group'>
											<div
												className={`absolute left-0 top-3.5 w-[10px] h-[10px] rounded-full border-2 border-white ring-1 z-10 ${log.level === "error"
													? "bg-red-500 ring-red-100"
													: log.level === "warn"
														? "bg-amber-500 ring-amber-100"
														: "bg-indigo-500 ring-indigo-100"
													}`}></div>
											<div className='bg-white p-3 rounded-lg border border-slate-100 shadow-sm group-hover:border-indigo-100 group-hover:shadow-md transition-all'>
												<p className='text-sm text-slate-900 font-semibold leading-tight'>
													{formatted.action}
												</p>
												<div className='flex items-center gap-2 mt-1.5'>
													<span className='text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase tracking-wide'>
														{formatted.target}
													</span>
													<span className='text-[11px] text-slate-400'>
														{formatted.time}
													</span>
												</div>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};
