import React, { useState, useEffect } from "react";
import {
	Users,
	Search,
	Shield,
	ShieldCheck,
	ToggleLeft,
	ToggleRight,
	Loader2,
} from "lucide-react";
import { adminService, AdminUser } from "../../src/lib/admin";

export const AdminUsersPage: React.FC = () => {
	const [users, setUsers] = useState<AdminUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [updating, setUpdating] = useState<string | null>(null);
	const [toast, setToast] = useState<string | null>(null);

	const showToast = (msg: string) => {
		setToast(msg);
		setTimeout(() => setToast(null), 3000);
	};

	useEffect(() => {
		const fetchUsers = async () => {
			try {
				const data = await adminService.getUsers();
				setUsers(data);
			} catch (error: any) {
				console.error("Failed to fetch users:", error);
				showToast("Failed to load users");
			} finally {
				setLoading(false);
			}
		};

		fetchUsers();
	}, []);

	const toggleUserStatus = async (userId: string, isActive: boolean) => {
		setUpdating(userId);
		try {
			await adminService.toggleUserStatus(userId, isActive);
			setUsers(users.map((u) => (u.id === userId ? { ...u, isActive } : u)));
			showToast(`User ${isActive ? "enabled" : "disabled"}`);
		} catch (error: any) {
			console.error("Failed to update user:", error);
			showToast("Failed to update user status");
		} finally {
			setUpdating(null);
		}
	};

	const toggleUserRole = async (userId: string, role: "user" | "admin") => {
		setUpdating(userId);
		try {
			await adminService.toggleUserRole(userId, role);
			setUsers(users.map((u) => (u.id === userId ? { ...u, role } : u)));
			showToast(`User role changed to ${role}`);
		} catch (error: any) {
			console.error("Failed to update user role:", error);
			showToast("Failed to update user role");
		} finally {
			setUpdating(null);
		}
	};

	const filteredUsers = users.filter(
		(u) =>
			u.email.toLowerCase().includes(search.toLowerCase()) ||
			u.name?.toLowerCase().includes(search.toLowerCase())
	);

	if (loading) {
		return (
			<div className='flex items-center justify-center min-h-[400px]'>
				<Loader2 className='w-8 h-8 animate-spin text-indigo-600' />
			</div>
		);
	}

	return (
		<div className='bg-slate-50/50 min-h-screen space-y-8 animate-in fade-in duration-500 pb-10'>
			{/* Toast */}
			{toast && (
				<div className='fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl z-[9999] animate-in slide-in-from-bottom-5 border border-slate-700/50 backdrop-blur-sm'>
					{toast}
				</div>
			)}

			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-2xl font-bold text-slate-900 tracking-tight'>
						User Management
					</h1>
					<p className='text-slate-500 mt-1'>
						Manage user access and roles across the platform
					</p>
				</div>
				<div className='bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm text-sm font-medium text-slate-600'>
					{users.length} Total Users
				</div>
			</div>

			<div className='bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden'>
				{/* Search Header */}
				<div className='p-6 border-b border-slate-100 bg-slate-50/30'>
					<div className='relative max-w-md'>
						<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400' />
						<input
							type='text'
							placeholder='Search users by email or name...'
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className='w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm'
						/>
					</div>
				</div>

				{/* Table */}
				<div className='overflow-x-auto'>
					<table className='w-full'>
						<thead className='bg-slate-50 border-b border-slate-100'>
							<tr>
								<th className='px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider'>
									User
								</th>
								<th className='px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider'>
									Role
								</th>
								<th className='px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider'>
									Tenants
								</th>
								<th className='px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider'>
									Status
								</th>
								<th className='px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider'>
									Created
								</th>
								<th className='px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider'>
									Actions
								</th>
							</tr>
						</thead>
						<tbody className='divide-y divide-slate-100'>
							{filteredUsers.map((user) => (
								<tr
									key={user.id}
									className='hover:bg-slate-50/80 transition-colors group'>
									<td className='px-6 py-4'>
										<div className='flex items-center gap-3'>
											<div className='w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm'>
												{user.email[0].toUpperCase()}
											</div>
											<div>
												<div className='font-medium text-slate-900'>
													{user.email}
												</div>
												<div className='text-sm text-slate-500'>
													{user.name || "No name"}
												</div>
											</div>
										</div>
									</td>
									<td className='px-6 py-4'>
										<button
											onClick={() =>
												toggleUserRole(
													user.id,
													user.role === "admin" ? "user" : "admin"
												)
											}
											disabled={updating === user.id}
											className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
												user.role === "admin"
													? "bg-purple-100 text-purple-700 hover:bg-purple-200 ring-1 ring-purple-500/20"
													: "bg-slate-100 text-slate-700 hover:bg-slate-200 ring-1 ring-slate-500/20"
											}`}>
											{user.role === "admin" ? (
												<ShieldCheck className='w-3.5 h-3.5' />
											) : (
												<Shield className='w-3.5 h-3.5' />
											)}
											{user.role.charAt(0).toUpperCase() + user.role.slice(1)}
										</button>
									</td>
									<td className='px-6 py-4'>
										<span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800'>
											{user._count.tenants}
										</span>
									</td>
									<td className='px-6 py-4'>
										<span
											className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${
												user.isActive
													? "bg-green-50 text-green-700 ring-green-600/20"
													: "bg-red-50 text-red-700 ring-red-600/20"
											}`}>
											<span
												className={`w-1.5 h-1.5 rounded-full ${
													user.isActive ? "bg-green-600" : "bg-red-600"
												}`}></span>
											{user.isActive ? "Active" : "Disabled"}
										</span>
									</td>
									<td className='px-6 py-4 text-slate-500 text-sm'>
										{new Date(user.createdAt).toLocaleDateString(undefined, {
											year: "numeric",
											month: "short",
											day: "numeric",
										})}
									</td>
									<td className='px-6 py-4 text-right'>
										<button
											onClick={() => toggleUserStatus(user.id, !user.isActive)}
											disabled={updating === user.id}
											className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border shadow-sm ${
												user.isActive
													? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-red-600 hover:border-red-200"
													: "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
											} disabled:opacity-50 disabled:cursor-not-allowed`}>
											{updating === user.id ? (
												<Loader2 className='w-4 h-4 animate-spin' />
											) : user.isActive ? (
												<>Disable</>
											) : (
												<>Enable</>
											)}
										</button>
									</td>
								</tr>
							))}
							{filteredUsers.length === 0 && (
								<tr>
									<td
										colSpan={6}
										className='px-6 py-16 text-center text-slate-500'>
										<div className='bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4'>
											<Users className='w-8 h-8 text-slate-400' />
										</div>
										<h3 className='text-slate-900 font-medium mb-1'>
											No users found
										</h3>
										<p className='text-slate-500 text-sm'>
											No users match your search criteria.
										</p>
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
};
