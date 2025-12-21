'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Server,
    Search,
    ToggleLeft,
    ToggleRight,
    Loader2,
    Activity,
    Eye,
} from 'lucide-react';

interface Tenant {
    id: string;
    name: string;
    subdomain: string;
    status: string;
    isActive: boolean;
    planId: string;
    replicas: number;
    runningReplicas?: number;
    createdAt: string;
    user: {
        id: string;
        email: string;
        name: string | null;
    };
}

export default function AdminTenantsPage() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [updating, setUpdating] = useState<string | null>(null);

    const fetchTenants = async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        try {
            const res = await fetch('/api/v1/admin/tenants', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setTenants(data);
            }
        } catch (error) {
            console.error('Failed to fetch tenants:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTenants();
    }, []);

    const toggleTenantStatus = async (tenantId: string, isActive: boolean) => {
        setUpdating(tenantId);
        const token = localStorage.getItem('accessToken');

        try {
            const res = await fetch(`/api/v1/admin/tenants/${tenantId}/status`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isActive }),
            });

            if (res.ok) {
                setTenants(tenants.map(t => t.id === tenantId ? { ...t, isActive } : t));
            }
        } catch (error) {
            console.error('Failed to update tenant:', error);
        } finally {
            setUpdating(null);
        }
    };

    const filteredTenants = tenants.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.subdomain.toLowerCase().includes(search.toLowerCase()) ||
        t.user.email.toLowerCase().includes(search.toLowerCase())
    );

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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Tenant Management</h1>
                    <p className="text-muted-foreground">{tenants.length} total tenants</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search tenants by name, subdomain, or owner..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tenant</TableHead>
                                <TableHead>Owner</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Replicas</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTenants.map((tenant) => (
                                <TableRow key={tenant.id} className={!tenant.isActive ? 'opacity-60' : ''}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-primary/10">
                                                <Server className="w-4 h-4 text-primary" />
                                            </div>
                                            <div>
                                                <div className="font-medium">{tenant.name}</div>
                                                <div className="text-sm text-muted-foreground">/{tenant.subdomain}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <div className="text-sm">{tenant.user.email}</div>
                                            <div className="text-xs text-muted-foreground">{tenant.user.name || 'No name'}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                            {tenant.planId}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Activity className={`w-4 h-4 ${tenant.runningReplicas ? 'text-green-500' : 'text-gray-400'}`} />
                                            <span>{tenant.runningReplicas ?? 0}/{tenant.replicas}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(tenant.status, tenant.isActive)}`}>
                                            {tenant.isActive ? tenant.status : 'disabled'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {new Date(tenant.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/dashboard/admin/tenants/${tenant.id}`}>
                                                <Button variant="outline" size="sm">
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    Details
                                                </Button>
                                            </Link>
                                            <Button
                                                variant={tenant.isActive ? 'destructive' : 'default'}
                                                size="sm"
                                                onClick={() => toggleTenantStatus(tenant.id, !tenant.isActive)}
                                                disabled={updating === tenant.id}
                                            >
                                                {updating === tenant.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : tenant.isActive ? (
                                                    <>
                                                        <ToggleRight className="w-4 h-4 mr-1" />
                                                        Disable
                                                    </>
                                                ) : (
                                                    <>
                                                        <ToggleLeft className="w-4 h-4 mr-1" />
                                                        Enable
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
