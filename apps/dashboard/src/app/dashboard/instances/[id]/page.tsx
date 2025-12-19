'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
    ArrowLeft,
    Server,
    Play,
    Square,
    RotateCw,
    Trash2,
    ExternalLink,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Globe,
    Database,
    HardDrive,
    Clock,
    Activity
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
    dbName?: string;
    storagePath?: string;
}

export default function InstanceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [instance, setInstance] = useState<Instance | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const instanceId = params.id as string;

    const fetchInstance = async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            router.push('/login');
            return;
        }

        try {
            const res = await fetch(`/api/v1/tenants/${instanceId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                if (res.status === 404) {
                    toast({
                        variant: 'destructive',
                        title: 'Not Found',
                        description: 'Instance not found',
                    });
                    router.push('/dashboard/instances');
                    return;
                }
                throw new Error('Failed to fetch instance');
            }

            const data = await res.json();
            setInstance(data);
        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load instance details',
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (instanceId) {
            fetchInstance();
        }
    }, [instanceId]);

    const handleAction = async (action: 'start' | 'stop' | 'restart' | 'delete') => {
        setActionLoading(action);
        const token = localStorage.getItem('accessToken');

        try {
            const method = action === 'delete' ? 'DELETE' : 'POST';
            const url = action === 'delete'
                ? `/api/v1/tenants/${instanceId}`
                : `/api/v1/tenants/${instanceId}/${action}`;

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

            if (action === 'delete') {
                router.push('/dashboard/instances');
            } else {
                fetchInstance();
            }
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!instance) {
        return (
            <div className="text-center py-16">
                <p className="text-muted-foreground">Instance not found</p>
                <Link href="/dashboard/instances">
                    <Button variant="outline" className="mt-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Instances
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/instances">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">{instance.name}</h1>
                        <p className="text-muted-foreground">
                            {instance.subdomain}.{process.env.NEXT_PUBLIC_DOMAIN || 'localhost'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" asChild>
                        <a href={instance.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Visit Site
                        </a>
                    </Button>
                </div>
            </div>

            {/* Status Card */}
            <Card className="glass gradient-border">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Status & Actions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                'w-16 h-16 rounded-xl flex items-center justify-center',
                                instance.status === 'running'
                                    ? 'bg-green-500/20'
                                    : 'bg-yellow-500/20'
                            )}>
                                <Server className={cn(
                                    'w-8 h-8',
                                    instance.status === 'running'
                                        ? 'text-green-400'
                                        : 'text-yellow-400'
                                )} />
                            </div>
                            <div>
                                <span className={cn(
                                    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm mb-2',
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
                                <p className="text-sm text-muted-foreground">
                                    {instance.runningReplicas}/{instance.replicas} replicas running
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            {instance.status === 'running' ? (
                                <Button
                                    variant="outline"
                                    onClick={() => handleAction('stop')}
                                    disabled={actionLoading !== null}
                                >
                                    {actionLoading === 'stop' ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Square className="w-4 h-4 mr-2" />
                                    )}
                                    Stop
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    onClick={() => handleAction('start')}
                                    disabled={actionLoading !== null}
                                >
                                    {actionLoading === 'start' ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Play className="w-4 h-4 mr-2" />
                                    )}
                                    Start
                                </Button>
                            )}

                            <Button
                                variant="outline"
                                onClick={() => handleAction('restart')}
                                disabled={actionLoading !== null}
                            >
                                {actionLoading === 'restart' ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <RotateCw className="w-4 h-4 mr-2" />
                                )}
                                Restart
                            </Button>

                            <Button
                                variant="destructive"
                                onClick={() => handleAction('delete')}
                                disabled={actionLoading !== null}
                            >
                                {actionLoading === 'delete' ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4 mr-2" />
                                )}
                                Delete
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Details Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="glass gradient-border">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Globe className="w-5 h-5 text-primary" />
                            <span className="text-sm text-muted-foreground">Domain</span>
                        </div>
                        <p className="font-medium">
                            {instance.subdomain}.{process.env.NEXT_PUBLIC_DOMAIN || 'localhost'}
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass gradient-border">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Database className="w-5 h-5 text-primary" />
                            <span className="text-sm text-muted-foreground">Database</span>
                        </div>
                        <p className="font-medium font-mono text-sm">
                            {instance.dbName || `wp_${instance.id}`}
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass gradient-border">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-2">
                            <HardDrive className="w-5 h-5 text-primary" />
                            <span className="text-sm text-muted-foreground">Storage</span>
                        </div>
                        <p className="font-medium font-mono text-sm truncate">
                            {instance.storagePath || `/tenants/${instance.id}`}
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass gradient-border">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Server className="w-5 h-5 text-primary" />
                            <span className="text-sm text-muted-foreground">Replicas</span>
                        </div>
                        <p className="font-medium">
                            {instance.runningReplicas} / {instance.replicas}
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass gradient-border">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Clock className="w-5 h-5 text-primary" />
                            <span className="text-sm text-muted-foreground">Created</span>
                        </div>
                        <p className="font-medium">
                            {instance.createdAt
                                ? new Date(instance.createdAt).toLocaleDateString()
                                : 'N/A'}
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass gradient-border">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Activity className="w-5 h-5 text-primary" />
                            <span className="text-sm text-muted-foreground">Instance ID</span>
                        </div>
                        <p className="font-medium font-mono text-sm">
                            {instance.id}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
