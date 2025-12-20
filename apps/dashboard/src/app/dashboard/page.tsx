'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Server,
    Plus,
    Activity,
    HardDrive,
    CheckCircle2,
    AlertCircle,
    Loader2
} from 'lucide-react';

interface Instance {
    id: string;
    name: string;
    subdomain: string;
    status: string;
    url: string;
    replicas: number;
    runningReplicas: number;
}

export default function DashboardPage() {
    const [instances, setInstances] = useState<Instance[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        fetch('/api/v1/tenants', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                // Handle both array response and {data: [...]} format
                const instancesArray = Array.isArray(data) ? data : (data?.data || data?.instances || []);
                setInstances(instancesArray);
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, []);

    const runningCount = Array.isArray(instances) ? instances.filter((i) => i.status === 'running').length : 0;
    const totalReplicas = Array.isArray(instances) ? instances.reduce((acc, i) => acc + (i.runningReplicas || 0), 0) : 0;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Manage your WordPress instances
                    </p>
                </div>
                <Link href="/dashboard/instances/new">
                    <Button variant="glow">
                        <Plus className="w-4 h-4 mr-2" />
                        New Instance
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="glass gradient-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Instances
                        </CardTitle>
                        <Server className="w-5 h-5 text-indigo-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{instances.length}</div>
                    </CardContent>
                </Card>
                <Card className="glass gradient-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Running
                        </CardTitle>
                        <Activity className="w-5 h-5 text-green-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-400">{runningCount}</div>
                    </CardContent>
                </Card>
                <Card className="glass gradient-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Active Containers
                        </CardTitle>
                        <HardDrive className="w-5 h-5 text-purple-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{totalReplicas}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Instances */}
            <Card className="glass gradient-border">
                <CardHeader>
                    <CardTitle>Recent Instances</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : instances.length === 0 ? (
                        <div className="text-center py-8">
                            <Server className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">No instances yet</h3>
                            <p className="text-muted-foreground mb-4">
                                Deploy your first WordPress instance to get started
                            </p>
                            <Link href="/dashboard/instances/new">
                                <Button variant="glow">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Instance
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {instances.slice(0, 5).map((instance) => (
                                <Link
                                    key={instance.id}
                                    href={`/dashboard/instances/${instance.id}`}
                                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                                            <Server className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium">{instance.name}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {process.env.NEXT_PUBLIC_SERVER_IP || process.env.NEXT_PUBLIC_DOMAIN || 'localhost'}/{instance.subdomain}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {instance.status === 'running' ? (
                                            <span className="flex items-center gap-1 text-green-400 text-sm">
                                                <CheckCircle2 className="w-4 h-4" />
                                                Running
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-yellow-400 text-sm">
                                                <AlertCircle className="w-4 h-4" />
                                                {instance.status}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
