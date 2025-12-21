import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
	Users,
	Server,
	Activity,
	Wrench,
	Shield,
	ChevronRight,
	Loader2,
	ArrowRight,
	Boxes,
	Cpu,
	HardDrive,
	Globe,
	Zap,
} from "lucide-react";
import { adminService, AdminStats } from "../../src/lib/admin";
import { dashboardService } from "../../src/lib/dashboard";

interface ClusterMetrics {
	totalCpu: number;
	totalMemory: number;
	totalContainers: number;
	nodeCount: number;
	tenantCount: number;
	requestsPerSecond: number;
	avgLatency: number;
}

export const AdminDashboard: React.FC = () => {
	const navigate = useNavigate();
	const [stats, setStats] = useState<AdminStats | null>(null);
	const [clusterMetrics, setClusterMetrics] = useState<ClusterMetrics | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [statsData, clusterData] = await Promise.all([
					adminService.getStats(),
					dashboardService.getClusterPrometheusMetrics().catch(() => null),
				]);
				setStats(statsData);
				if (clusterData) {
					setClusterMetrics(clusterData);
				}
			} catch (err: any) {
				if (err.status === 403) {
					setError("Admin access required");
				} else {
					setError(err.message || "Failed to fetch stats");
				}
			} finally {
				setLoading(false);
			}
		};

		fetchData();

		// Auto-refresh every 30 seconds
		const interval = setInterval(fetchData, 30000);
		return () => clearInterval(interval);
	}, []);

	if (loading) {
		return (
			<div className='flex items-center justify-center min-h-[400px]'>
				<Loader2 className='w-8 h-8 animate-spin text-indigo-600' />
			</div>
		);
	}

	if (error) {
		return (
			<div className='flex flex-col items-center justify-center min-h-[400px] space-y-4'>
				<Shield className='w-16 h-16 text-red-500' />
				<h2 className='text-2xl font-bold text-red-500'>{error}</h2>
				<p className='text-slate-500'>
					You need admin privileges to access this page.
				</p>
				<button
					onClick={() => navigate("/dashboard")}
					className='px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors'>
					Back to Dashboard
				</button>
			</div>
		);
	}

	const statCards = [
		{
			label: "Total Users",
			value: stats?.totalUsers || 0,
			icon: Users,
			color: "text-blue-500 bg-blue-100",
			href: "/admin/users",
		},
		{
			label: "Total Tenants",
			value: stats?.totalTenants || 0,
			icon: Server,
			color: "text-green-500 bg-green-100",
			href: "/admin/tenants",
		},
		{
			label: "Running Instances",
			value: stats?.runningTenants || 0,
			icon: Activity,
			color: "text-purple-500 bg-purple-100",
			href: "/admin/tenants",
		},
		{
			label: "Active Announcements",
			value: stats?.activeAnnouncements || 0,
			icon: Wrench,
			color: "text-orange-500 bg-orange-100",
			href: "/admin/maintenance",
		},
	];

	const adminLinks = [
		{
			label: "User Management",
			description: "View, enable/disable users",
			icon: Users,
			href: "/admin/users",
		},
		{
			label: "Tenant Management",
			description: "View tenants, manage status",
			icon: Server,
			href: "/admin/tenants",
		},
		{
			label: "Maintenance",
			description: "Rolling updates, announcements",
			icon: Wrench,
			href: "/admin/maintenance",
		},
		{
			label: "Container Management",
			description: "All Docker services & nodes",
			icon: Boxes,
			href: "/admin/services",
		},
	];

	return (
		<div className='bg-slate-50/50 min-h-screen space-y-8 animate-in fade-in duration-500 pb-10'>
			{/* Header Section */}
			<div className='relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white shadow-lg'>
				<div className='relative z-10'>
					<h1 className='text-3xl font-bold'>Admin Console</h1>
					<p className='mt-2 text-slate-300 max-w-2xl text-lg'>
						Manage system resources, users, and maintenance operations.
					</p>
				</div>
				{/* Abstract Background Shapes */}
				<div className='absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-white/5 rounded-full blur-3xl'></div>
				<div className='absolute bottom-0 right-20 -mb-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl'></div>
			</div>

			{/* Stats Grid */}
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
				{statCards.map((stat) => (
					<button
						key={stat.label}
						onClick={() => navigate(stat.href)}
						className='bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-left group relative overflow-hidden'>
						<div className='flex items-center justify-between mb-4'>
							<div
								className={`p-3 rounded-xl ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
								<stat.icon className='w-6 h-6' />
							</div>
							<ChevronRight className='w-5 h-5 text-slate-300 group-hover:text-slate-400 transition-colors' />
						</div>
						<div>
							<p className='text-sm font-medium text-slate-500'>{stat.label}</p>
							<div className='text-3xl font-bold text-slate-900 mt-1 group-hover:text-indigo-600 transition-colors'>
								{stat.value}
							</div>
						</div>
						<div className='absolute bottom-0 left-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/0 to-transparent group-hover:via-indigo-500/50 w-full transition-all'></div>
					</button>
				))}
			</div>

			{/* Prometheus Cluster Metrics */}
			{clusterMetrics && (
				<div>
					<h3 className='font-bold text-lg text-slate-900 mb-4 flex items-center gap-2'>
						<Activity className='w-5 h-5 text-indigo-600' />
						Cluster Monitoring (Prometheus)
					</h3>
					<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
						<div className='bg-white p-4 rounded-xl border border-slate-200 shadow-sm'>
							<div className='flex items-center gap-2 mb-2'>
								<Cpu className='w-4 h-4 text-blue-500' />
								<span className='text-xs font-medium text-slate-500'>Total CPU</span>
							</div>
							<p className='text-2xl font-bold text-slate-900'>{clusterMetrics.totalCpu.toFixed(1)}%</p>
						</div>
						<div className='bg-white p-4 rounded-xl border border-slate-200 shadow-sm'>
							<div className='flex items-center gap-2 mb-2'>
								<HardDrive className='w-4 h-4 text-green-500' />
								<span className='text-xs font-medium text-slate-500'>Memory Usage</span>
							</div>
							<p className='text-2xl font-bold text-slate-900'>
								{(clusterMetrics.totalMemory / (1024 * 1024 * 1024)).toFixed(2)} GB
							</p>
						</div>
						<div className='bg-white p-4 rounded-xl border border-slate-200 shadow-sm'>
							<div className='flex items-center gap-2 mb-2'>
								<Server className='w-4 h-4 text-purple-500' />
								<span className='text-xs font-medium text-slate-500'>Containers</span>
							</div>
							<p className='text-2xl font-bold text-slate-900'>{clusterMetrics.totalContainers}</p>
							<p className='text-xs text-slate-500'>{clusterMetrics.nodeCount} nodes</p>
						</div>
						<div className='bg-white p-4 rounded-xl border border-slate-200 shadow-sm'>
							<div className='flex items-center gap-2 mb-2'>
								<Zap className='w-4 h-4 text-amber-500' />
								<span className='text-xs font-medium text-slate-500'>Requests/sec</span>
							</div>
							{clusterMetrics.requestsPerSecond > 0 ? (
								<>
									<p className='text-2xl font-bold text-slate-900'>{clusterMetrics.requestsPerSecond.toFixed(1)}</p>
									<p className='text-xs text-slate-500'>Latency: {(clusterMetrics.avgLatency * 1000).toFixed(0)}ms</p>
								</>
							) : (
								<>
									<p className='text-2xl font-bold text-slate-400'>N/A</p>
									<p className='text-xs text-amber-600'>Traefik metrics unavailable</p>
								</>
							)}
						</div>
					</div>
				</div>
			)}

			{/* Quick Links */}
			<div>
				<h3 className='font-bold text-lg text-slate-900 mb-4'>
					Management Tools
				</h3>
				<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
					{adminLinks.map((link) => (
						<button
							key={link.label}
							onClick={() => navigate(link.href)}
							className='bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all text-left group flex items-center justify-between'>
							<div className='flex items-center gap-4'>
								<div className='p-4 rounded-xl bg-slate-50 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors'>
									<link.icon className='w-6 h-6' />
								</div>
								<div>
									<h3 className='font-bold text-slate-900 group-hover:text-indigo-600 transition-colors'>
										{link.label}
									</h3>
									<p className='text-sm text-slate-500 mt-0.5'>
										{link.description}
									</p>
								</div>
							</div>
							<div className='opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300'>
								<ArrowRight className='w-5 h-5 text-indigo-400' />
							</div>
						</button>
					))}
				</div>
			</div>
		</div>
	);
};
