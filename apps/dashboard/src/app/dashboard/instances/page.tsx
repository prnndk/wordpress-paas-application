'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
    Server,
    Plus,
    Play,
    Square,
    RotateCw,
    Trash2,
    ExternalLink,
    CheckCircle2,
    AlertCircle,
    Loader2,
    MoreVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Instance {
    id: string;
    name: string;
    subdomain: string;
    status: string;
    url: string;
    replicas: number;
    runningReplicas: number;
    createdAt?: string;
}

export default function InstancesPage() {
    const { toast } = useToast();
    const [instances, setInstances] = useState<Instance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchInstances = async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        try {
            const res = await fetch('/api/v1/tenants', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setInstances(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInstances();
    }, []);

    const handleAction = async (
        id: string,
        action: 'start' | 'stop' | 'restart' | 'delete'
    ) => {
        setActionLoading(id);
        const token = localStorage.getItem('accessToken');

        try {
            const method = action === 'delete' ? 'DELETE' : 'POST';
            const url = action === 'delete'
                ? `/api/v1/tenants/${id}`
                : `/api/v1/tenants/${id}/${action}`;

            const res = await fetch(url, {
                method,
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error(`Failed to ${action}`);

            toast({
                variant: 'success',
                title: 'Success',
                description: `Instance ${action}${action.endsWith('e') ? 'd' : 'ed'} successfully`,
            });

            fetchInstances();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: `Failed to ${action} instance`,
            });
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Instances</h1>
                    <p className="text-muted-foreground">
                        Manage your WordPress deployments
                    </p>
                </div>
                <Link href="/dashboard/instances/new">
                    <Button variant="glow">
                        <Plus className="w-4 h-4 mr-2" />
                        New Instance
                    </Button>
                </Link>
            </div>

            {/* Instances List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            ) : instances.length === 0 ? (
                <Card className="glass gradient-border">
                    <CardContent className="py-16 text-center">
                        <Server className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-xl font-medium mb-2">No instances yet</h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                            Deploy your first WordPress instance. Each instance gets its own database, storage, and runs on multiple nodes for high availability.
                        </p>
                        <Link href="/dashboard/instances/new">
                            <Button variant="glow" size="lg">
                                <Plus className="w-5 h-5 mr-2" />
                                Create Your First Instance
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {instances.map((instance) => (
                        <Card key={instance.id} className="glass gradient-border">
                            <CardContent className="p-6">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                    {/* Instance Info */}
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            'w-12 h-12 rounded-xl flex items-center justify-center',
                                            instance.status === 'running'
                                                ? 'bg-green-500/20'
                                                : 'bg-yellow-500/20'
                                        )}>
                                            <Server className={cn(
                                                'w-6 h-6',
                                                instance.status === 'running'
                                                    ? 'text-green-400'
                                                    : 'text-yellow-400'
                                            )} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold">{instance.name}</h3>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <span>{instance.subdomain}.{process.env.NEXT_PUBLIC_DOMAIN || 'localhost'}</span>
                                                <span>•</span>
                                                <span>{instance.runningReplicas}/{instance.replicas} replicas</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    <div className="flex items-center gap-4 flex-wrap">
                                        <span className={cn(
                                            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm',
                                            instance.status === 'running'
                                                ? 'bg-green-500/20 text-green-400'
                                                : instance.status === 'stopped'
                                                    ? 'bg-gray-500/20 text-gray-400'
                                                    : 'bg-yellow-500/20 text-yellow-400'
                                        )}>
                                            {instance.status === 'running' ? (
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                            ) : (
                                                <AlertCircle className="w-3.5 h-3.5" />
                                            )}
                                            {instance.status.charAt(0).toUpperCase() + instance.status.slice(1)}
                                        </span>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                asChild
                                            >
                                                <a href={instance.url} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="w-4 h-4 mr-1" />
                                                    Visit
                                                </a>
                                            </Button>

                                            {instance.status === 'running' ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleAction(instance.id, 'stop')}
                                                    disabled={actionLoading === instance.id}
                                                >
                                                    {actionLoading === instance.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Square className="w-4 h-4" />
                                                    )}
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleAction(instance.id, 'start')}
                                                    disabled={actionLoading === instance.id}
                                                >
                                                    {actionLoading === instance.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Play className="w-4 h-4" />
                                                    )}
                                                </Button>
                                            )}

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleAction(instance.id, 'restart')}
                                                disabled={actionLoading === instance.id}
                                            >
                                                <RotateCw className="w-4 h-4" />
                                            </Button>

                                            <Link href={`/dashboard/instances/${instance.id}`}>
                                                <Button variant="outline" size="sm">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </Link>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                                onClick={() => handleAction(instance.id, 'delete')}
                                                disabled={actionLoading === instance.id}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
