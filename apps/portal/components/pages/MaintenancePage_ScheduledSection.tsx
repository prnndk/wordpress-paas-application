// Add this section before the closing </div> tags in MaintenancePage.tsx
// Insert this after the Announcements Section (around line 645)

{/* Scheduled Maintenance Section */}
<div className='bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-8'>
	<div className='p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50'>
		<div className='flex items-center gap-3'>
			<div className='p-2 bg-indigo-100 rounded-lg text-indigo-600'>
				<Clock className='w-5 h-5' />
			</div>
			<div>
				<h2 className='text-lg font-bold text-slate-900'>
					Scheduled Maintenance
				</h2>
				<p className='text-sm text-slate-500 hidden sm:block'>
					Schedule maintenance tasks to run automatically
				</p>
			</div>
		</div>
		<button
			onClick={() => {
				setScheduleForm({
					scheduledAt: '',
					targetImage: currentImage,
					forceUpdate: false,
					announcementId: '',
				});
				setShowScheduleModal(true);
			}}
			className='inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm'>
			<Plus className='w-4 h-4 mr-2' />
			Schedule
		</button>
	</div>

	<div className='overflow-x-auto'>
		<table className='w-full'>
			<thead className='bg-slate-50 border-b border-slate-100'>
				<tr>
					<th className='px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider'>
						Scheduled Time
					</th>
					<th className='px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider'>
						Target Image
					</th>
					<th className='px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-32'>
						Status
					</th>
					<th className='px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-32'>
						Actions
					</th>
				</tr>
			</thead>
			<tbody className='divide-y divide-slate-100'>
				{scheduledMaintenances.map((maintenance) => (
					<tr
						key={maintenance.id}
						className='hover:bg-slate-50/80 transition-colors group'>
						<td className='px-6 py-4'>
							<div className='flex items-center gap-2'>
								<Calendar className='w-4 h-4 text-slate-400' />
								<span className='font-medium text-slate-900'>
									{new Date(maintenance.scheduledAt).toLocaleString()}
								</span>
							</div>
						</td>
						<td className='px-6 py-4'>
							<code className='text-sm bg-slate-100 px-2 py-1 rounded text-slate-700 font-mono'>
								{maintenance.targetImage}
							</code>
						</td>
						<td className='px-6 py-4'>
							<span
								className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${
									maintenance.status === 'completed'
										? 'bg-green-50 text-green-700 ring-green-600/20'
										: maintenance.status === 'failed'
										? 'bg-red-50 text-red-700 ring-red-600/20'
										: maintenance.status === 'in_progress'
										? 'bg-blue-50 text-blue-700 ring-blue-600/20'
										: maintenance.status === 'cancelled'
										? 'bg-slate-100 text-slate-700 ring-slate-500/20'
										: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20'
								}`}>
								<span
									className={`w-1.5 h-1.5 rounded-full ${
										maintenance.status === 'completed'
											? 'bg-green-600'
											: maintenance.status === 'failed'
											? 'bg-red-600'
											: maintenance.status === 'in_progress'
											? 'bg-blue-600 animate-pulse'
											: maintenance.status === 'cancelled'
											? 'bg-slate-500'
											: 'bg-yellow-600'
									}`}></span>
								{maintenance.status.charAt(0).toUpperCase() + maintenance.status.slice(1).replace('_', ' ')}
							</span>
						</td>
						<td className='px-6 py-4 text-right'>
							<div className='flex items-center justify-end gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity'>
								{maintenance.status === 'pending' && (
									<>
										<button
											title='Execute Now'
											onClick={() => executeScheduledMaintenance(maintenance.id)}
											className='p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors'>
											<Play className='w-4 h-4' />
										</button>
										<button
											title='Cancel'
											onClick={() => cancelScheduledMaintenance(maintenance.id)}
											className='p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors'>
											<X className='w-4 h-4' />
										</button>
									</>
								)}
							</div>
						</td>
					</tr>
				))}
				{scheduledMaintenances.length === 0 && (
					<tr>
						<td
							colSpan={4}
							className='px-6 py-16 text-center text-slate-500'>
							<div className='bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4'>
								<Clock className='w-8 h-8 text-slate-400' />
							</div>
							<h3 className='text-slate-900 font-medium mb-1'>
								No scheduled maintenance
							</h3>
							<p className='text-slate-500 text-sm'>
								Schedule a maintenance task to run automatically.
							</p>
						</td>
					</tr>
				)}
			</tbody>
		</table>
	</div>
</div>

{/* Schedule Maintenance Modal */}
{showScheduleModal && (
	<div className='fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200'>
		<div className='bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100'>
			<div className='flex items-center justify-between mb-6'>
				<h3 className='text-xl font-bold text-slate-900'>
					Schedule Maintenance
				</h3>
				<button
					onClick={() => setShowScheduleModal(false)}
					className='p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-700'>
					<X className='w-5 h-5' />
				</button>
			</div>

			<div className='space-y-5'>
				<div>
					<label className='block text-sm font-semibold text-slate-700 mb-1.5'>
						Scheduled Time
					</label>
					<input
						type='datetime-local'
						value={scheduleForm.scheduledAt}
						onChange={(e) =>
							setScheduleForm({
								...scheduleForm,
								scheduledAt: e.target.value,
							})
						}
						className='w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm'
					/>
				</div>

				<div>
					<label className='block text-sm font-semibold text-slate-700 mb-1.5'>
						Target Image
					</label>
					<input
						type='text'
						value={scheduleForm.targetImage}
						onChange={(e) =>
							setScheduleForm({
								...scheduleForm,
								targetImage: e.target.value,
							})
						}
						placeholder='prnndk/wp-paas-wordpress:latest'
						className='w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-sm'
					/>
				</div>

				<div>
					<label className='block text-sm font-semibold text-slate-700 mb-1.5'>
						Link Announcement (Optional)
					</label>
					<select
						value={scheduleForm.announcementId}
						onChange={(e) =>
							setScheduleForm({
								...scheduleForm,
								announcementId: e.target.value,
							})
						}
						className='w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm appearance-none bg-white'>
						<option value=''>No announcement</option>
						{announcements.map((ann) => (
							<option key={ann.id} value={ann.id}>
								{ann.title}
							</option>
						))}
					</select>
				</div>

				<label className='flex items-center gap-3 cursor-pointer group'>
					<div className='relative flex items-center'>
						<input
							type='checkbox'
							checked={scheduleForm.forceUpdate}
							onChange={(e) =>
								setScheduleForm({
									...scheduleForm,
									forceUpdate: e.target.checked,
								})
							}
							className='peer sr-only'
						/>
						<div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
					</div>
					<span className='text-sm font-medium text-slate-700 group-hover:text-slate-900'>
						Force Pull Image
					</span>
				</label>

				<button
					onClick={createScheduledMaintenance}
					disabled={!scheduleForm.scheduledAt || !scheduleForm.targetImage}
					className='w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl font-semibold shadow-md shadow-indigo-200 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none mt-2'>
					Schedule Maintenance
				</button>
			</div>
		</div>
	</div>
)}
