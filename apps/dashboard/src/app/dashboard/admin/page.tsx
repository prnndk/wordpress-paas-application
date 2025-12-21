'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Users,
    Server,
    Activity,
    Wrench,
    Shield,
    ChevronRight,
} from 'lucide-react';

interface AdminStats {
    totalUsers: number;
    totalTenants: number;
    runningTenants: number;
    activeAnnouncements: number;
}

export default function AdminPage() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                setError('Not authenticated');
                setLoading(false);
                return;
            }

            try {
                const res = await fetch('/api/v1/admin/stats', {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.status === 403) {
                    setError('Admin access required');
                    setLoading(false);
                    return;
                }

                if (!res.ok) throw new Error('Failed to fetch stats');

                const data = await res.json();
                setStats(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Shield className="w-16 h-16 text-red-500" />
                <h2 className="text-2xl font-bold text-red-500">{error}</h2>
                <p className="text-muted-foreground">You need admin privileges to access this page.</p>
                <Link href="/dashboard">
                    <Button variant="outline">Back to Dashboard</Button>
                </Link>
            </div>
        );
    }

    const statCards = [
        { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-500', href: '/dashboard/admin/users' },
        { label: 'Total Tenants', value: stats?.totalTenants || 0, icon: Server, color: 'text-green-500', href: '/dashboard/admin/tenants' },
        { label: 'Running Instances', value: stats?.runningTenants || 0, icon: Activity, color: 'text-purple-500', href: '/dashboard/admin/tenants' },
        { label: 'Active Announcements', value: stats?.activeAnnouncements || 0, icon: Wrench, color: 'text-orange-500', href: '/dashboard/admin/maintenance' },
    ];

    const adminLinks = [
        { label: 'User Management', description: 'View, enable/disable users', icon: Users, href: '/dashboard/admin/users' },
        { label: 'Tenant Management', description: 'View tenants, manage status', icon: Server, href: '/dashboard/admin/tenants' },
        { label: 'Maintenance', description: 'Rolling updates, announcements', icon: Wrench, href: '/dashboard/admin/maintenance' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground">Manage users, tenants, and system maintenance</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat) => (
                    <Link key={stat.label} href={stat.href}>
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {stat.label}
                                </CardTitle>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{stat.value}</div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {adminLinks.map((link) => (
                    <Link key={link.label} href={link.href}>
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                            <CardContent className="p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-lg bg-primary/10">
                                        <link.icon className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{link.label}</h3>
                                        <p className="text-sm text-muted-foreground">{link.description}</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
