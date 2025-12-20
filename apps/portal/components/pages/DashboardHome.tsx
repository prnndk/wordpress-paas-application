import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDashboard } from "../DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import {
	getCachedProfile,
	refreshProfile,
	type ClusterSummary,
	type AuditSummary,
} from "../../src/lib/auth";
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
		<div className='space-y-8 animate-in fade-in duration-500'>
			{/* Audit Log Modal */}
			<AuditLogModal
				isOpen={isAuditModalOpen}
				onClose={() => setIsAuditModalOpen(false)}
			/>

			{/* Welcome & Action Header */}
			<div className='flex flex-col sm:flex-row sm:items-end justify-between gap-4'>
				<div>
					<h1 className='text-2xl font-bold text-slate-900'>
						Welcome back, {user.name.split(" ")[0]}
					</h1>
					<p className='text-slate-500 mt-1'>
						Here is what's happening with your infrastructure today.
					</p>
				</div>
			</div>

			{/* Stats Grid */}
			<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
				{/* Card 1: Total Instances */}
				<div className='bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between hover:border-indigo-100 transition-colors'>
					<div>
						<p className='text-sm font-medium text-slate-500 mb-1'>
							Total Instances
						</p>
						<h3 className='text-3xl font-bold text-slate-900'>
							{totalInstances}
						</h3>
						<p className='text-xs text-green-600 font-bold mt-2 flex items-center gap-1'>
							<span className='w-2 h-2 rounded-full bg-green-500 animate-pulse'></span>
							{activeCount} Running
						</p>
					</div>
					<div className='p-3 bg-indigo-50 text-indigo-600 rounded-lg'>
						<Server className='w-6 h-6' />
					</div>
				</div>

				{/* Card 2: Cluster Health - Real Data */}
				<div className='bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between hover:border-indigo-100 transition-colors'>
					<div>
						<p className='text-sm font-medium text-slate-500 mb-1'>
							Cluster Health
						</p>
						{loading ? (
							<div className='flex items-center gap-2'>
								<Loader2 className='w-5 h-5 animate-spin text-slate-400' />
								<span className='text-sm text-slate-400'>Loading...</span>
							</div>
						) : (
							<>
								<h3 className='text-3xl font-bold text-slate-900'>
									{clusterHealth?.swarmStatus === "active" ? "✓" : "?"}
								</h3>
								<p className='text-xs text-slate-500 mt-2'>
									{clusterHealth?.totalNodes || 0} nodes •{" "}
									{clusterHealth?.totalCpuCores || 0} cores
								</p>
							</>
						)}
					</div>
					<div className='p-3 bg-emerald-50 text-emerald-600 rounded-lg'>
						<Activity className='w-6 h-6' />
					</div>
				</div>

				{/* Card 3: Total Resources */}
				<div className='bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between hover:border-indigo-100 transition-colors'>
					<div>
						<p className='text-sm font-medium text-slate-500 mb-1'>
							Total Resources
						</p>
						<h3 className='text-3xl font-bold text-slate-900'>
							{totalResources.cpu}
							<span className='text-lg text-slate-400 font-normal'>vCPU</span>
						</h3>
						<p className='text-xs text-slate-500 mt-2'>
							{totalResources.ram}GB RAM Allocated
						</p>
					</div>
					<div className='p-3 bg-blue-50 text-blue-600 rounded-lg'>
						<Activity className='w-6 h-6' />
					</div>
				</div>
			</div>

			{/* Split Layout: List & Sidebar */}
			<div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
				{/* Main: Quick Instance List */}
				<div className='lg:col-span-2 space-y-6'>
					<div className='bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden'>
						<div className='px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50'>
							<h3 className='font-bold text-slate-900'>Active Instances</h3>
							<button
								onClick={() => navigate("/dashboard/instances")}
								className='text-sm text-indigo-600 font-bold hover:text-indigo-800 flex items-center gap-1'>
								View All <ArrowRight className='w-4 h-4' />
							</button>
						</div>

						{instances.length === 0 ? (
							<div className='p-8 text-center'>
								<div className='w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400'>
									<Server className='w-8 h-8' />
								</div>
								<h4 className='font-bold text-slate-900'>No instances found</h4>
								<p className='text-slate-500 text-sm mt-1 mb-4'>
									Get started by deploying your first container.
								</p>
								<button
									onClick={() => setCreateModalOpen(true)}
									className='text-indigo-600 font-bold hover:underline'>
									Deploy Now
								</button>
							</div>
						) : (
							<div className='divide-y divide-slate-100'>
								{instances.slice(0, 5).map((inst) => (
									<div
										key={inst.id}
										className='p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer'
										onClick={() => navigate(`/instance/${inst.id}`)}>
										<div className='flex items-center gap-4'>
											<div
												className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${
													inst.status === "running"
														? "bg-green-100 text-green-700"
														: inst.status === "provisioning"
														? "bg-yellow-100 text-yellow-700"
														: inst.status === "error"
														? "bg-red-100 text-red-700"
														: "bg-slate-100 text-slate-500"
												}`}>
												WP
											</div>
											<div>
												<h4 className='font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors'>
													{inst.name}
												</h4>
												<p className='text-xs text-slate-500 flex items-center gap-1'>
													{inst.endpoints?.site
														.replace(/^https?:\/\//, "")
														.replace(/\/$/, "") || inst.slug}{" "}
													<ExternalLink className='w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity' />
												</p>
											</div>
										</div>
										<div className='text-right'>
											<span
												className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
													inst.status === "running"
														? "bg-green-100 text-green-800"
														: inst.status === "provisioning"
														? "bg-yellow-100 text-yellow-800"
														: inst.status === "error"
														? "bg-red-100 text-red-800"
														: "bg-slate-100 text-slate-600"
												}`}>
												{inst.status}
											</span>
										</div>
									</div>
								))}
							</div>
						)}
					</div>

					{/* Banner */}
					<div className='bg-gradient-to-r from-indigo-900 to-slate-900 rounded-xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6'>
						<div>
							<h3 className='font-bold text-lg mb-1'>
								Join our Discord Community
							</h3>
							<p className='text-indigo-200 text-sm'>
								Connect with 5,000+ developers, share tips, and get help.
							</p>
						</div>
						<button
							onClick={() => navigate("/community")}
							className='bg-white text-indigo-900 px-5 py-2.5 rounded-lg font-bold hover:bg-indigo-50 transition-colors whitespace-nowrap'>
							Join Now
						</button>
					</div>
				</div>

				{/* Sidebar: Audit & Quick Actions */}
				<div className='space-y-6'>
					{/* Quick Actions */}
					<div className='bg-white rounded-xl border border-slate-200 shadow-sm p-5'>
						<h4 className='font-bold text-slate-900 text-sm mb-4 uppercase tracking-wider'>
							Quick Actions
						</h4>
						<div className='space-y-2'>
							<button
								onClick={() => navigate("/docs")}
								className='w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all text-left group'>
								<div className='bg-indigo-50 text-indigo-600 p-2 rounded-md group-hover:bg-white group-hover:shadow-sm transition-all'>
									<FileText className='w-4 h-4' />
								</div>
								<span className='text-sm font-medium text-slate-700 group-hover:text-indigo-600'>
									Read Documentation
								</span>
							</button>
							<button
								onClick={() => navigate("/settings?tab=api")}
								className='w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all text-left group'>
								<div className='bg-purple-50 text-purple-600 p-2 rounded-md group-hover:bg-white group-hover:shadow-sm transition-all'>
									<Key className='w-4 h-4' />
								</div>
								<span className='text-sm font-medium text-slate-700 group-hover:text-purple-600'>
									View API Keys
								</span>
							</button>
						</div>
					</div>

					{/* Audit Log - Real Data */}
					<div className='bg-white rounded-xl border border-slate-200 shadow-sm p-5'>
						<h4 className='font-bold text-slate-900 text-sm mb-4 uppercase tracking-wider'>
							Audit Log
						</h4>
						{loading ? (
							<div className='flex items-center justify-center py-8'>
								<Loader2 className='w-6 h-6 animate-spin text-slate-400' />
							</div>
						) : !auditSummary || auditSummary.recent.length === 0 ? (
							<p className='text-sm text-slate-500 text-center py-4'>
								No recent activity
							</p>
						) : (
							<div className='space-y-4 relative'>
								<div className='absolute left-4 top-2 bottom-2 w-0.5 bg-slate-100'></div>

								{auditSummary.recent.map((log) => {
									const formatted = formatAuditLog(log);
									return (
										<div
											key={log.id}
											className='relative pl-10 flex flex-col gap-0.5'>
											<div
												className={`absolute left-0 top-0 w-8 h-8 rounded-full border flex items-center justify-center z-10 text-[10px] font-bold ${
													log.level === "error"
														? "bg-red-50 border-red-200 text-red-600"
														: log.level === "warn"
														? "bg-yellow-50 border-yellow-200 text-yellow-600"
														: "bg-slate-50 border-slate-200 text-slate-500"
												}`}>
												{formatted.avatar}
											</div>
											<p className='text-sm text-slate-900 font-medium leading-none mt-1'>
												{formatted.action}
											</p>
											<p className='text-xs text-slate-500'>
												{formatted.target} • {formatted.time}
											</p>
										</div>
									);
								})}
							</div>
						)}
						<button
							onClick={() => setIsAuditModalOpen(true)}
							className='w-full mt-4 text-xs font-bold text-slate-400 hover:text-slate-600 pt-3 border-t border-slate-50'>
							View Full History
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
