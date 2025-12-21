import React, { useState, useEffect, useCallback } from "react";
import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";
import {
	ExternalLink,
	Copy,
	Eye,
	EyeOff,
	Check,
	Server,
	Database,
	Globe,
	Cpu,
	HardDrive,
	Zap,
	Activity,
	Mail,
} from "lucide-react";
import { dashboardService } from "../../../src/lib/dashboard";

interface OverviewTabProps {
	instance: any;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ instance }) => {
	// State
	const [timeRange, setTimeRange] = useState<"1H" | "24H" | "7D">("24H");
	const [chartData, setChartData] = useState<
		{ time: string; requests: number; latency: number }[]
	>([]);
	const [resources, setResources] = useState<{
		cpu: number;
		memory: number;
		storage: number;
		uptime?: number;
		uptimeSeconds?: number;
	}>({ cpu: 0, memory: 0, storage: 0, uptime: 100 });
	const [specs, setSpecs] = useState<{
		cpuCores: number;
		ramGb: number;
		storageGb: number;
	}>({ cpuCores: 1, ramGb: 2, storageGb: 20 });
	const [showDbPass, setShowDbPass] = useState(false);
	const [copiedField, setCopiedField] = useState<string | null>(null);
	const [toast, setToast] = useState<string | null>(null);
	const [metricsLoading, setMetricsLoading] = useState(true);

	// Action States
	const [isPurging, setIsPurging] = useState(false);
	const [isRestarting, setIsRestarting] = useState(false);

	// Show toast
	const showToast = (msg: string) => {
		setToast(msg);
		setTimeout(() => setToast(null), 3000);
	};

	// Fetch metrics from API
	const fetchMetrics = useCallback(async () => {
		if (!instance?.id) return;

		try {
			setMetricsLoading(true);
			const data = await dashboardService.getMetrics(instance.id, timeRange);
			setChartData(data.chartData);
			setResources(data.resources);
			setSpecs(data.specs);
		} catch (error: any) {
			console.error("Failed to fetch metrics:", error);
			showToast("Failed to load metrics");
		} finally {
			setMetricsLoading(false);
		}
	}, [instance?.id, timeRange]);

	// Fetch metrics on mount and when range changes
	useEffect(() => {
		fetchMetrics();
	}, [fetchMetrics]);

	// Handlers
	const handleCopy = (text: string, fieldId: string) => {
		navigator.clipboard.writeText(text);
		setCopiedField(fieldId);
		setTimeout(() => setCopiedField(null), 2000);
	};

	const handlePurgeCache = async () => {
		if (isPurging || !instance?.id) return;

		setIsPurging(true);
		try {
			const result = await dashboardService.purgeCache(instance.id);
			showToast(result.message || "Cache purged successfully");
		} catch (error: any) {
			showToast(error.message || "Failed to purge cache");
		} finally {
			setIsPurging(false);
		}
	};

	// Helper for resource colors
	const getLoadColor = (percent: number) => {
		if (percent > 90) return "bg-red-500";
		if (percent > 70) return "bg-yellow-500";
		return "bg-emerald-500";
	};

	// Get site URL from instance
	const siteUrl = instance.endpoints?.site || `/${instance.slug}/`;

	// Extract IP/Hostname from siteUrl
	let displayIp = instance.ip;
	if (instance.endpoints?.site) {
		try {
			const url = new URL(instance.endpoints.site);
			displayIp = url.hostname;
		} catch (e) {
			// ignore invalid url
		}
	}
	if (!displayIp) displayIp = "N/A";

	// Get database info from instance
	const dbHost = instance.db?.host || "mysql-master";
	const dbName =
		instance.db?.name ||
		`wp_${instance.slug?.replace(/-/g, "_") || "wordpress"}`;
	const dbUser = instance.db?.user || `user_${instance.slug || "admin"}`;
	const dbPassword = instance.db?.password || "";
	const wpAdminEmail = instance.wpAdminEmail || "";

	return (
		<div className='space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500'>
			{/* Toast */}
			{toast && (
				<div className='fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl z-[9999] animate-in slide-in-from-bottom-5'>
					{toast}
				</div>
			)}

			{/* 1. Status Bar & Quick Actions */}
			<div className='bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4'>
				{/* Left: Identity */}
				<div className='flex items-center gap-6 w-full md:w-auto'>
					<div className='flex items-center gap-3'>
						<div className='p-2 bg-green-100 text-green-700 rounded-lg'>
							<Globe className='w-5 h-5' />
						</div>
						<div>
							<div className='flex items-center gap-2'>
								<a
									href={siteUrl}
									target='_blank'
									rel='noreferrer'
									className='text-sm font-bold text-slate-900 hover:text-indigo-600 flex items-center gap-1 transition-colors'>
									/{instance.slug}/ <ExternalLink className='w-3 h-3' />
								</a>
							</div>
							<div
								className='flex items-center gap-2 text-xs text-slate-500 cursor-pointer hover:text-slate-700 group'
								onClick={() => handleCopy(displayIp, "ip")}>
								<span className='font-mono'>{displayIp}</span>
								{copiedField === "ip" ? (
									<Check className='w-3 h-3 text-green-500' />
								) : (
									<Copy className='w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity' />
								)}
							</div>
						</div>
					</div>
					<div className='h-8 w-px bg-slate-200 hidden md:block'></div>
					<div className='hidden md:block'>
						<span className='text-xs font-bold text-slate-400 uppercase tracking-wider'>
							Uptime
						</span>
						<p className='text-sm font-bold text-green-600'>
							{typeof resources.uptime !== "undefined"
								? `${resources.uptime}%`
								: "100%"}
						</p>
					</div>
				</div>

				{/* Right: Actions */}
				<div className='flex items-center gap-2 w-full md:w-auto'>
					<button
						onClick={handlePurgeCache}
						disabled={isPurging}
						className='flex-1 md:flex-none inline-flex justify-center items-center px-4 py-2 border border-slate-200 shadow-sm text-xs font-bold rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'>
						<Zap
							className={`w-3 h-3 mr-2 ${
								isPurging ? "text-indigo-500 animate-pulse" : "text-amber-500"
							}`}
						/>
						{isPurging ? "Purging..." : "Purge Cache"}
					</button>
				</div>
			</div>

			<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
				{/* 2. Main Chart */}
				<div className='lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm'>
					<div className='flex justify-between items-center mb-6'>
						<div>
							<h3 className='text-lg font-bold text-slate-900 flex items-center gap-2'>
								<Activity className='w-5 h-5 text-indigo-600' /> Traffic &
								Latency
							</h3>
						</div>
						<div className='flex bg-slate-100 p-1 rounded-lg'>
							{(["1H", "24H", "7D"] as const).map((range) => (
								<button
									key={range}
									onClick={() => setTimeRange(range)}
									className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
										timeRange === range
											? "bg-white text-indigo-600 shadow-sm"
											: "text-slate-500 hover:text-slate-700"
									}`}>
									{range}
								</button>
							))}
						</div>
					</div>

					<div className='h-64 w-full'>
						{metricsLoading ? (
							<div className='h-full flex items-center justify-center'>
								<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600'></div>
							</div>
						) : (
							<ResponsiveContainer width='100%' height='100%'>
								<AreaChart data={chartData}>
									<defs>
										<linearGradient id='colorReq' x1='0' y1='0' x2='0' y2='1'>
											<stop offset='5%' stopColor='#6366f1' stopOpacity={0.1} />
											<stop offset='95%' stopColor='#6366f1' stopOpacity={0} />
										</linearGradient>
										<linearGradient id='colorLat' x1='0' y1='0' x2='0' y2='1'>
											<stop offset='5%' stopColor='#8b5cf6' stopOpacity={0.1} />
											<stop offset='95%' stopColor='#8b5cf6' stopOpacity={0} />
										</linearGradient>
									</defs>
									<CartesianGrid
										strokeDasharray='3 3'
										vertical={false}
										stroke='#f1f5f9'
									/>
									<XAxis
										dataKey='time'
										axisLine={false}
										tickLine={false}
										tick={{ fontSize: 11, fill: "#94a3b8" }}
									/>
									<YAxis
										yAxisId='left'
										axisLine={false}
										tickLine={false}
										tick={{ fontSize: 11, fill: "#94a3b8" }}
									/>
									<YAxis
										yAxisId='right'
										orientation='right'
										axisLine={false}
										tickLine={false}
										tick={{ fontSize: 11, fill: "#94a3b8" }}
									/>
									<Tooltip
										contentStyle={{
											borderRadius: "8px",
											border: "none",
											boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
										}}
										labelStyle={{ fontWeight: "bold", color: "#1e293b" }}
									/>
									<Area
										yAxisId='left'
										type='monotone'
										dataKey='requests'
										name='Requests/s'
										stroke='#6366f1'
										strokeWidth={2}
										fillOpacity={1}
										fill='url(#colorReq)'
									/>
									<Area
										yAxisId='right'
										type='monotone'
										dataKey='latency'
										name='Latency (ms)'
										stroke='#a855f7'
										strokeWidth={2}
										fillOpacity={1}
										fill='url(#colorLat)'
									/>
								</AreaChart>
							</ResponsiveContainer>
						)}
					</div>
				</div>

				{/* 3. Resource Gauges */}
				<div className='space-y-4'>
					{/* CPU Card */}
					<div className='bg-white p-5 rounded-xl border border-slate-200 shadow-sm'>
						<div className='flex justify-between items-center mb-2'>
							<div className='flex items-center gap-2 text-sm font-bold text-slate-700'>
								<Cpu className='w-4 h-4 text-slate-400' /> CPU Load
							</div>
							<span className='text-sm font-mono font-bold text-slate-900'>
								{resources.cpu}%
							</span>
						</div>
						<div className='w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-2'>
							<div
								className={`h-full rounded-full transition-all duration-1000 ${getLoadColor(
									resources.cpu
								)}`}
								style={{ width: `${resources.cpu}%` }}></div>
						</div>
						<p className='text-xs text-slate-500 text-right'>
							Allocated: {specs.cpuCores} vCPU
						</p>
					</div>

					{/* RAM Card */}
					<div className='bg-white p-5 rounded-xl border border-slate-200 shadow-sm'>
						<div className='flex justify-between items-center mb-2'>
							<div className='flex items-center gap-2 text-sm font-bold text-slate-700'>
								<Server className='w-4 h-4 text-slate-400' /> Memory
							</div>
							<span className='text-sm font-mono font-bold text-slate-900'>
								{resources.memory}%
							</span>
						</div>
						<div className='w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-2'>
							<div
								className={`h-full rounded-full transition-all duration-1000 ${getLoadColor(
									resources.memory
								)}`}
								style={{ width: `${resources.memory}%` }}></div>
						</div>
						<p className='text-xs text-slate-500 text-right'>
							{((specs.ramGb * resources.memory) / 100).toFixed(1)} GB /{" "}
							{specs.ramGb} GB
						</p>
					</div>

					{/* Storage Card */}
					<div className='bg-white p-5 rounded-xl border border-slate-200 shadow-sm'>
						<div className='flex justify-between items-center mb-2'>
							<div className='flex items-center gap-2 text-sm font-bold text-slate-700'>
								<HardDrive className='w-4 h-4 text-slate-400' /> NVMe Storage
							</div>
							<span className='text-sm font-mono font-bold text-slate-900'>
								{resources.storage}%
							</span>
						</div>
						<div className='w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-2'>
							<div
								className={`h-full rounded-full transition-all duration-1000 bg-indigo-500`}
								style={{ width: `${resources.storage}%` }}></div>
						</div>
						<p className='text-xs text-slate-500 text-right'>
							{((specs.storageGb * resources.storage) / 100).toFixed(0)} GB /{" "}
							{specs.storageGb} GB
						</p>
					</div>
				</div>
			</div>

			{/* 4. Connection Details */}
			<div className='bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden'>
				<div className='px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center'>
					<h3 className='font-bold text-slate-900 flex items-center gap-2'>
						<Database className='w-4 h-4 text-slate-500' /> Connection Details
					</h3>
				</div>
				<div className='p-6 grid gap-6'>
					{/* Database Row */}
					<div>
						<h4 className='text-xs font-bold text-slate-400 uppercase tracking-wider mb-3'>
							Database (Internal)
						</h4>
						<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
							<div className='relative group'>
								<label className='text-[10px] font-bold text-slate-500 uppercase mb-1 block'>
									Host
								</label>
								<div className='flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2'>
									<code className='text-xs font-mono text-slate-700 flex-1 truncate'>
										{dbHost}
									</code>
									<button
										onClick={() => handleCopy(dbHost, "db-host")}
										className='ml-2 text-slate-400 hover:text-indigo-600'>
										{copiedField === "db-host" ? (
											<Check className='w-3 h-3' />
										) : (
											<Copy className='w-3 h-3' />
										)}
									</button>
								</div>
							</div>
							<div className='relative group'>
								<label className='text-[10px] font-bold text-slate-500 uppercase mb-1 block'>
									Database
								</label>
								<div className='flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2'>
									<code className='text-xs font-mono text-slate-700 flex-1 truncate'>
										{dbName}
									</code>
									<button
										onClick={() => handleCopy(dbName, "db-name")}
										className='ml-2 text-slate-400 hover:text-indigo-600'>
										{copiedField === "db-name" ? (
											<Check className='w-3 h-3' />
										) : (
											<Copy className='w-3 h-3' />
										)}
									</button>
								</div>
							</div>
							<div className='relative group'>
								<label className='text-[10px] font-bold text-slate-500 uppercase mb-1 block'>
									User
								</label>
								<div className='flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2'>
									<code className='text-xs font-mono text-slate-700 flex-1 truncate'>
										{dbUser}
									</code>
									<button
										onClick={() => handleCopy(dbUser, "db-user")}
										className='ml-2 text-slate-400 hover:text-indigo-600'>
										{copiedField === "db-user" ? (
											<Check className='w-3 h-3' />
										) : (
											<Copy className='w-3 h-3' />
										)}
									</button>
								</div>
							</div>
							<div className='relative group'>
								<label className='text-[10px] font-bold text-slate-500 uppercase mb-1 block'>
									Password
								</label>
								<div className='flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2'>
									<code className='text-xs font-mono text-slate-700 flex-1 truncate'>
										{showDbPass ? dbPassword : "••••••••••••"}
									</code>
									<button
										onClick={() => setShowDbPass(!showDbPass)}
										className='ml-2 text-slate-400 hover:text-slate-600'>
										{showDbPass ? (
											<EyeOff className='w-3 h-3' />
										) : (
											<Eye className='w-3 h-3' />
										)}
									</button>
									<button
										onClick={() => handleCopy(dbPassword, "db-pass")}
										className='ml-2 text-slate-400 hover:text-indigo-600'>
										{copiedField === "db-pass" ? (
											<Check className='w-3 h-3' />
										) : (
											<Copy className='w-3 h-3' />
										)}
									</button>
								</div>
							</div>
						</div>
					</div>

					{/* WordPress Admin Email */}
					{(wpAdminEmail || instance.wpAdminUser) && (
						<div className='pt-4 border-t border-slate-100'>
							<h4 className='text-xs font-bold text-slate-400 uppercase tracking-wider mb-3'>
								WordPress Admin
							</h4>
							<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
								{instance.wpAdminUser && (
									<div className='relative group'>
										<label className='text-[10px] font-bold text-slate-500 uppercase mb-1 block'>
											Admin Username
										</label>
										<div className='flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2'>
											<code className='text-xs font-mono text-slate-700 flex-1 truncate'>
												{instance.wpAdminUser}
											</code>
											<button
												onClick={() =>
													handleCopy(instance.wpAdminUser, "wp-user")
												}
												className='ml-2 text-slate-400 hover:text-indigo-600'>
												{copiedField === "wp-user" ? (
													<Check className='w-3 h-3' />
												) : (
													<Copy className='w-3 h-3' />
												)}
											</button>
										</div>
									</div>
								)}
								{instance.wpAdminPassword && (
									<div className='relative group'>
										<label className='text-[10px] font-bold text-slate-500 uppercase mb-1 block'>
											Admin Password
										</label>
										<div className='flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2'>
											<code className='text-xs font-mono text-slate-700 flex-1 truncate'>
												{showDbPass ? instance.wpAdminPassword : "••••••••••••"}
											</code>
											<button
												onClick={() => setShowDbPass(!showDbPass)}
												className='ml-2 text-slate-400 hover:text-slate-600'>
												{showDbPass ? (
													<EyeOff className='w-3 h-3' />
												) : (
													<Eye className='w-3 h-3' />
												)}
											</button>
											<button
												onClick={() =>
													handleCopy(instance.wpAdminPassword, "wp-pass")
												}
												className='ml-2 text-slate-400 hover:text-indigo-600'>
												{copiedField === "wp-pass" ? (
													<Check className='w-3 h-3' />
												) : (
													<Copy className='w-3 h-3' />
												)}
											</button>
										</div>
									</div>
								)}
								{wpAdminEmail && (
									<div className='relative group'>
										<label className='text-[10px] font-bold text-slate-500 uppercase mb-1 block'>
											Admin Email
										</label>
										<div className='flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2'>
											<Mail className='w-3 h-3 text-slate-400 mr-2' />
											<code className='text-xs font-mono text-slate-700 flex-1 truncate'>
												{wpAdminEmail}
											</code>
											<button
												onClick={() => handleCopy(wpAdminEmail, "wp-email")}
												className='ml-2 text-slate-400 hover:text-indigo-600'>
												{copiedField === "wp-email" ? (
													<Check className='w-3 h-3' />
												) : (
													<Copy className='w-3 h-3' />
												)}
											</button>
										</div>
									</div>
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
