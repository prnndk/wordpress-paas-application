import React, { useEffect, useRef, useState } from "react";
import {
	X,
	Terminal,
	Copy,
	Pause,
	Play,
	Trash2,
	Check,
	RefreshCw,
	Loader2,
} from "lucide-react";
import { dashboardService } from "../../src/lib/dashboard";

interface LogViewerModalProps {
	isOpen: boolean;
	onClose: () => void;
	instanceId: string;
	instanceName: string;
}

export const LogViewerModal: React.FC<LogViewerModalProps> = ({
	isOpen,
	onClose,
	instanceId,
	instanceName,
}) => {
	const [logs, setLogs] = useState<string[]>([]);
	const [isPaused, setIsPaused] = useState(false);
	const [isCopied, setIsCopied] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const scrollRef = useRef<HTMLDivElement>(null);
	const intervalRef = useRef<number | null>(null);

	// Fetch logs from API
	const fetchLogs = async () => {
		if (!instanceId) return;

		try {
			setError(null);
			const response = await dashboardService.getLogs(instanceId, 100);
			if (response.logs) {
				// Split logs by newline and filter empty lines
				const logLines = response.logs
					.split("\n")
					.filter((line) => line.trim());
				setLogs(logLines);
			}
		} catch (err: any) {
			console.error("Failed to fetch logs:", err);
			setError(err.message || "Failed to fetch logs");
		}
	};

	// Initial fetch and setup polling
	useEffect(() => {
		if (isOpen && instanceId) {
			setIsLoading(true);
			setLogs([]);
			setError(null);

			// Initial fetch
			fetchLogs().finally(() => setIsLoading(false));
		} else {
			if (intervalRef.current) clearInterval(intervalRef.current);
			setLogs([]);
		}

		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, [isOpen, instanceId]);

	// Polling for real-time updates
	useEffect(() => {
		if (!isOpen || isPaused || !instanceId) {
			if (intervalRef.current) clearInterval(intervalRef.current);
			return;
		}

		intervalRef.current = window.setInterval(() => {
			fetchLogs();
		}, 3000); // Poll every 3 seconds

		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, [isOpen, isPaused, instanceId]);

	// Auto-scroll
	useEffect(() => {
		if (scrollRef.current && !isPaused) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	}, [logs, isPaused]);

	const handleCopy = () => {
		navigator.clipboard.writeText(logs.join("\n"));
		setIsCopied(true);
		setTimeout(() => setIsCopied(false), 2000);
	};

	const handleClear = () => {
		setLogs([]);
	};

	const handleRefresh = () => {
		setIsLoading(true);
		fetchLogs().finally(() => setIsLoading(false));
	};

	if (!isOpen) return null;

	return (
		<div className='fixed inset-0 z-[100] flex items-center justify-center p-4'>
			<div
				className='absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity'
				onClick={onClose}
			/>

			<div className='relative w-full max-w-4xl bg-slate-900 rounded-xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col h-[600px] animate-in zoom-in-95 duration-200'>
				{/* Header */}
				<div className='flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700'>
					<div className='flex items-center gap-3'>
						<Terminal className='w-5 h-5 text-green-400' />
						<div>
							<h3 className='text-sm font-bold text-white'>
								Live Logs: {instanceName}
							</h3>
							<p className='text-xs text-slate-400 font-mono'>
								Container stdout/stderr
							</p>
						</div>
					</div>
					<div className='flex items-center gap-2'>
						<button
							onClick={handleRefresh}
							disabled={isLoading}
							className='p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors disabled:opacity-50'
							title='Refresh'>
							{isLoading ? (
								<Loader2 className='w-4 h-4 animate-spin' />
							) : (
								<RefreshCw className='w-4 h-4' />
							)}
						</button>
						<button
							onClick={() => setIsPaused(!isPaused)}
							className='p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors'
							title={isPaused ? "Resume" : "Pause"}>
							{isPaused ? (
								<Play className='w-4 h-4' />
							) : (
								<Pause className='w-4 h-4' />
							)}
						</button>
						<button
							onClick={handleCopy}
							className='p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors'
							title='Copy to Clipboard'>
							{isCopied ? (
								<Check className='w-4 h-4 text-green-500' />
							) : (
								<Copy className='w-4 h-4' />
							)}
						</button>
						<button
							onClick={handleClear}
							className='p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors'
							title='Clear Console'>
							<Trash2 className='w-4 h-4' />
						</button>
						<div className='h-4 w-px bg-slate-700 mx-1'></div>
						<button
							onClick={onClose}
							className='p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors'>
							<X className='w-4 h-4' />
						</button>
					</div>
				</div>

				{/* Terminal Window */}
				<div
					ref={scrollRef}
					className='flex-1 p-4 overflow-y-auto font-mono text-xs md:text-sm space-y-1 bg-black/50 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent'>
					{isLoading && logs.length === 0 ? (
						<div className='flex items-center justify-center h-full gap-3 text-slate-500'>
							<Loader2 className='w-5 h-5 animate-spin' />
							<span>Loading logs...</span>
						</div>
					) : error ? (
						<div className='flex items-center justify-center h-full text-red-400'>
							<span>Error: {error}</span>
						</div>
					) : logs.length === 0 ? (
						<div className='text-slate-500 italic'>No logs available...</div>
					) : (
						logs.map((log, i) => (
							<div
								key={i}
								className='flex gap-3 hover:bg-white/5 p-0.5 rounded group'>
								<span className='text-slate-600 select-none flex-shrink-0 group-hover:text-slate-500'>
									{i + 1}
								</span>
								<span
									className={
										log.toLowerCase().includes("error")
											? "text-red-400"
											: log.toLowerCase().includes("warn")
											? "text-yellow-400"
											: log.toLowerCase().includes("info")
											? "text-blue-400"
											: log.toLowerCase().includes("debug")
											? "text-purple-400"
											: "text-slate-300"
									}>
									{log}
								</span>
							</div>
						))
					)}
				</div>

				{/* Footer Status */}
				<div className='px-4 py-2 bg-slate-800 border-t border-slate-700 flex justify-between items-center text-xs'>
					<div className='flex items-center gap-2'>
						<span
							className={`w-2 h-2 rounded-full ${
								isPaused ? "bg-yellow-500" : "bg-green-500 animate-pulse"
							}`}></span>
						<span className='text-slate-400'>
							{isPaused ? "Paused" : "Streaming Live"}
						</span>
					</div>
					<span className='text-slate-500'>
						{logs.length} lines • Auto-refresh: {isPaused ? "Off" : "3s"}
					</span>
				</div>
			</div>
		</div>
	);
};
