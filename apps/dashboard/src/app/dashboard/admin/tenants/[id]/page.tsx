'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    Server,
    User,
    Calendar,
    Activity,
    Database,
    Globe,
    Settings,
    Loader2,
    ExternalLink,
    RefreshCw,
    ToggleLeft,
    ToggleRight,
    HardDrive,
    Cpu,
    MemoryStick,
    Plus,
    Minus,
} from 'lucide-react';

interface TenantDetails {
    id: string;
    name: string;
    subdomain: string;
    status: string;
    isActive: boolean;
    planId: string;
    replicas: number;
    dbName: string;
    createdAt: string;
    updatedAt: string;
    user: {
        id: string;
        email: string;
        name: string | null;
        role: string;
        isActive: boolean;
        createdAt: string;
    };
    docker: {
        runningReplicas: number;
        desiredReplicas: number;
        image: string;
        createdAt: string | null;
        updatedAt: string | null;
    };
    recentLogs: string[];
    storageUsage: {
        totalObjects: number;
        totalSize: number;
        totalSizeFormatted: string;
    };
    resourceUsage: {
        cpuPercent: number;
        memoryUsage: number;
        memoryLimit: number;
        memoryPercent: number;
        memoryUsageFormatted: string;
        memoryLimitFormatted: string;
    };
    urls: {
        frontend: string;
        admin: string;
    };
}

export default function AdminTenantDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [tenant, setTenant] = useState<TenantDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);
    const [scaling, setScaling] = useState(false);

    const fetchTenant = async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        try {
            const res = await fetch(`/api/v1/admin/tenants/${params.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setTenant(data);
            }
        } catch (error) {
            console.error('Failed to fetch tenant:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTenant();
    }, [params.id]);

    const toggleStatus = async () => {
        if (!tenant) return;
        setToggling(true);
        const token = localStorage.getItem('accessToken');

        try {
            const res = await fetch(`/api/v1/admin/tenants/${tenant.id}/status`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isActive: !tenant.isActive }),
            });

            if (res.ok) {
                setTenant({ ...tenant, isActive: !tenant.isActive });
            }
        } catch (error) {
            console.error('Failed to toggle status:', error);
        } finally {
            setToggling(false);
        }
    };

    const scaleReplicas = async (newReplicas: number) => {
        if (!tenant || scaling) return;
        if (newReplicas < 0 || newReplicas > 10) return;

        setScaling(true);
        const token = localStorage.getItem('accessToken');

        try {
            const res = await fetch(`/api/v1/tenants/${tenant.id}/scale`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ replicas: newReplicas }),
            });

            if (res.ok) {
                const data = await res.json();
                setTenant({
                    ...tenant,
                    replicas: data.replicas,
                    docker: {
                        ...tenant.docker,
                        desiredReplicas: data.replicas,
                    },
                });
            }
        } catch (error) {
            console.error('Failed to scale replicas:', error);
        } finally {
            setScaling(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    if (!tenant) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold mb-4">Tenant not found</h2>
                <Link href="/dashboard/admin/tenants">
                    <Button variant="outline">Back to Tenants</Button>
                </Link>
            </div>
        );
    }

    const getStatusColor = (status: string, isActive: boolean) => {
        if (!isActive) return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
        switch (status) {
            case 'running':
                return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'creating':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'stopped':
                return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'error':
                return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Server className="w-8 h-8" />
                            {tenant.name}
                        </h1>
                        <p className="text-muted-foreground">/{tenant.subdomain}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={fetchTenant}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    <Button
                        variant={tenant.isActive ? 'destructive' : 'default'}
                        onClick={toggleStatus}
                        disabled={toggling}
                    >
                        {toggling ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : tenant.isActive ? (
                            <>
                                <ToggleRight className="w-4 h-4 mr-2" />
                                Disable
                            </>
                        ) : (
                            <>
                                <ToggleLeft className="w-4 h-4 mr-2" />
                                Enable
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Activity className={`w-8 h-8 ${tenant.docker.runningReplicas > 0 ? 'text-green-500' : 'text-gray-400'}`} />
                            <div>
                                <p className="text-sm text-muted-foreground">Status</p>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(tenant.status, tenant.isActive)}`}>
                                    {tenant.isActive ? tenant.status : 'disabled'}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Server className="w-8 h-8 text-blue-500" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Replicas</p>
                                    <p className="text-xl font-bold">
                                        {tenant.docker.runningReplicas}/{tenant.docker.desiredReplicas}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => scaleReplicas(tenant.docker.desiredReplicas - 1)}
                                    disabled={scaling || tenant.docker.desiredReplicas <= 0}
                                >
                                    {scaling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Minus className="h-4 w-4" />}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => scaleReplicas(tenant.docker.desiredReplicas + 1)}
                                    disabled={scaling || tenant.docker.desiredReplicas >= 10}
                                >
                                    {scaling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Settings className="w-8 h-8 text-purple-500" />
                            <div>
                                <p className="text-sm text-muted-foreground">Plan</p>
                                <p className="text-xl font-bold capitalize">{tenant.planId}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Calendar className="w-8 h-8 text-orange-500" />
                            <div>
                                <p className="text-sm text-muted-foreground">Created</p>
                                <p className="text-sm font-medium">
                                    {new Date(tenant.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tenant Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Server className="w-5 h-5" />
                            Tenant Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">ID</p>
                                <p className="font-mono text-sm">{tenant.id}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Subdomain</p>
                                <p className="font-medium">/{tenant.subdomain}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Database</p>
                                <p className="font-mono text-sm">{tenant.dbName}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Docker Image</p>
                                <p className="font-mono text-xs truncate">{tenant.docker.image}</p>
                            </div>
                        </div>
                        <div className="pt-4 border-t flex gap-2">
                            <a href={tenant.urls.frontend} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm">
                                    <Globe className="w-4 h-4 mr-2" />
                                    Frontend
                                    <ExternalLink className="w-3 h-3 ml-2" />
                                </Button>
                            </a>
                            <a href={tenant.urls.admin} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm">
                                    <Settings className="w-4 h-4 mr-2" />
                                    WP Admin
                                    <ExternalLink className="w-3 h-3 ml-2" />
                                </Button>
                            </a>
                        </div>
                    </CardContent>
                </Card>

                {/* Owner Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Owner Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-medium">
                                {tenant.user.name?.charAt(0) || tenant.user.email.charAt(0)}
                            </div>
                            <div>
                                <p className="font-medium">{tenant.user.name || 'No name'}</p>
                                <p className="text-sm text-muted-foreground">{tenant.user.email}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                            <div>
                                <p className="text-sm text-muted-foreground">Role</p>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${tenant.user.role === 'admin'
                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                    }`}>
                                    {tenant.user.role}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Status</p>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${tenant.user.isActive
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    }`}>
                                    {tenant.user.isActive ? 'Active' : 'Disabled'}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">User ID</p>
                                <p className="font-mono text-xs">{tenant.user.id}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Joined</p>
                                <p className="text-sm">{new Date(tenant.user.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Resource & Storage Usage */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* CPU Usage */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Cpu className="w-5 h-5 text-blue-500" />
                            CPU Usage
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <span className="text-3xl font-bold">{tenant.resourceUsage?.cpuPercent?.toFixed(1) || 0}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                <div
                                    className="bg-blue-500 h-3 rounded-full transition-all"
                                    style={{ width: `${Math.min(tenant.resourceUsage?.cpuPercent || 0, 100)}%` }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Memory Usage */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <MemoryStick className="w-5 h-5 text-purple-500" />
                            Memory Usage
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <span className="text-3xl font-bold">{tenant.resourceUsage?.memoryUsageFormatted || '0 B'}</span>
                                <span className="text-sm text-muted-foreground">/ {tenant.resourceUsage?.memoryLimitFormatted || '0 B'}</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                <div
                                    className="bg-purple-500 h-3 rounded-full transition-all"
                                    style={{ width: `${Math.min(tenant.resourceUsage?.memoryPercent || 0, 100)}%` }}
                                />
                            </div>
                            <p className="text-sm text-muted-foreground text-right">
                                {tenant.resourceUsage?.memoryPercent?.toFixed(1) || 0}% used
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Storage Usage */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <HardDrive className="w-5 h-5 text-green-500" />
                            Storage Usage (MinIO)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <span className="text-3xl font-bold">{tenant.storageUsage?.totalSizeFormatted || '0 B'}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                                <div>
                                    <p className="text-sm text-muted-foreground">Files</p>
                                    <p className="text-lg font-semibold">{tenant.storageUsage?.totalObjects || 0}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Raw Size</p>
                                    <p className="text-lg font-semibold">{((tenant.storageUsage?.totalSize || 0) / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Logs */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="w-5 h-5" />
                        Recent Logs
                    </CardTitle>
                    <CardDescription>Last 50 log lines from the service</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-xs max-h-80 overflow-y-auto">
                        {tenant.recentLogs.length > 0 ? (
                            tenant.recentLogs.map((log, i) => (
                                <div key={i} className="py-0.5 hover:bg-gray-800 px-2 -mx-2">
                                    {log}
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500">No logs available</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
