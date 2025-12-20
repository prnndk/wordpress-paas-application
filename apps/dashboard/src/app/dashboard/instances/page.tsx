'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
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
    MoreVertical,
    AlertTriangle
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
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [instanceToDelete, setInstanceToDelete] = useState<Instance | null>(null);

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

            if (action === 'delete') {
                setDeleteModalOpen(false);
                setInstanceToDelete(null);
            }

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

    const openDeleteModal = (instance: Instance) => {
        setInstanceToDelete(instance);
        setDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        if (actionLoading) return;
        setDeleteModalOpen(false);
        setInstanceToDelete(null);
    };

    return (
        <div className="space-y-8">
            {/* Delete Confirmation Modal */}
            <Dialog open={deleteModalOpen} onOpenChange={closeDeleteModal}>
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

                    {instanceToDelete && (
                        <div className="py-4">
                            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                                        <Server className="w-5 h-5 text-destructive" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">{instanceToDelete.name}</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {instanceToDelete.subdomain}
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
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={closeDeleteModal}
                            disabled={actionLoading === instanceToDelete?.id}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => instanceToDelete && handleAction(instanceToDelete.id, 'delete')}
                            disabled={actionLoading === instanceToDelete?.id}
                        >
                            {actionLoading === instanceToDelete?.id ? (
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
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                            <Server className="w-8 h-8 text-indigo-400" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No instances yet</h3>
                        <p className="text-muted-foreground mb-6 text-center max-w-sm">
                            Create your first WordPress instance to get started
                        </p>
                        <Link href="/dashboard/instances/new">
                            <Button variant="glow">
                                <Plus className="w-4 h-4 mr-2" />
                                Create Instance
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {instances.map((instance) => (
                        <Card key={instance.id} className="glass gradient-border hover:border-primary/50 transition-colors">
                            <CardContent className="py-4">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                    {/* Instance Info */}
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center",
                                            instance.status === 'running'
                                                ? "bg-gradient-to-br from-green-500/20 to-emerald-500/20"
                                                : "bg-gradient-to-br from-yellow-500/20 to-orange-500/20"
                                        )}>
                                            <Server className={cn(
                                                "w-6 h-6",
                                                instance.status === 'running'
                                                    ? 'text-green-400'
                                                    : 'text-yellow-400'
                                            )} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold">{instance.name}</h3>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <span>{process.env.NEXT_PUBLIC_SERVER_IP || process.env.NEXT_PUBLIC_DOMAIN || 'localhost'}/{instance.subdomain}</span>
                                                <span>•</span>
                                                <span>{instance.runningReplicas}/{instance.replicas} replicas</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    <div className="flex items-center gap-4 flex-wrap">
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1",
                                            instance.status === 'running'
                                                ? "bg-green-500/20 text-green-400"
                                                : "bg-yellow-500/20 text-yellow-400"
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
                                                onClick={() => openDeleteModal(instance)}
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
