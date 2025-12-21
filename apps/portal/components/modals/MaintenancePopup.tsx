import React, { useState, useEffect } from 'react';
import { AlertTriangle, Wrench, Loader2 } from 'lucide-react';
import { publicMaintenanceService, MaintenanceStatus } from '../../src/lib/admin';
import { useAuth } from '../../context/AuthContext';

export const MaintenancePopup: React.FC = () => {
	const { user } = useAuth();
	const [maintenanceStatus, setMaintenanceStatus] = useState<MaintenanceStatus | null>(null);
	const [isChecking, setIsChecking] = useState(true);

	useEffect(() => {
		// Check maintenance status immediately
		checkMaintenanceStatus();

		// Poll every 10 seconds
		const interval = setInterval(() => {
			checkMaintenanceStatus();
		}, 10000);

		return () => clearInterval(interval);
	}, []);

	const checkMaintenanceStatus = async () => {
		try {
			const status = await publicMaintenanceService.getMaintenanceStatus();
			setMaintenanceStatus(status);
			setIsChecking(false);
		} catch (error) {
			console.error('Failed to check maintenance status:', error);
			setIsChecking(false);
		}
	};

	// Don't show popup for admin users
	if (user?.roles?.includes('admin')) {
		return null;
	}

	// Don't show anything if not in maintenance or still checking
	if (isChecking || !maintenanceStatus?.isActive) {
		return null;
	}

	return (
		<div className='fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[9999] animate-in fade-in duration-300'>
			<div className='bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-200'>
				<div className='flex flex-col items-center text-center space-y-6'>
					{/* Icon */}
					<div className='relative'>
						<div className='absolute inset-0 bg-orange-500/20 rounded-full blur-xl animate-pulse'></div>
						<div className='relative p-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-full'>
							<Wrench className='w-12 h-12 text-white' />
						</div>
					</div>

					{/* Title */}
					<div>
						<h2 className='text-2xl font-bold text-slate-900 mb-2'>
							{maintenanceStatus.announcement?.title || 'System Maintenance'}
						</h2>
						<p className='text-slate-600 leading-relaxed'>
							{maintenanceStatus.announcement?.message ||
								'We are currently performing scheduled maintenance to improve our services. Please check back shortly.'}
						</p>
					</div>

					{/* Status */}
					<div className='w-full bg-slate-50 rounded-xl p-4 border border-slate-200'>
						<div className='flex items-center justify-center gap-3 text-slate-700'>
							<Loader2 className='w-5 h-5 animate-spin text-orange-500' />
							<span className='font-medium'>Maintenance in progress...</span>
						</div>
						{maintenanceStatus.startedAt && (
							<p className='text-xs text-slate-500 mt-2'>
								Started: {new Date(maintenanceStatus.startedAt).toLocaleTimeString()}
							</p>
						)}
					</div>

					{/* Info */}
					<div className='flex items-start gap-2 text-sm text-slate-500 bg-blue-50 border border-blue-100 rounded-lg p-3'>
						<AlertTriangle className='w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5' />
						<p className='text-left text-blue-900'>
							This page will automatically refresh when maintenance is complete. Thank you for your patience.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};
