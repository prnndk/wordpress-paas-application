import React, { useEffect, useState } from "react";
import {
	X,
	Search,
	Filter,
	AlertCircle,
	Info,
	AlertTriangle,
} from "lucide-react";
import { refreshProfile } from "../../src/lib/auth";
import { useAuth } from "../../context/AuthContext";

// Audit log item type
interface AuditLogItem {
	id: string;
	timestamp: string;
	level: string;
	source: string;
	message: string;
	tenantId?: string;
}

interface AuditLogModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({
	isOpen,
	onClose,
}) => {
	const { user } = useAuth();
	const [logs, setLogs] = useState<AuditLogItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [levelFilter, setLevelFilter] = useState<
		"all" | "info" | "warn" | "error"
	>("all");

	useEffect(() => {
		if (isOpen && user?.id) {
			fetchLogs();
		}
	}, [isOpen, user?.id]);

	const fetchLogs = async () => {
		if (!user?.id) return;

		try {
			setLoading(true);
			// Refresh profile with audit data included
			const profile = await refreshProfile(["audit"]);
			if (profile?.auditSummary?.recent) {
				setLogs(profile.auditSummary.recent);
			}
		} catch (error) {
			console.error("Failed to fetch audit logs:", error);
		} finally {
			setLoading(false);
		}
	};

	// Clean message from ALL non-printable characters
	const cleanMessage = (message: string): string => {
		return (
			message
				// Remove all control characters (0x00-0x1F and 0x7F-0x9F)
				.replace(/[\x00-\x1F\x7F-\x9F]/g, "")
				// Remove replacement character � (U+FFFD)
				.replace(/\uFFFD/g, "")
				// Remove other problematic Unicode characters
				.replace(/[\u0000-\u001F\u007F-\u009F\uFFFD]/g, "")
				// Remove duplicate timestamp at start (format: 2025-12-20T09:00:09.123456789Z)
				.replace(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z\s*/, "")
				// Trim whitespace
				.trim()
		);
	};

	// Format timestamp
	const formatTimestamp = (timestamp: string): string => {
		const date = new Date(timestamp);
		return new Intl.DateTimeFormat("id-ID", {
			dateStyle: "medium",
			timeStyle: "medium",
		}).format(date);
	};

	// Filter logs
	const filteredLogs = logs.filter((log) => {
		const matchesSearch = cleanMessage(log.message)
			.toLowerCase()
			.includes(searchQuery.toLowerCase());
		const matchesLevel = levelFilter === "all" || log.level === levelFilter;
		return matchesSearch && matchesLevel;
	});

	// Get icon for log level
	const getLevelIcon = (level: string) => {
		switch (level) {
			case "error":
				return <AlertCircle className='w-4 h-4 text-red-600' />;
			case "warn":
				return <AlertTriangle className='w-4 h-4 text-yellow-600' />;
			default:
				return <Info className='w-4 h-4 text-blue-600' />;
		}
	};

	// Get level badge color
	const getLevelBadge = (level: string) => {
		switch (level) {
			case "error":
				return "bg-red-100 text-red-800 border-red-200";
			case "warn":
				return "bg-yellow-100 text-yellow-800 border-yellow-200";
			default:
				return "bg-blue-100 text-blue-800 border-blue-200";
		}
	};

	if (!isOpen) return null;

	return (
		<div className='fixed inset-0 z-50 overflow-y-auto'>
			<div className='flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0'>
				{/* Overlay */}
				<div
					className='fixed inset-0 transition-opacity bg-slate-900 bg-opacity-75'
					onClick={onClose}></div>

				{/* Modal */}
				<div className='inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl'>
					{/* Header */}
					<div className='flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50'>
						<div>
							<h3 className='text-lg font-bold text-slate-900'>
								Audit Log History
							</h3>
							<p className='text-sm text-slate-500 mt-0.5'>
								Complete activity log for your account
							</p>
						</div>
						<button
							onClick={onClose}
							className='p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors'>
							<X className='w-5 h-5' />
						</button>
					</div>

					{/* Filters */}
					<div className='px-6 py-4 border-b border-slate-200 bg-white space-y-3'>
						{/* Search */}
						<div className='relative'>
							<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400' />
							<input
								type='text'
								placeholder='Search logs...'
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className='w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
							/>
						</div>

						{/* Level Filter */}
						<div className='flex items-center gap-2'>
							<Filter className='w-4 h-4 text-slate-400' />
							<div className='flex gap-2'>
								{(["all", "info", "warn", "error"] as const).map((level) => (
									<button
										key={level}
										onClick={() => setLevelFilter(level)}
										className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
											levelFilter === level
												? "bg-indigo-600 text-white"
												: "bg-slate-100 text-slate-600 hover:bg-slate-200"
										}`}>
										{level.charAt(0).toUpperCase() + level.slice(1)}
									</button>
								))}
							</div>
							<span className='ml-auto text-xs text-slate-500'>
								{filteredLogs.length} of {logs.length} logs
							</span>
						</div>
					</div>

					{/* Logs List */}
					<div className='px-6 py-4 max-h-[500px] overflow-y-auto'>
						{loading ? (
							<div className='flex items-center justify-center py-12'>
								<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600'></div>
							</div>
						) : filteredLogs.length === 0 ? (
							<div className='text-center py-12'>
								<Info className='w-12 h-12 text-slate-300 mx-auto mb-3' />
								<p className='text-slate-500 font-medium'>No logs found</p>
								<p className='text-sm text-slate-400 mt-1'>
									Try adjusting your filters
								</p>
							</div>
						) : (
							<div className='space-y-3'>
								{filteredLogs.map((log) => (
									<div
										key={log.id}
										className='p-4 border border-slate-200 rounded-lg hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors'>
										<div className='flex items-start gap-3'>
											<div className='mt-0.5'>{getLevelIcon(log.level)}</div>
											<div className='flex-1 min-w-0'>
												<div className='flex items-center gap-2 mb-1'>
													<span
														className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getLevelBadge(
															log.level
														)}`}>
														{log.level.toUpperCase()}
													</span>
													<span className='text-xs text-slate-500'>
														{formatTimestamp(log.timestamp)}
													</span>
													{log.source && (
														<span className='text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded'>
															{log.source}
														</span>
													)}
												</div>
												<p className='text-sm text-slate-900 font-mono break-words'>
													{cleanMessage(log.message)}
												</p>
												{log.tenantId && (
													<p className='text-xs text-slate-400 mt-1'>
														Tenant: {log.tenantId.substring(0, 12)}...
													</p>
												)}
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>

					{/* Footer */}
					<div className='px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center'>
						<p className='text-xs text-slate-500'>
							Showing logs for user:{" "}
							<span className='font-medium text-slate-700'>{user?.email}</span>
						</p>
						<button
							onClick={onClose}
							className='px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors'>
							Close
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
