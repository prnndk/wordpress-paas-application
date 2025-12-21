import React, { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmationModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	isDestructive?: boolean;
	isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
	isOpen,
	onClose,
	onConfirm,
	title,
	message,
	confirmText = "Confirm",
	cancelText = "Cancel",
	isDestructive = false,
	isLoading = false,
}) => {
	// Close on escape key
	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape" && isOpen && !isLoading) {
				onClose();
			}
		};

		document.addEventListener("keydown", handleEscape);
		return () => document.removeEventListener("keydown", handleEscape);
	}, [isOpen, onClose, isLoading]);

	if (!isOpen) return null;

	return (
		<div className='fixed inset-0 z-[100] flex items-center justify-center p-4 mt-0'>
			<div
				className='absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200'
				onClick={isLoading ? undefined : onClose}
			/>

			<div className='relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200'>
				<button
					onClick={onClose}
					disabled={isLoading}
					className='absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50'>
					<X className='w-5 h-5' />
				</button>

				<div className='p-6 text-center'>
					<div
						className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
							isDestructive
								? "bg-red-100 text-red-600"
								: "bg-indigo-100 text-indigo-600"
						}`}>
						<AlertTriangle className='w-6 h-6' />
					</div>

					<h2 className='text-lg font-bold text-slate-900 mb-2'>{title}</h2>
					<p className='text-slate-600 text-sm mb-6'>{message}</p>

					<div className='flex gap-3'>
						<button
							onClick={onClose}
							disabled={isLoading}
							className='flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors disabled:opacity-50'>
							{cancelText}
						</button>
						<button
							onClick={onConfirm}
							disabled={isLoading}
							className={`flex-1 py-2.5 font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
								isDestructive
									? "bg-red-600 hover:bg-red-700 text-white"
									: "bg-indigo-600 hover:bg-indigo-700 text-white"
							}`}>
							{isLoading ? (
								<div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
							) : null}
							{confirmText}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
