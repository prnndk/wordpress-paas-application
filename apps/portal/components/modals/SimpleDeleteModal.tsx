import React from "react";
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";

interface SimpleDeleteModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: string;
	message: React.ReactNode;
	isDeleting?: boolean;
}

export const SimpleDeleteModal: React.FC<SimpleDeleteModalProps> = ({
	isOpen,
	onClose,
	onConfirm,
	title,
	message,
	isDeleting = false,
}) => {
	if (!isOpen) return null;

	return (
		<div className='fixed inset-0 z-[100] flex items-center justify-center p-4'>
			<div
				className='absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity'
				onClick={onClose}
			/>

			<div className='relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200'>
				<button
					onClick={onClose}
					className='absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors'>
					<X className='w-5 h-5' />
				</button>

				<div className='p-6 text-center'>
					<div className='w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
						<AlertTriangle className='w-7 h-7 text-red-600' />
					</div>

					<h2 className='text-lg font-bold text-slate-900 mb-2'>{title}</h2>
					<div className='text-slate-600 text-sm mb-6 leading-relaxed'>
						{message}
					</div>

					<div className='flex gap-3'>
						<button
							onClick={onClose}
							disabled={isDeleting}
							className='flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors'>
							Cancel
						</button>
						<button
							onClick={onConfirm}
							disabled={isDeleting}
							className='flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2'>
							{isDeleting ? (
								<>
									<Loader2 className='w-4 h-4 animate-spin' /> Deleting...
								</>
							) : (
								<>
									<Trash2 className='w-4 h-4' /> Delete
								</>
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
