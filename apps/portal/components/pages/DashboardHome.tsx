import React, { useEffect, useState } from "react";
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
	AlertTriangle,
	Clock,
	X,
	Bell,
} from "lucide-react";

interface Announcement {
	id: string;
	title: string;
	message: string;
	type: 'info' | 'warning' | 'maintenance';
	scheduledAt?: string;
	expiresAt?: string;
	isActive: boolean;
}

interface ScheduledMaintenance {
	id: string;
	scheduledAt: string;
	targetImage: string;
	status: string;
	targetTenantIds?: string | null;
	announcement?: Announcement | null;
}

export const DashboardHome: React.FC = () => {
	const navigate = useNavigate();
	const {
		instances,
		setCreateModalOpen,
		user,
		quotaUsed,
		quotaAllowed,
		subscription,
		refreshInstances,
	} = useDashboard();
	const { user: authUser } = useAuth();

	const [clusterHealth, setClusterHealth] = useState<ClusterSummary | null>(
		null
	);
	const [auditSummary, setAuditSummary] = useState<AuditSummary | null>(null);
	const [loading, setLoading] = useState(true);
	const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
	const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
	const [announcements, setAnnouncements] = useState<Announcement[]>([]);
	const [upcomingMaintenance, setUpcomingMaintenance] = useState<ScheduledMaintenance[]>([]);
	const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>([]);
	const [maintenanceLoading, setMaintenanceLoading] = useState(true);
	const [showMaintenanceDetail, setShowMaintenanceDetail] = useState<ScheduledMaintenance | null>(null);
	const [showAnnouncementDetail, setShowAnnouncementDetail] = useState<Announcement | null>(null);
	const [countdown, setCountdown] = useState<string>("");
	const [announcementCountdowns, setAnnouncementCountdowns] = useState<Record<string, string>>({});
	const [isDataReady, setIsDataReady] = useState(false);
	const isAdmin = authUser?.roles?.includes("admin");

	// Check if all essential data is loaded
	useEffect(() => {
		// Data is ready when loading is complete AND instances have been fetched (may be empty array)
		if (!loading && !maintenanceLoading) {
			// Add a small delay to ensure smooth transition
			const timer = setTimeout(() => {
				setIsDataReady(true);
			}, 100);
			return () => clearTimeout(timer);
		}
	}, [loading, maintenanceLoading]);


	// Fetch data from cached profile or refresh
	useEffect(() => {
		async function fetchDashboardData() {
			try {
				setLoading(true);

				// Force refresh via Layout to sync instances
				await refreshInstances(true);

				// Get the fresh data (Layout has updated the cache)
				const profile = getCachedProfile();

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
	}, [authUser?.id, refreshInstances]);

	// Fetch admin stats if user is admin
	useEffect(() => {
		if (isAdmin) {
			adminService.getStats().then(setAdminStats).catch(console.error);
		}
	}, [isAdmin]);

	// Fetch announcements and upcoming maintenances
	useEffect(() => {
		async function fetchMaintenanceData() {
			setMaintenanceLoading(true);
			try {
				const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

				// Fetch announcements
				const announcementsRes = await fetch(`${API_BASE}/announcements`);
				if (announcementsRes.ok) {
					const data = await announcementsRes.json();
					setAnnouncements(data);
				}

				// Fetch upcoming maintenances
				const maintenanceRes = await fetch(`${API_BASE}/maintenance/upcoming`);
				if (maintenanceRes.ok) {
					const data = await maintenanceRes.json();
					setUpcomingMaintenance(data);
				}
			} catch (error) {
				console.error("Failed to fetch maintenance data:", error);
			} finally {
				setMaintenanceLoading(false);
			}
		}
		fetchMaintenanceData();
	}, []);

	const dismissAnnouncement = (id: string) => {
		setDismissedAnnouncements(prev => [...prev, id]);
	};

	// Calculate time remaining with live countdown
	const getCountdownValue = (scheduledAt: string) => {
		const now = new Date().getTime();
		const target = new Date(scheduledAt).getTime();
		const diff = target - now;

		if (diff <= 0) return "Starting now...";

		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
		const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
		const seconds = Math.floor((diff % (1000 * 60)) / 1000);

		if (days > 0) return `${days}d ${hours}h ${minutes}m`;
		if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
		return `${minutes}m ${seconds}s`;
	};

	// Live countdown timer for scheduled maintenance
	useEffect(() => {
		if (upcomingMaintenance.length === 0) return;

		const updateCountdown = () => {
			setCountdown(getCountdownValue(upcomingMaintenance[0]?.scheduledAt));
		};

		updateCountdown();
		const interval = setInterval(updateCountdown, 1000);

		return () => clearInterval(interval);
	}, [upcomingMaintenance]);

	// Live countdown timer for announcements with scheduledAt
	useEffect(() => {
		const maintenanceAnnouncements = announcements.filter(a => a.type === 'maintenance' && a.scheduledAt);
		if (maintenanceAnnouncements.length === 0) return;

		const updateCountdowns = () => {
			const newCountdowns: Record<string, string> = {};
			maintenanceAnnouncements.forEach(a => {
				if (a.scheduledAt) {
					newCountdowns[a.id] = getCountdownValue(a.scheduledAt);
				}
			});
			setAnnouncementCountdowns(newCountdowns);
		};

		updateCountdowns();
		const interval = setInterval(updateCountdowns, 1000);

		return () => clearInterval(interval);
	}, [announcements]);

	// Check if maintenance is today or happening soon (within 24 hours)
	const isMaintenanceUrgent = (scheduledAt: string) => {
		const now = new Date().getTime();
		const target = new Date(scheduledAt).getTime();
		const diff = target - now;
		const hoursUntil = diff / (1000 * 60 * 60);
		return hoursUntil <= 24 && hoursUntil > 0;
	};

	const isMaintenanceToday = (scheduledAt: string) => {
		const today = new Date();
		const scheduled = new Date(scheduledAt);
		return today.toDateString() === scheduled.toDateString();
	};

	// Get affected tenants from maintenance
	const getAffectedTenants = (maintenance: ScheduledMaintenance) => {
		if (!maintenance.targetTenantIds) return null; // All tenants
		try {
			return JSON.parse(maintenance.targetTenantIds) as string[];
		} catch {
			return null;
		}
	};

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

	// Loading Skeleton
	if (!isDataReady) {
		return (
			<div className="bg-slate-50/50 min-h-screen space-y-8 pb-10 animate-pulse">
				{/* Welcome Banner Skeleton */}
				<div className="rounded-2xl bg-white border border-slate-200 h-[240px] relative overflow-hidden p-8 flex flex-col justify-center gap-4">
					<div className="h-8 bg-slate-200 rounded-lg w-1/3"></div>
					<div className="h-4 bg-slate-200 rounded-lg w-1/2"></div>
					<div className="flex gap-3 mt-4">
						<div className="h-10 w-40 bg-slate-200 rounded-lg"></div>
						<div className="h-10 w-40 bg-slate-200 rounded-lg"></div>
					</div>
				</div>

				{/* Stats Grid Skeleton */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{[1, 2, 3].map((i) => (
						<div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-44 flex flex-col justify-between">
							<div className="flex justify-between items-start">
								<div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
								<div className="w-24 h-6 bg-slate-200 rounded-full"></div>
							</div>
							<div className="space-y-2">
								<div className="h-4 w-24 bg-slate-200 rounded"></div>
								<div className="h-8 w-16 bg-slate-200 rounded"></div>
							</div>
						</div>
					))}
				</div>

				{/* Main Content Skeleton */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					<div className="lg:col-span-2 space-y-6">
						<div className="bg-white rounded-xl border border-slate-200 shadow-sm h-[500px] p-6">
							<div className="flex justify-between mb-8">
								<div className="h-6 w-48 bg-slate-200 rounded"></div>
								<div className="h-8 w-32 bg-slate-200 rounded"></div>
							</div>
							<div className="space-y-4">
								{[1, 2, 3, 4].map((i) => (
									<div key={i} className="h-20 bg-slate-50 rounded-xl border border-slate-100"></div>
								))}
							</div>
						</div>
					</div>
					<div className="space-y-6">
						<div className="bg-white rounded-xl border border-slate-200 shadow-sm h-64 p-6">
							<div className="h-6 w-32 bg-slate-200 rounded mb-4"></div>
							<div className="space-y-3">
								<div className="h-12 bg-slate-50 rounded-lg"></div>
								<div className="h-12 bg-slate-50 rounded-lg"></div>
								<div className="h-12 bg-slate-50 rounded-lg"></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className='bg-slate-50/50 min-h-screen space-y-8 animate-in fade-in duration-500 pb-10'>
			{/* Audit Log Modal */}
			<AuditLogModal
				isOpen={isAuditModalOpen}
				onClose={() => setIsAuditModalOpen(false)}
			/>

			{/* Maintenance Announcements Banner - Only show when loaded */}
			{!maintenanceLoading && (announcements.filter(a => !dismissedAnnouncements.includes(a.id)).length > 0 || upcomingMaintenance.length > 0) && (
				<div className="space-y-3">
					{/* Active Announcements */}
					{announcements
						.filter(a => !dismissedAnnouncements.includes(a.id))
						.map(announcement => {
							const hasSchedule = announcement.type === 'maintenance' && announcement.scheduledAt;
							const isToday = hasSchedule && isMaintenanceToday(announcement.scheduledAt!);
							const theCountdown = hasSchedule ? announcementCountdowns[announcement.id] : null;

							return (
								<div
									key={announcement.id}
									onClick={() => setShowAnnouncementDetail(announcement)}
									className={`relative rounded-xl border shadow-sm transition-all cursor-pointer hover:shadow-md ${announcement.type === 'warning'
										? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 hover:border-amber-300'
										: announcement.type === 'maintenance'
											? isToday
												? 'bg-gradient-to-r from-red-100 to-rose-100 border-red-300 hover:border-red-400'
												: 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200 hover:border-red-300'
											: 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:border-blue-300'
										}`}
								>
									<div className="flex items-stretch">
										{/* Main Content */}
										<div className="flex-1 p-4 flex items-start gap-4">
											<div className={`p-2.5 rounded-xl ${announcement.type === 'warning'
												? 'bg-amber-100 text-amber-600'
												: announcement.type === 'maintenance'
													? isToday ? 'bg-red-200 text-red-700 animate-pulse' : 'bg-red-100 text-red-600'
													: 'bg-blue-100 text-blue-600'
												}`}>
												{announcement.type === 'maintenance' ? (
													isToday ? <AlertTriangle className="w-5 h-5" /> : <Wrench className="w-5 h-5" />
												) : announcement.type === 'warning' ? (
													<AlertTriangle className="w-5 h-5" />
												) : (
													<Bell className="w-5 h-5" />
												)}
											</div>
											<div className="flex-1">
												<div className="flex items-center gap-2 mb-1 flex-wrap">
													<h3 className={`font-bold ${announcement.type === 'warning'
														? 'text-amber-900'
														: announcement.type === 'maintenance'
															? 'text-red-900'
															: 'text-blue-900'
														}`}>
														{isToday && '⚠️ '}{announcement.title}
													</h3>
													<span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase ${announcement.type === 'warning'
														? 'bg-amber-200 text-amber-800'
														: announcement.type === 'maintenance'
															? isToday ? 'bg-red-300 text-red-900 animate-pulse' : 'bg-red-200 text-red-800'
															: 'bg-blue-200 text-blue-800'
														}`}>
														{isToday ? 'TODAY' : announcement.type}
													</span>
												</div>
												<p className={`text-sm ${announcement.type === 'warning'
													? 'text-amber-700'
													: announcement.type === 'maintenance'
														? 'text-red-700'
														: 'text-blue-700'
													}`}>
													{announcement.message}
												</p>
												{announcement.scheduledAt && !theCountdown && (
													<p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
														<Clock className="w-3 h-3" />
														Scheduled: {new Date(announcement.scheduledAt).toLocaleString()}
													</p>
												)}
												<p className={`text-xs mt-1 ${announcement.type === 'warning'
													? 'text-amber-600'
													: announcement.type === 'maintenance'
														? 'text-red-600'
														: 'text-blue-600'
													}`}>Click to view details →</p>
											</div>
										</div>

										{/* Countdown Timer for maintenance type */}
										{theCountdown && (
											<div className={`flex items-center justify-center px-4 border-l ${isToday ? 'bg-red-200/50 border-red-300' : 'bg-red-100/50 border-red-200'
												}`}>
												<div className="text-center">
													<p className="text-[10px] text-red-600 uppercase font-medium mb-0.5">Starts in</p>
													<p className={`font-mono font-bold tabular-nums ${isToday ? 'text-xl text-red-800' : 'text-lg text-red-700'}`}>
														{theCountdown}
													</p>
												</div>
											</div>
										)}

										{/* Dismiss Button */}
										<div className="flex items-start p-2">
											<button
												onClick={(e) => {
													e.stopPropagation();
													dismissAnnouncement(announcement.id);
												}}
												className="p-1 hover:bg-white/50 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
											>
												<X className="w-4 h-4" />
											</button>
										</div>
									</div>
								</div>
							);
						})}

					{/* Upcoming Scheduled Maintenance */}
					{upcomingMaintenance.length > 0 && (
						<div
							className={`rounded-xl p-5 text-white shadow-lg relative overflow-hidden cursor-pointer transition-all ${isMaintenanceToday(upcomingMaintenance[0]?.scheduledAt)
								? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700'
								: 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600'
								}`}
							onClick={() => setShowMaintenanceDetail(upcomingMaintenance[0])}
						>
							<div className="relative z-10 flex items-center justify-between">
								<div className="flex items-center gap-4">
									<div className={`p-3 bg-white/20 rounded-xl backdrop-blur-sm ${isMaintenanceToday(upcomingMaintenance[0]?.scheduledAt) ? 'animate-pulse' : ''}`}>
										{isMaintenanceToday(upcomingMaintenance[0]?.scheduledAt) ? <AlertTriangle className="w-6 h-6" /> : <Wrench className="w-6 h-6" />}
									</div>
									<div>
										<div className="flex items-center gap-2 mb-1">
											<h3 className="font-bold text-lg">
												{isMaintenanceToday(upcomingMaintenance[0]?.scheduledAt) ? '⚠️ Maintenance Today!' : 'Scheduled Maintenance'}
											</h3>
											<span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${isMaintenanceToday(upcomingMaintenance[0]?.scheduledAt) ? 'bg-white/30 animate-pulse' : 'bg-white/20'}`}>
												{isMaintenanceToday(upcomingMaintenance[0]?.scheduledAt) ? 'Urgent' : `${upcomingMaintenance.length} Upcoming`}
											</span>
										</div>
										<p className="text-orange-100 text-sm">
											{upcomingMaintenance[0]?.announcement?.message ||
												`System maintenance scheduled for ${new Date(upcomingMaintenance[0]?.scheduledAt).toLocaleString()}`}
										</p>
										<p className="text-xs text-orange-200 mt-1">Click to view affected tenants →</p>
									</div>
								</div>
								<div className="text-right">
									<p className="text-xs text-orange-200 mb-1">Starts in</p>
									<div className="bg-white/20 rounded-lg px-4 py-2 backdrop-blur-sm">
										<p className={`font-mono font-bold tabular-nums ${isMaintenanceToday(upcomingMaintenance[0]?.scheduledAt) ? 'text-3xl' : 'text-2xl'}`}>
											{countdown || 'Loading...'}
										</p>
									</div>
								</div>
							</div>
							{/* Decorative elements */}
							<div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
							<div className="absolute -left-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
						</div>
					)}
				</div>
			)}

			{/* Maintenance Detail Modal */}
			{showMaintenanceDetail && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowMaintenanceDetail(null)}>
					<div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
						<div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-orange-500 to-red-500 rounded-t-2xl text-white">
							<div>
								<h2 className="text-lg font-bold">Maintenance Details</h2>
								<p className="text-sm text-orange-100">
									Scheduled for {new Date(showMaintenanceDetail.scheduledAt).toLocaleString()}
								</p>
							</div>
							<button onClick={() => setShowMaintenanceDetail(null)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
								<X className="w-5 h-5" />
							</button>
						</div>
						<div className="p-6 space-y-4">
							{/* Countdown */}
							<div className="bg-gradient-to-r from-slate-100 to-slate-50 rounded-xl p-4 text-center">
								<p className="text-xs text-slate-500 mb-1">Starts in</p>
								<p className="text-3xl font-mono font-bold text-slate-900 tabular-nums">{countdown}</p>
							</div>

							{/* Message */}
							{showMaintenanceDetail.announcement && (
								<div>
									<h4 className="text-sm font-medium text-slate-500 mb-1">Announcement</h4>
									<p className="text-slate-900">{showMaintenanceDetail.announcement.message}</p>
								</div>
							)}

							{/* Affected Tenants */}
							<div>
								<h4 className="text-sm font-medium text-slate-500 mb-2">Affected Tenants</h4>
								{(() => {
									const affected = getAffectedTenants(showMaintenanceDetail);
									if (!affected) {
										return (
											<div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-sm">
												⚠️ <strong>All tenants</strong> will be affected by this maintenance.
											</div>
										);
									}
									const matchingInstances = instances.filter(i => affected.includes(i.id));
									if (matchingInstances.length === 0) {
										return (
											<div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-800 text-sm">
												✅ None of your instances are affected by this maintenance.
											</div>
										);
									}
									return (
										<div className="space-y-2">
											<div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm mb-2">
												⚠️ <strong>{matchingInstances.length}</strong> of your instances will be affected:
											</div>
											{matchingInstances.map(inst => (
												<div
													key={inst.id}
													className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
													onClick={() => {
														setShowMaintenanceDetail(null);
														navigate(`/instance/${inst.id}`);
													}}
												>
													<div className="flex items-center gap-3">
														<div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-xs font-bold">
															WP
														</div>
														<div>
															<p className="font-medium text-slate-900">{inst.name}</p>
															<p className="text-xs text-slate-500">{inst.slug}</p>
														</div>
													</div>
													<ChevronRight className="w-4 h-4 text-slate-400" />
												</div>
											))}
										</div>
									);
								})()}
							</div>
						</div>
						<div className="px-6 py-4 border-t border-slate-200 flex justify-end">
							<button
								onClick={() => setShowMaintenanceDetail(null)}
								className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
							>
								Close
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Announcement Detail Modal */}
			{showAnnouncementDetail && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowAnnouncementDetail(null)}>
					<div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
						<div className={`px-6 py-4 border-b flex items-center justify-between rounded-t-2xl text-white ${showAnnouncementDetail.type === 'warning'
							? 'bg-gradient-to-r from-amber-500 to-orange-500'
							: showAnnouncementDetail.type === 'maintenance'
								? showAnnouncementDetail.scheduledAt && isMaintenanceToday(showAnnouncementDetail.scheduledAt)
									? 'bg-gradient-to-r from-red-600 to-rose-600'
									: 'bg-gradient-to-r from-orange-500 to-red-500'
								: 'bg-gradient-to-r from-blue-500 to-indigo-500'
							}`}>
							<div className="flex items-center gap-3">
								<div className="p-2 bg-white/20 rounded-lg">
									{showAnnouncementDetail.type === 'maintenance' ? (
										showAnnouncementDetail.scheduledAt && isMaintenanceToday(showAnnouncementDetail.scheduledAt) ? (
											<AlertTriangle className="w-5 h-5" />
										) : (
											<Wrench className="w-5 h-5" />
										)
									) : showAnnouncementDetail.type === 'warning' ? (
										<AlertTriangle className="w-5 h-5" />
									) : (
										<Bell className="w-5 h-5" />
									)}
								</div>
								<div>
									<div className="flex items-center gap-2">
										<h2 className="text-lg font-bold">{showAnnouncementDetail.title}</h2>
										<span className="px-2 py-0.5 rounded-full text-xs font-medium uppercase bg-white/20">
											{showAnnouncementDetail.type}
										</span>
									</div>
									{showAnnouncementDetail.scheduledAt && (
										<p className="text-sm opacity-80">
											Scheduled for {new Date(showAnnouncementDetail.scheduledAt).toLocaleString()}
										</p>
									)}
								</div>
							</div>
							<button onClick={() => setShowAnnouncementDetail(null)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
								<X className="w-5 h-5" />
							</button>
						</div>
						<div className="p-6 space-y-4">
							{/* Countdown - only for maintenance with scheduledAt */}
							{showAnnouncementDetail.type === 'maintenance' && showAnnouncementDetail.scheduledAt && announcementCountdowns[showAnnouncementDetail.id] && (
								<div className={`rounded-xl p-4 text-center ${isMaintenanceToday(showAnnouncementDetail.scheduledAt)
									? 'bg-gradient-to-r from-red-100 to-rose-100'
									: 'bg-gradient-to-r from-slate-100 to-slate-50'
									}`}>
									<p className={`text-xs mb-1 ${isMaintenanceToday(showAnnouncementDetail.scheduledAt) ? 'text-red-600' : 'text-slate-500'}`}>
										{isMaintenanceToday(showAnnouncementDetail.scheduledAt) ? '⚠️ Starting Today in' : 'Starts in'}
									</p>
									<p className={`text-3xl font-mono font-bold tabular-nums ${isMaintenanceToday(showAnnouncementDetail.scheduledAt) ? 'text-red-700' : 'text-slate-900'
										}`}>
										{announcementCountdowns[showAnnouncementDetail.id]}
									</p>
								</div>
							)}

							{/* Message */}
							<div>
								<h4 className="text-sm font-medium text-slate-500 mb-1">Details</h4>
								<p className="text-slate-900">{showAnnouncementDetail.message}</p>
							</div>

							{/* Created Date */}
							<div>
								<h4 className="text-sm font-medium text-slate-500 mb-1">Posted</h4>
								<p className="text-sm text-slate-600">
									{showAnnouncementDetail.scheduledAt
										? new Date(showAnnouncementDetail.scheduledAt).toLocaleString()
										: 'Active now'}
								</p>
							</div>

							{/* Info Note based on type */}
							<div className={`rounded-lg p-3 text-sm ${showAnnouncementDetail.type === 'warning'
								? 'bg-amber-50 border border-amber-200 text-amber-800'
								: showAnnouncementDetail.type === 'maintenance'
									? 'bg-red-50 border border-red-200 text-red-800'
									: 'bg-blue-50 border border-blue-200 text-blue-800'
								}`}>
								{showAnnouncementDetail.type === 'maintenance'
									? '🔧 This is a maintenance announcement. Services may be temporarily affected.'
									: showAnnouncementDetail.type === 'warning'
										? '⚠️ This is a warning notice. Please review the details carefully.'
										: 'ℹ️ This is an informational announcement from the system administrators.'}
							</div>
						</div>
						<div className="px-6 py-4 border-t border-slate-200 flex justify-end">
							<button
								onClick={() => setShowAnnouncementDetail(null)}
								className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
							>
								Close
							</button>
						</div>
					</div>
				</div>
			)}

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
					<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
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
