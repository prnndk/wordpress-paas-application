'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
    Rocket,
    LayoutDashboard,
    Server,
    Settings,
    LogOut,
    Menu,
    X,
    Shield,
    Users,
    Wrench
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AnnouncementBanner } from '@/components/announcement-banner';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

interface UserInfo {
    email: string;
    name: string | null;
    role?: string;
}

const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { href: '/dashboard/instances', icon: Server, label: 'Instances' },
    { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

const adminNavItems = [
    { href: '/dashboard/admin', icon: Shield, label: 'Admin Overview' },
    { href: '/dashboard/admin/users', icon: Users, label: 'Users' },
    { href: '/dashboard/admin/tenants', icon: Server, label: 'All Tenants' },
    { href: '/dashboard/admin/maintenance', icon: Wrench, label: 'Maintenance' },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [user, setUser] = useState<UserInfo | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            router.push('/login');
            return;
        }

        // Fetch user info
        fetch('/api/v1/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => {
                if (!res.ok) throw new Error('Unauthorized');
                return res.json();
            })
            .then((userData) => {
                setUser(userData);
                // Check if user is admin
                if (userData.role === 'admin') {
                    setIsAdmin(true);
                }
            })
            .catch(() => {
                localStorage.removeItem('accessToken');
                router.push('/login');
            });

        // Also check admin access by trying to hit admin endpoint
        fetch('/api/v1/admin/stats', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => {
                if (res.ok) setIsAdmin(true);
            })
            .catch(() => { });
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        router.push('/login');
    };

    return (
        <div className="min-h-screen flex">
            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0',
                    isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="p-6 border-b border-border">
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                <Rocket className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold">WP PaaS</span>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                                    pathname === item.href
                                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                                )}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </Link>
                        ))}

                        {/* Admin Section */}
                        {isAdmin && (
                            <>
                                <div className="pt-4 pb-2">
                                    <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Admin
                                    </p>
                                </div>
                                {adminNavItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                                            pathname === item.href || (item.href !== '/dashboard/admin' && pathname.startsWith(item.href))
                                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                                        )}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        {item.label}
                                    </Link>
                                ))}
                            </>
                        )}
                    </nav>

                    {/* User Section */}
                    <div className="p-4 border-t border-border">
                        <div className="flex items-center gap-3 px-4 py-2 mb-2">
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium",
                                isAdmin ? "bg-gradient-to-br from-purple-500 to-pink-600" : "bg-gradient-to-br from-indigo-500 to-purple-600"
                            )}>
                                {user?.name?.charAt(0) || user?.email?.charAt(0) || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {isAdmin && <span className="text-purple-500 font-medium">Admin • </span>}
                                    {user?.email}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-muted-foreground hover:text-destructive"
                            onClick={handleLogout}
                        >
                            <LogOut className="w-5 h-5 mr-3" />
                            Sign Out
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Mobile Header */}
                <header className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </Button>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <Rocket className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold">WP PaaS</span>
                    </div>
                    <div className="w-10" /> {/* Spacer */}
                </header>

                <main className="flex-1 p-6 lg:p-8 overflow-auto">
                    {/* Announcement Banner */}
                    <div className="mb-6">
                        <AnnouncementBanner />
                    </div>
                    {children}
                </main>
            </div>
        </div>
    );
}
