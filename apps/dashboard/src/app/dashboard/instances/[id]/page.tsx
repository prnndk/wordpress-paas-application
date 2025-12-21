'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
    Activity,
    AlertTriangle,
    Cpu,
    MemoryStick,
    Network,
    RefreshCw,
    Terminal
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

interface ContainerMetrics {
    containerId: string;
    containerName: string;
    status: string;
    stats: {
        cpuPercent: number;
        memoryUsage: number;
        memoryLimit: number;
        memoryPercent: number;
        networkRx: number;
        networkTx: number;
    } | null;
    timestamp: string;
}

export default function InstanceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [instance, setInstance] = useState<Instance | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [metrics, setMetrics] = useState<ContainerMetrics[]>([]);
    const [metricsLoading, setMetricsLoading] = useState(false);
    const [logs, setLogs] = useState<string>('');
    const [logsLoading, setLogsLoading] = useState(false);
    const [showLogs, setShowLogs] = useState(false);
    const [containerInspect, setContainerInspect] = useState<{
        id: string;
        name: string;
        image: string;
        replicas: number;
        runningReplicas: number;
        createdAt: string;
        updatedAt: string;
        env: { key: string; value: string; masked?: boolean }[];
        mounts: { source: string; target: string; type: string }[];
        networks: string[];
        labels: Record<string, string>;
        resources: {
            cpuLimit?: number;
            memoryLimit?: number;
            cpuReservation?: number;
            memoryReservation?: number;
        };
        tasks: {
            id: string;
            nodeId: string;
            state: string;
            desiredState: string;
            error?: string;
            containerStatus?: {
                containerId?: string;
                pid?: number;
                exitCode?: number;
            };
        }[];
    } | null>(null);
    const [inspectLoading, setInspectLoading] = useState(false);
    const [showInspect, setShowInspect] = useState(false);

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

    const fetchMetrics = async () => {
        if (!instance?.id) return;

        setMetricsLoading(true);
        const token = localStorage.getItem('accessToken');

        try {
            const res = await fetch(`/api/v1/monitoring/${instance.id}/metrics`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setMetrics(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch metrics:', error);
        } finally {
            setMetricsLoading(false);
        }
    };

    useEffect(() => {
        if (instanceId) {
            fetchInstance();
        }
    }, [instanceId]);

    // Auto-refresh metrics every 10 seconds
    useEffect(() => {
        if (instance?.id && instance?.status === 'running') {
            fetchMetrics();
            const interval = setInterval(fetchMetrics, 10000);
            return () => clearInterval(interval);
        }
        return undefined;
    }, [instance?.id, instance?.status]);

    const fetchLogs = async () => {
        if (!instanceId) return;
        setLogsLoading(true);
        const token = localStorage.getItem('accessToken');
        try {
            const res = await fetch(`/api/v1/tenants/${instanceId}/logs?tail=100`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs || 'No logs available');
            }
        } catch (error) {
            console.error('Failed to fetch logs:', error);
            setLogs('Failed to fetch logs');
        } finally {
            setLogsLoading(false);
        }
    };

    const handleToggleLogs = () => {
        if (!showLogs) {
            fetchLogs();
        }
        setShowLogs(!showLogs);
    };

    const fetchContainerInspect = async () => {
        if (!instanceId) return;
        setInspectLoading(true);
        const token = localStorage.getItem('accessToken');
        try {
            const res = await fetch(`/api/v1/tenants/${instanceId}/inspect`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setContainerInspect(data);
            }
        } catch (error) {
            console.error('Failed to fetch container inspect:', error);
        } finally {
            setInspectLoading(false);
        }
    };

    const handleToggleInspect = () => {
        if (!showInspect) {
            fetchContainerInspect();
        }
        setShowInspect(!showInspect);
    };

    const formatBytes = (bytes?: number) => {
        if (!bytes) return 'N/A';
        const mb = bytes / (1024 * 1024);
        if (mb >= 1024) {
            return `${(mb / 1024).toFixed(2)} GB`;
        }
        return `${mb.toFixed(0)} MB`;
    };

    const formatNanoCPU = (nanoCpu?: number) => {
        if (!nanoCpu) return 'N/A';
        return `${(nanoCpu / 1e9).toFixed(2)} CPU`;
    };

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
            {/* Delete Confirmation Modal */}
            <Dialog open={deleteModalOpen} onOpenChange={(open) => !actionLoading && setDeleteModalOpen(open)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="w-5 h-5" />
                            Delete Instance
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this WordPress instance? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                                    <Server className="w-5 h-5 text-destructive" />
                                </div>
                                <div>
                                    <h4 className="font-semibold">{instance.name}</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {instance.subdomain}
                                    </p>
                                </div>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                                <p>• All WordPress files and data will be permanently deleted</p>
                                <p>• The database associated with this instance will be removed</p>
                                <p>• This action is irreversible</p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteModalOpen(false)}
                            disabled={actionLoading === 'delete'}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => handleAction('delete')}
                            disabled={actionLoading === 'delete'}
                        >
                            {actionLoading === 'delete' ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Instance
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                            {process.env.NEXT_PUBLIC_SERVER_IP || process.env.NEXT_PUBLIC_DOMAIN || 'localhost'}/{instance.subdomain}
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
                                onClick={() => setDeleteModalOpen(true)}
                                disabled={actionLoading !== null}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
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
                            {process.env.NEXT_PUBLIC_SERVER_IP || process.env.NEXT_PUBLIC_DOMAIN || 'localhost'}/{instance.subdomain}
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

            {/* Container Logs Section */}
            <Card className="glass gradient-border">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Terminal className="w-5 h-5 text-primary" />
                            Container Logs
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleToggleLogs}
                        >
                            {showLogs ? 'Hide Logs' : 'Show Logs'}
                        </Button>
                    </CardTitle>
                </CardHeader>
                {showLogs && (
                    <CardContent>
                        {logsLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin" />
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-end mb-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={fetchLogs}
                                        className="text-sm"
                                    >
                                        <RefreshCw className="w-4 h-4 mr-1" />
                                        Refresh
                                    </Button>
                                </div>
                                <pre className="bg-black/80 text-green-400 p-4 rounded-lg text-xs font-mono overflow-x-auto max-h-96 overflow-y-auto whitespace-pre-wrap">
                                    {logs || 'No logs available'}
                                </pre>
                            </>
                        )}
                    </CardContent>
                )}
            </Card>

            {/* Container Inspect Section */}
            <Card className="glass gradient-border">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Database className="w-5 h-5 text-primary" />
                            Container Details
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleToggleInspect}
                        >
                            {showInspect ? 'Hide Details' : 'Show Details'}
                        </Button>
                    </CardTitle>
                </CardHeader>
                {showInspect && (
                    <CardContent>
                        {inspectLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin" />
                            </div>
                        ) : containerInspect ? (
                            <div className="space-y-6">
                                {/* Environment Variables */}
                                <div>
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <Server className="w-4 h-4" />
                                        Environment Variables
                                    </h4>
                                    <div className="bg-black/80 rounded-lg p-4 max-h-64 overflow-y-auto">
                                        <table className="w-full text-xs font-mono">
                                            <thead>
                                                <tr className="text-muted-foreground border-b border-gray-700">
                                                    <th className="text-left py-2 px-2">Key</th>
                                                    <th className="text-left py-2 px-2">Value</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {containerInspect.env.map((env, idx) => (
                                                    <tr key={idx} className="border-b border-gray-800">
                                                        <td className="py-2 px-2 text-cyan-400">{env.key}</td>
                                                        <td className={cn(
                                                            "py-2 px-2",
                                                            env.masked ? "text-yellow-500 italic" : "text-green-400"
                                                        )}>
                                                            {env.value}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Volume Mounts */}
                                <div>
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <HardDrive className="w-4 h-4" />
                                        Volume Mounts
                                    </h4>
                                    <div className="grid gap-2">
                                        {containerInspect.mounts.map((mount, idx) => (
                                            <div key={idx} className="p-3 rounded-lg bg-card/50 border text-sm">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400">
                                                        {mount.type}
                                                    </span>
                                                </div>
                                                <div className="font-mono text-xs">
                                                    <span className="text-muted-foreground">Source:</span>{' '}
                                                    <span className="text-green-400">{mount.source || 'N/A'}</span>
                                                </div>
                                                <div className="font-mono text-xs">
                                                    <span className="text-muted-foreground">Target:</span>{' '}
                                                    <span className="text-cyan-400">{mount.target}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Resources */}
                                <div>
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <Cpu className="w-4 h-4" />
                                        Resource Limits
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div className="p-3 rounded-lg bg-card/50 border">
                                            <div className="text-xs text-muted-foreground mb-1">CPU Limit</div>
                                            <div className="font-semibold">{formatNanoCPU(containerInspect.resources.cpuLimit)}</div>
                                        </div>
                                        <div className="p-3 rounded-lg bg-card/50 border">
                                            <div className="text-xs text-muted-foreground mb-1">CPU Reserved</div>
                                            <div className="font-semibold">{formatNanoCPU(containerInspect.resources.cpuReservation)}</div>
                                        </div>
                                        <div className="p-3 rounded-lg bg-card/50 border">
                                            <div className="text-xs text-muted-foreground mb-1">Memory Limit</div>
                                            <div className="font-semibold">{formatBytes(containerInspect.resources.memoryLimit)}</div>
                                        </div>
                                        <div className="p-3 rounded-lg bg-card/50 border">
                                            <div className="text-xs text-muted-foreground mb-1">Memory Reserved</div>
                                            <div className="font-semibold">{formatBytes(containerInspect.resources.memoryReservation)}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Networks */}
                                <div>
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <Network className="w-4 h-4" />
                                        Networks
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {containerInspect.networks.map((network, idx) => (
                                            <span key={idx} className="px-3 py-1 rounded-full text-sm bg-purple-500/20 text-purple-400 font-mono">
                                                {network}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Tasks */}
                                <div>
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <Activity className="w-4 h-4" />
                                        Tasks ({containerInspect.tasks.length})
                                    </h4>
                                    <div className="space-y-2">
                                        {containerInspect.tasks.map((task, idx) => (
                                            <div key={idx} className="p-3 rounded-lg bg-card/50 border">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-mono text-xs text-muted-foreground">
                                                        {task.id.substring(0, 12)}...
                                                    </span>
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-full text-xs",
                                                        task.state === 'running' ? 'bg-green-500/20 text-green-400' :
                                                            task.state === 'failed' ? 'bg-red-500/20 text-red-400' :
                                                                'bg-yellow-500/20 text-yellow-400'
                                                    )}>
                                                        {task.state}
                                                    </span>
                                                </div>
                                                <div className="text-xs space-y-1">
                                                    <div>
                                                        <span className="text-muted-foreground">Node:</span>{' '}
                                                        <span className="font-mono">{task.nodeId.substring(0, 12)}...</span>
                                                    </div>
                                                    {task.containerStatus?.containerId && (
                                                        <div>
                                                            <span className="text-muted-foreground">Container:</span>{' '}
                                                            <span className="font-mono">{task.containerStatus.containerId.substring(0, 12)}...</span>
                                                        </div>
                                                    )}
                                                    {task.error && (
                                                        <div className="text-red-400">
                                                            <span className="text-muted-foreground">Error:</span> {task.error}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Image Info */}
                                <div className="p-4 rounded-lg bg-card/50 border">
                                    <div className="text-sm">
                                        <span className="text-muted-foreground">Image:</span>{' '}
                                        <span className="font-mono text-xs">{containerInspect.image}</span>
                                    </div>
                                    <div className="text-sm mt-1">
                                        <span className="text-muted-foreground">Service ID:</span>{' '}
                                        <span className="font-mono text-xs">{containerInspect.id}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground py-4">
                                No container details available
                            </div>
                        )}
                    </CardContent>
                )}
            </Card>

            {/* Resource Monitoring Section */}
            {instance.status === 'running' && (
                <Card className="glass gradient-border">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Activity className="w-5 h-5 text-primary" />
                                Resource Usage
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={fetchMetrics}
                                disabled={metricsLoading}
                            >
                                <RefreshCw className={cn("w-4 h-4", metricsLoading && "animate-spin")} />
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {metrics.length === 0 ? (
                            <div className="text-center text-muted-foreground py-4">
                                {metricsLoading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Loading metrics...
                                    </div>
                                ) : (
                                    'No metrics available'
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {metrics.map((container) => (
                                    <div key={container.containerId} className="space-y-4">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Server className="w-4 h-4" />
                                            <span className="font-mono">{container.containerName}</span>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-xs",
                                                container.status === 'running'
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : 'bg-yellow-500/20 text-yellow-400'
                                            )}>
                                                {container.status}
                                            </span>
                                        </div>

                                        {container.stats && (
                                            <div className="grid md:grid-cols-3 gap-4">
                                                {/* CPU */}
                                                <div className="p-4 rounded-lg bg-card/50 border">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Cpu className="w-4 h-4 text-blue-400" />
                                                        <span className="text-sm text-muted-foreground">CPU</span>
                                                    </div>
                                                    <p className="text-2xl font-bold">{container.stats.cpuPercent.toFixed(1)}%</p>
                                                    <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                                                            style={{ width: `${Math.min(container.stats.cpuPercent, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Memory */}
                                                <div className="p-4 rounded-lg bg-card/50 border">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <MemoryStick className="w-4 h-4 text-purple-400" />
                                                        <span className="text-sm text-muted-foreground">Memory</span>
                                                    </div>
                                                    <p className="text-2xl font-bold">{container.stats.memoryPercent.toFixed(1)}%</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {(container.stats.memoryUsage / 1024 / 1024).toFixed(0)} MB / {(container.stats.memoryLimit / 1024 / 1024).toFixed(0)} MB
                                                    </p>
                                                    <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                                                            style={{ width: `${Math.min(container.stats.memoryPercent, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Network */}
                                                <div className="p-4 rounded-lg bg-card/50 border">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Network className="w-4 h-4 text-green-400" />
                                                        <span className="text-sm text-muted-foreground">Network</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-muted-foreground">↓ RX</span>
                                                            <span className="font-medium">{(container.stats.networkRx / 1024 / 1024).toFixed(2)} MB</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-muted-foreground">↑ TX</span>
                                                            <span className="font-medium">{(container.stats.networkTx / 1024 / 1024).toFixed(2)} MB</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
