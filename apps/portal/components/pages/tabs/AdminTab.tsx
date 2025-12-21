import React, { useState, useEffect, useRef } from "react";
import {
	Activity,
	Layers,
	User,
	Calendar,
	AlertTriangle,
	CheckCircle,
	Loader2,
	Box,
	HardDrive,
	Database,
	Server,
	Eye,
} from "lucide-react";
import { adminService } from "../../../src/lib/admin";

interface AdminTabProps {
	instance: any;
	onShowToast: (message: string) => void;
	onOpenInspect: () => void;
}

export const AdminTab: React.FC<AdminTabProps> = ({
	instance,
	onShowToast,
	onOpenInspect,
}) => {
	// Local state for admin-specific operations
	const [replicas, setReplicas] = useState(1);
	const [scaling, setScaling] = useState(false);
	const [scaleSuccess, setScaleSuccess] = useState(false);

	// Ref to track if we've initialized replicas from instance data
	const initializedReplicasRef = useRef(false);

	// Derive values from instance
	const currentReplicas =
		instance?.docker?.desiredReplicas ?? instance?.replicas ?? 1;
	const runningReplicas = instance?.runningReplicas ?? 0;

	// Initialize replicas from instance only once per instance change
	useEffect(() => {
		if (instance?.id && !initializedReplicasRef.current) {
			setReplicas(instance.replicas ?? 1);
			initializedReplicasRef.current = true;
		}
	}, [instance?.id]);

	// Reset the ref when instance ID changes
	useEffect(() => {
		initializedReplicasRef.current = false;
	}, [instance?.id]);

	const handleScale = async () => {
		if (!instance || scaling) return;
		if (replicas === currentReplicas) return;

		setScaling(true);
		try {
			const result = await adminService.scaleTenant(instance.id, replicas);
			if (result.success) {
				setScaleSuccess(true);
				setTimeout(() => setScaleSuccess(false), 3000);
				onShowToast(`Scaled to ${result.replicas} replicas`);
			}
		} catch (err: any) {
			console.error("Failed to scale:", err);
			onShowToast(`Failed to scale: ${err.message}`);
		} finally {
			setScaling(false);
		}
	};

	if (!instance) {
		return (
			<div className='flex items-center justify-center py-12'>
				<Loader2 className='w-6 h-6 animate-spin text-slate-400' />
			</div>
		);
	}

	return (
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
									<strong className='text-indigo-600'>{replicas}</strong>
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

			{/* Internal Details Section */}
			<div className='bg-white rounded-xl border border-slate-200'>
				<div className='px-6 py-4 border-b border-slate-100'>
					<h2 className='font-medium text-slate-900'>Internal Details</h2>
				</div>
				<div className='divide-y divide-slate-100'>
					<div className='px-6 py-4 flex items-center justify-between'>
						<div className='flex items-center gap-3'>
							<Box className='w-5 h-5 text-slate-400' />
							<span className='text-slate-600'>Service ID</span>
						</div>
						<span className='font-mono text-sm text-slate-900'>
							{instance.internal?.serviceId || "—"}
						</span>
					</div>
					<div className='px-6 py-4 flex items-center justify-between'>
						<div className='flex items-center gap-3'>
							<Database className='w-5 h-5 text-slate-400' />
							<span className='text-slate-600'>Database Name</span>
						</div>
						<span className='font-mono text-sm text-slate-900'>
							{instance.db?.name || "—"}
						</span>
					</div>
					<div className='px-6 py-4 flex items-center justify-between'>
						<div className='flex items-center gap-3'>
							<HardDrive className='w-5 h-5 text-slate-400' />
							<span className='text-slate-600'>Volume Name</span>
						</div>
						<span className='font-mono text-sm text-slate-900'>
							{instance.internal?.volumeName || "—"}
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

			{/* Container Inspection Section */}
			<div className='bg-white rounded-xl border border-slate-200 overflow-hidden'>
				<div className='px-6 py-4 border-b border-slate-100'>
					<h2 className='font-medium text-slate-900'>Container Inspection</h2>
					<p className='text-sm text-slate-500 mt-1'>
						View environment variables, mounts, resources, and tasks
					</p>
				</div>
				<div className='p-6'>
					<button
						onClick={onOpenInspect}
						className='w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2'>
						<Eye className='w-4 h-4' />
						View Container Details
					</button>
				</div>
			</div>
		</div>
	);
};
