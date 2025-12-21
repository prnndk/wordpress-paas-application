import React, {
	useState,
	createContext,
	useContext,
	useEffect,
	useCallback,
} from "react";
import { useNavigate, useLocation, Outlet, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
	getCachedProfile,
	refreshProfile,
	type TenantSummary,
} from "../src/lib/auth";
import type { SubscriptionCurrent } from "../src/types/auth";
import {
	LayoutDashboard,
	Server,
	CreditCard,
	Settings,
	FileText,
	LogOut,
	Bell,
	Search,
	Box,
	Boxes,
	ChevronRight,
	Plus,
	LifeBuoy,
	Menu,
	CheckCircle2,
	AlertTriangle,
	User,
	Shield,
	Users,
	Wrench,
	ChevronDown,
	PanelLeftClose,
	PanelLeftOpen,
	Megaphone,
	X,
} from "lucide-react";
import { CreateInstanceWizard } from "./modals/CreateInstanceWizard";
import { announcementService } from "../src/lib/announcements";
import { Announcement } from "../src/lib/admin";

// --- Types & Context ---
export interface Instance {
	id: string;
	name: string;
	slug: string; // Path segment, not subdomain
	region: string;
	plan: string;
	status: "running" | "stopped" | "provisioning" | "error";
	ip: string;
	endpoints?: {
		site: string;
		admin: string;
	};
	specs: { cpu: string; ram: string };
	created_at: string;
}

interface DashboardContextType {
	instances: Instance[];
	addInstance: (instance: Instance) => void;
	updateInstanceStatus: (id: string, status: Instance["status"]) => void;
	deleteInstance: (id: string) => void;
	isCreateModalOpen: boolean;
	setCreateModalOpen: (isOpen: boolean) => void;
	user: any;
	refreshInstances: (force?: boolean) => Promise<void>;
	// Subscription-Centric additions
	subscription: SubscriptionCurrent | null;
	quotaUsed: number;
	quotaAllowed: number;
	canCreateInstance: boolean;
	isSidebarCollapsed: boolean;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export const useDashboard = () => {
	const context = useContext(DashboardContext);
	if (!context)
		throw new Error("useDashboard must be used within DashboardLayout");
	return context;
};

// Helper function to convert TenantSummary to Instance
const tenantToInstance = (tenant: TenantSummary): Instance => ({
	id: tenant.id,
	name: tenant.name,
	slug: tenant.slug || tenant.name.toLowerCase().replace(/\s+/g, "-"),
	region: tenant.region || "us-east-1",
	plan: tenant.planName || "Starter",
	status: tenant.status,
	ip: "10.0.0.1", // Placeholder IP
	endpoints: tenant.endpoints,
	specs: {
		cpu: `${tenant.specs.cpuCores} vCPU`,
		ram: `${tenant.specs.ramGb}GB`,
	},
	created_at: tenant.createdAt,
});

// Navigation Configuration
interface NavItemConfig {
	label: string;
	icon: React.ElementType;
	path?: string;
	children?: NavItemConfig[];
	adminOnly?: boolean;
	requiredTab?: string;
	strict?: boolean;
}

const NAV_GROUPS: { label?: string; items: NavItemConfig[] }[] = [
	{
		items: [
			{
				label: "Overview",
				icon: LayoutDashboard,
				path: "/dashboard",
				strict: true,
			},
			{
				label: "My Instances",
				icon: Server,
				path: "/dashboard/instances",
			},
			{
				label: "Billing & Usage",
				icon: CreditCard,
				path: "/settings",
				requiredTab: "billing",
			},
		],
	},
	{
		label: "Admin Console",
		items: [
			{
				label: "Administration",
				icon: Shield,
				adminOnly: true,
				children: [
					{
						label: "User Management",
						icon: Users,
						path: "/admin/users",
					},
					{
						label: "Containers",
						icon: Boxes,
						path: "/admin/services",
					},
					{
						label: "Maintenance",
						icon: Wrench,
						path: "/admin/maintenance",
					},
				],
			},
		],
	},
	{
		label: "Configuration",
		items: [
			{
				label: "Settings",
				icon: Settings,
				path: "/settings",
				requiredTab: "general",
			},
			{
				label: "API Reference",
				icon: FileText,
				path: "/api-reference",
			},
			{
				label: "Support",
				icon: LifeBuoy,
				path: "/contact",
			},
		],
	},
];

export const DashboardLayout: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const { user, logout } = useAuth();

	// Global State
	const [instances, setInstances] = useState<Instance[]>([]);
	const [currentPlan, setCurrentPlan] = useState<string>("Starter");
	const [subscription, setSubscription] = useState<SubscriptionCurrent | null>(
		null
	);
	const [isCreateModalOpen, setCreateModalOpen] = useState(false);
	const [isProfileOpen, setIsProfileOpen] = useState(false);
	const [isNotifOpen, setIsNotifOpen] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [loading, setLoading] = useState(true);

	// Sidebar State
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
		const stored = localStorage.getItem("sidebar_collapsed");
		return stored === "true";
	});
	const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
		Administration: true,
	});

	// Announcement State
	const [announcements, setAnnouncements] = useState<Announcement[]>([]);
	const [showAnnouncements, setShowAnnouncements] = useState(false);
	const [hasUnreadAnnouncements, setHasUnreadAnnouncements] = useState(false);

	useEffect(() => {
		const fetchAnnouncements = async () => {
			try {
				const data = await announcementService.getActiveAnnouncements();
				setAnnouncements(data);
				// Check for unread logic or just presence for now
				if (data.length > 0) {
					setHasUnreadAnnouncements(true);
				}
			} catch (error) {
				console.error("Failed to fetch announcements", error);
			}
		};
		fetchAnnouncements();
	}, []);

	const toggleSidebar = () => {
		const newState = !isSidebarCollapsed;
		setIsSidebarCollapsed(newState);
		localStorage.setItem("sidebar_collapsed", String(newState));
	};

	const toggleMenu = (label: string) => {
		if (isSidebarCollapsed) {
			setIsSidebarCollapsed(false);
			setExpandedMenus((prev) => ({ ...prev, [label]: true }));
		} else {
			setExpandedMenus((prev) => ({ ...prev, [label]: !prev[label] }));
		}
	};

	// Quota calculations
	const quotaUsed = instances.length;
	const quotaAllowed = subscription?.limits?.instances ?? 1;
	const canCreateInstance = quotaAllowed === -1 || quotaUsed < quotaAllowed;

	// Fetch instances and subscription
	const refreshInstances = useCallback(async (force: boolean = false) => {
		try {
			if (force) setLoading(true);
			let profile = force ? null : getCachedProfile();
			if (!profile || !profile.tenants) {
				profile = await refreshProfile([
					"tenants",
					"subscriptions",
					"cluster",
					"audit",
				]);
			}
			if (profile) {
				if (profile.tenants) {
					const convertedInstances = profile.tenants.map(tenantToInstance);
					setInstances(() => convertedInstances);
				}
				if (profile.subscriptions?.current) {
					setSubscription(profile.subscriptions.current);
					setCurrentPlan(profile.subscriptions.current.planName);
				}
			}
		} catch (error) {
			console.error("Failed to fetch instances:", error);
		} finally {
			if (force) setLoading(false);
		}
	}, []);

	useEffect(() => {
		const timer = setTimeout(() => {
			refreshInstances();
		}, 2000);
		return () => clearTimeout(timer);
	}, []);

	// Actions
	const addInstance = (instance: Instance) => {
		setInstances([instance, ...instances]);
		refreshInstances();
	};

	const updateInstanceStatus = (id: string, status: Instance["status"]) => {
		setInstances(instances.map((i) => (i.id === id ? { ...i, status } : i)));
	};

	const deleteInstance = (id: string) => {
		setInstances(instances.filter((i) => i.id !== id));
		refreshInstances();
	};

	const handleLogout = () => {
		logout();
		navigate("/login");
	};

	// Close dropdowns
	useEffect(() => {
		const closeDropdowns = () => {
			setIsProfileOpen(false);
			setIsNotifOpen(false);
		};
		document.addEventListener("click", closeDropdowns);
		return () => document.removeEventListener("click", closeDropdowns);
	}, []);

	// Styles
	const getLinkClass = (
		path?: string,
		strict: boolean = false,
		requiredTab?: string,
		isChild: boolean = false
	) => {
		if (!path) return "";

		const baseClass = `group flex items-center ${isChild ? "pl-11 pr-3" : "px-3"
			} py-2 text-sm font-medium rounded-lg transition-all duration-200 mb-0.5`;
		const activeClass = "bg-indigo-50 text-indigo-700 font-semibold";
		const inactiveClass =
			"text-slate-600 hover:bg-slate-50 hover:text-slate-900";

		const isPathMatch = strict
			? location.pathname === path
			: location.pathname.startsWith(path);

		let isActive = false;
		if (isPathMatch) {
			if (requiredTab) {
				const searchParams = new URLSearchParams(location.search);
				const currentTab = searchParams.get("tab");
				if (currentTab === requiredTab) isActive = true;
				else if (requiredTab === "general" && !currentTab) isActive = true;
			} else {
				isActive = true;
			}
		}

		return `${baseClass} ${isActive ? activeClass : inactiveClass}`;
	};

	const getPageTitle = () => {
		if (location.pathname.startsWith("/dashboard/instances"))
			return "My Instances";
		if (location.pathname === "/dashboard") return "Overview";
		if (location.pathname.startsWith("/admin")) return "Admin Console";
		if (location.pathname === "/settings") {
			const tab = new URLSearchParams(location.search).get("tab");
			return tab === "billing" ? "Billing & Usage" : "Settings";
		}
		if (location.pathname === "/profile") return "Profile";
		return "Dashboard";
	};

	const getPlanBadgeColor = (plan: string) => {
		switch (plan.toLowerCase()) {
			case "enterprise":
				return "bg-purple-100 text-purple-700 border-purple-200";
			case "business":
				return "bg-indigo-100 text-indigo-700 border-indigo-200";
			case "pro":
				return "bg-blue-100 text-blue-700 border-blue-200";
			case "starter":
				return "bg-slate-100 text-slate-700 border-slate-200";
			default:
				return "bg-emerald-100 text-emerald-700 border-emerald-200";
		}
	};

	// Render Nav Item
	const renderNavItem = (item: NavItemConfig, isChild: boolean = false) => {
		if (item.adminOnly && !user?.roles?.includes("admin")) return null;

		const hasChildren = item.children && item.children.length > 0;
		const isExpanded = expandedMenus[item.label];

		// Check if any child is active to auto-expand (optional, but nice)
		const isChildActive =
			hasChildren &&
			item.children?.some((child) => {
				const path = child.path;
				return path && location.pathname.startsWith(path);
			});

		// Parent with children (e.g. Admin Console header)
		if (hasChildren) {
			return (
				<div key={item.label} className='mb-1'>
					<button
						onClick={() => toggleMenu(item.label)}
						className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${isChildActive || isExpanded
							? "text-indigo-700 bg-indigo-50/50"
							: "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
							}`}
						title={isSidebarCollapsed ? item.label : undefined}>
						<div className='flex items-center'>
							<item.icon
								className={`h-5 w-5 flex-shrink-0 transition-colors ${isChildActive || isExpanded
									? "text-indigo-600"
									: "text-slate-400 group-hover:text-slate-500"
									}`}
							/>
							{!isSidebarCollapsed && (
								<span className='ml-3 truncate max-w-[140px]'>
									{item.label}
								</span>
							)}
						</div>
						{!isSidebarCollapsed && (
							<ChevronDown
								className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "transform rotate-180" : ""
									}`}
							/>
						)}
					</button>

					{/* Sub-menu items */}
					<div
						className={`overflow-hidden transition-all duration-300 ${isExpanded && !isSidebarCollapsed
							? "max-h-96 opacity-100 mt-1"
							: "max-h-0 opacity-0"
							}`}>
						{item.children?.map((child) => renderNavItem(child, true))}
					</div>
				</div>
			);
		}

		// Regular Link Item
		return (
			<Link
				key={item.label}
				to={`${item.path || "#"}${item.requiredTab ? `?tab=${item.requiredTab}` : ""
					}`}
				className={getLinkClass(
					item.path,
					item.strict,
					item.requiredTab,
					isChild
				)}
				onClick={() => setMobileMenuOpen(false)}
				title={isSidebarCollapsed ? item.label : undefined}>
				<item.icon
					className={`h-5 w-5 flex-shrink-0 ${isChild ? "h-4 w-4" : ""}`}
				/>
				{!isSidebarCollapsed && (
					<span className='ml-3 truncate max-w-[140px]'>{item.label}</span>
				)}
			</Link>
		);
	};

	return (
		<DashboardContext.Provider
			value={{
				instances,
				addInstance,
				updateInstanceStatus,
				deleteInstance,
				isCreateModalOpen,
				setCreateModalOpen,
				user: user || { name: "Guest", email: "guest@wpcube.io" },
				refreshInstances,
				subscription,
				quotaUsed,
				quotaAllowed,
				canCreateInstance,
				isSidebarCollapsed,
			}}>
			<div className='min-h-screen bg-slate-50 flex font-sans text-slate-900'>
				<CreateInstanceWizard
					isOpen={isCreateModalOpen}
					onClose={() => setCreateModalOpen(false)}
				/>

				{/* --- Sidebar --- */}
				<div
					className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-slate-200 transform transition-all duration-300 ease-in-out ${mobileMenuOpen
						? "translate-x-0"
						: "-translate-x-full md:translate-x-0"
						} ${isSidebarCollapsed ? "w-20" : "w-64"}`}>
					<div className='flex flex-col h-full'>
						{/* Logo */}
						<div
							className={`flex items-center h-16 flex-shrink-0 border-b border-slate-100 ${isSidebarCollapsed ? "justify-center px-0" : "px-6"
								}`}>
							<Link
								to='/'
								className='flex items-center gap-3 group overflow-hidden'>
								<div className='w-8 h-8 flex-shrink-0 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm group-hover:bg-indigo-700 transition-colors'>
									<Box className='w-5 h-5' />
								</div>
								<span
									className={`text-lg font-bold text-slate-900 tracking-tight whitespace-nowrap transition-opacity duration-300 ${isSidebarCollapsed ? "opacity-0 w-0" : "opacity-100"
										}`}>
									WPCube
								</span>
							</Link>
						</div>

						{/* Collapse Toggle - Moved Below Logo */}
						<div
							className={`hidden md:flex items-center shrink-0 py-2 border-b border-slate-100 transition-all ${isSidebarCollapsed ? "justify-center" : "justify-end px-4"
								}`}>
							<button
								onClick={toggleSidebar}
								className='p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors'
								title={
									isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"
								}>
								{isSidebarCollapsed ? (
									<PanelLeftOpen className='w-5 h-5' />
								) : (
									<PanelLeftClose className='w-5 h-5' />
								)}
							</button>
						</div>

						{/* Nav Items */}
						<div className='flex-1 flex flex-col overflow-y-auto overflow-x-hidden pt-6 px-3 space-y-6'>
							{/* New Instance Button */}
							<div className='mb-2'>
								<button
									onClick={() => setCreateModalOpen(true)}
									className={`w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-2.5 rounded-lg transition-all shadow-sm ${isSidebarCollapsed ? "px-0" : "px-4"
										}`}
									title='Create New Instance'>
									<Plus className='w-5 h-5' />
									{!isSidebarCollapsed && <span>New Instance</span>}
								</button>
							</div>

							{NAV_GROUPS.map((group, idx) => {
								// Hide empty groups (e.g. Admin if not admin)
								const hasVisibleItems = group.items.some(
									(item) => !item.adminOnly || user?.roles?.includes("admin")
								);
								if (!hasVisibleItems) return null;

								return (
									<div key={idx} className='space-y-1'>
										{group.label && !isSidebarCollapsed && (
											<p className='px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-2'>
												{group.label}
											</p>
										)}
										{isSidebarCollapsed && group.label && (
											<div className='h-4'></div>
										)}
										{group.items.map((item) => renderNavItem(item))}
									</div>
								);
							})}
						</div>

						{/* User Footer */}
						<div className='flex-shrink-0 border-t border-slate-200 p-3'>
							<div
								className={`flex items-center rounded-lg hover:bg-slate-50 cursor-pointer transition-colors ${isSidebarCollapsed ? "justify-center p-2" : "p-2"
									}`}
								onClick={(e) => {
									e.stopPropagation();
									setIsProfileOpen(!isProfileOpen);
								}}>
								<div className='relative flex-shrink-0'>
									<div className='h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs border border-indigo-200 uppercase'>
										{user?.name ? user.name.substring(0, 2) : "GU"}
									</div>
									<div className='absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white'></div>
								</div>

								{!isSidebarCollapsed && (
									<div className='ml-3 min-w-0 flex-1 overflow-hidden'>
										<div className='flex items-center gap-2'>
											<p className='text-sm font-bold text-slate-900 truncate'>
												{user?.name || "Guest"}
											</p>
										</div>
										<p className='text-xs text-slate-500 truncate'>
											{user?.email || "guest@example.com"}
										</p>
									</div>
								)}
								{!isSidebarCollapsed && (
									<ChevronRight className='w-4 h-4 text-slate-400' />
								)}
							</div>
						</div>
					</div>
				</div>

				{/* --- Main Content --- */}
				<div
					className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? "md:pl-20" : "md:pl-64"
						}`}>
					{/* Topbar */}
					<header className='sticky top-0 z-30 flex-shrink-0 flex h-16 bg-white border-b border-slate-200 shadow-sm'>
						<div className='flex-1 px-4 sm:px-6 lg:px-8 flex justify-between items-center'>
							{/* Left: Mobile Menu & Title */}
							<div className='flex items-center gap-4'>
								<button
									onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
									className='md:hidden p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100'>
									<Menu className='w-6 h-6' />
								</button>

								<nav className='flex items-center text-sm font-medium'>
									<span className='text-xl font-bold text-slate-900'>
										{getPageTitle()}
									</span>
								</nav>
							</div>

							{/* Right: Actions */}
							<div className='flex items-center gap-4'>
								<div className='hidden md:block'>
									<span
										className={`px-2 py-1 text-xs font-bold rounded uppercase border ${getPlanBadgeColor(
											currentPlan
										)}`}>
										{currentPlan} Plan
									</span>
								</div>
								{/* Announcements */}
								<div className='relative'>
									<button
										onClick={() => setShowAnnouncements(!showAnnouncements)}
										className='relative p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors'>
										<Megaphone className='w-5 h-5' />
										{hasUnreadAnnouncements && (
											<span className='absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white'></span>
										)}
									</button>

									{/* Announcement Popup */}
									{showAnnouncements && (
										<div className='absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-200'>
											<div className='px-4 py-2 border-b border-slate-100 flex justify-between items-center'>
												<h3 className='font-bold text-slate-900'>
													Announcements
												</h3>
												<button
													onClick={() => setShowAnnouncements(false)}
													className='text-slate-400 hover:text-slate-600'>
													<X className='w-4 h-4' />
												</button>
											</div>
											<div className='max-h-96 overflow-y-auto'>
												{announcements.length === 0 ? (
													<div className='p-8 text-center text-slate-500'>
														<p className='text-sm'>No new announcements</p>
													</div>
												) : (
													<div className='divide-y divide-slate-100'>
														{announcements.map((announcement) => (
															<div
																key={announcement.id}
																className='p-4 hover:bg-slate-50 transition-colors'>
																<div className='flex items-start gap-3'>
																	<div
																		className={`mt-1 p-1.5 rounded-full flex-shrink-0 ${announcement.type === "warning"
																			? "bg-yellow-100 text-yellow-600"
																			: announcement.type === "maintenance"
																				? "bg-orange-100 text-orange-600"
																				: "bg-blue-100 text-blue-600"
																			}`}>
																		<Megaphone className='w-3 h-3' />
																	</div>
																	<div>
																		<h4 className='text-sm font-bold text-slate-900'>
																			{announcement.title}
																		</h4>
																		<p className='text-xs text-slate-500 mt-1'>
																			{announcement.message}
																		</p>
																		<span className='text-[10px] text-slate-400 mt-2 block'>
																			{new Date(
																				announcement.createdAt
																			).toLocaleDateString()}
																		</span>
																	</div>
																</div>
															</div>
														))}
													</div>
												)}
											</div>
										</div>
									)}
								</div>
								{/* Notifications */}{" "}
								<div className='relative'>
									<button
										onClick={(e) => {
											e.stopPropagation();
											setIsNotifOpen(!isNotifOpen);
											setIsProfileOpen(false);
										}}
										className='p-2 text-slate-400 hover:text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors relative'>
										<Bell className='w-5 h-5' />
										<span className='absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white' />
									</button>
									{/* Notification Dropdown (Simplified for brevity) */}
									{isNotifOpen && (
										<div className='absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2'>
											<div className='p-4 text-center text-sm text-slate-500'>
												No new notifications
											</div>
										</div>
									)}
								</div>
								{/* Profile Dropdown */}
								<div className='relative ml-2'>
									<button
										onClick={(e) => {
											e.stopPropagation();
											setIsProfileOpen(!isProfileOpen);
											setIsNotifOpen(false);
										}}
										className='flex items-center max-w-xs rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'>
										<div className='h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs border border-indigo-200 uppercase'>
											{user?.name ? user.name.substring(0, 2) : "ME"}
										</div>
									</button>

									{isProfileOpen && (
										<div className='absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50 animate-in fade-in slide-in-from-top-2'>
											<div className='px-4 py-3 border-b border-slate-100'>
												<p className='text-sm font-bold text-slate-900 truncate'>
													{user?.name}
												</p>
												<p className='text-xs text-slate-500 truncate'>
													{user?.email}
												</p>
											</div>
											<Link
												to='/profile'
												className='flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600'
												onClick={() => setIsProfileOpen(false)}>
												<User className='w-4 h-4' /> Your Profile
											</Link>
											<Link
												to='/settings?tab=general'
												className='flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600'
												onClick={() => setIsProfileOpen(false)}>
												<Settings className='w-4 h-4' /> Settings
											</Link>
											<div className='border-t border-slate-100 my-1'></div>
											<button
												onClick={handleLogout}
												className='w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50'>
												<LogOut className='w-4 h-4' /> Sign out
											</button>
										</div>
									)}
								</div>
							</div>
						</div>
					</header>

					{/* Page Content */}
					<main className='flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 overflow-x-hidden'>
						<Outlet />
					</main>
				</div>
			</div>
		</DashboardContext.Provider>
	);
};
