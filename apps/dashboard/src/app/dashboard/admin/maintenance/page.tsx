'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Wrench,
    RefreshCw,
    Bell,
    Plus,
    Trash2,
    ToggleLeft,
    ToggleRight,
    Loader2,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Info,
} from 'lucide-react';

interface Announcement {
    id: string;
    title: string;
    message: string;
    type: string;
    isActive: boolean;
    scheduledAt: string | null;
    expiresAt: string | null;
    createdAt: string;
}

interface RollingUpdateResult {
    success: boolean;
    servicesUpdated: string[];
    errors: string[];
}

export default function MaintenancePage() {
    const [currentImage, setCurrentImage] = useState<string>('');
    const [newImage, setNewImage] = useState<string>('');
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [updateResult, setUpdateResult] = useState<RollingUpdateResult | null>(null);
    const [showNewAnnouncement, setShowNewAnnouncement] = useState(false);
    const [forceUpdate, setForceUpdate] = useState(true); // Default to true for :latest tag updates
    const [announcementForm, setAnnouncementForm] = useState({
        title: '',
        message: '',
        type: 'info',
        scheduledAt: '',
        expiresAt: '',
    });

    const fetchData = async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        try {
            const [imageRes, announcementsRes] = await Promise.all([
                fetch('/api/v1/admin/maintenance/image', {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch('/api/v1/admin/announcements', {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            if (imageRes.ok) {
                const data = await imageRes.json();
                setCurrentImage(data.currentImage);
                setNewImage(data.currentImage);
            }

            if (announcementsRes.ok) {
                const data = await announcementsRes.json();
                setAnnouncements(data);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRollingUpdate = async () => {
        if (!newImage) return;

        setUpdating(true);
        setUpdateResult(null);
        const token = localStorage.getItem('accessToken');

        try {
            const res = await fetch('/api/v1/admin/maintenance/rolling-update', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ image: newImage, forceUpdate }),
            });

            if (res.ok) {
                const result = await res.json();
                setUpdateResult(result);
                if (result.success) {
                    setCurrentImage(newImage);
                }
            } else {
                setUpdateResult({
                    success: false,
                    servicesUpdated: [],
                    errors: ['Failed to start rolling update'],
                });
            }
        } catch (error) {
            setUpdateResult({
                success: false,
                servicesUpdated: [],
                errors: [(error as Error).message],
            });
        } finally {
            setUpdating(false);
        }
    };

    const createAnnouncement = async () => {
        const token = localStorage.getItem('accessToken');

        try {
            const res = await fetch('/api/v1/admin/announcements', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...announcementForm,
                    scheduledAt: announcementForm.scheduledAt || undefined,
                    expiresAt: announcementForm.expiresAt || undefined,
                }),
            });

            if (res.ok) {
                const newAnnouncement = await res.json();
                setAnnouncements([newAnnouncement, ...announcements]);
                setShowNewAnnouncement(false);
                setAnnouncementForm({ title: '', message: '', type: 'info', scheduledAt: '', expiresAt: '' });
            }
        } catch (error) {
            console.error('Failed to create announcement:', error);
        }
    };

    const toggleAnnouncement = async (id: string, isActive: boolean) => {
        const token = localStorage.getItem('accessToken');

        try {
            const res = await fetch(`/api/v1/admin/announcements/${id}`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isActive }),
            });

            if (res.ok) {
                setAnnouncements(announcements.map(a => a.id === id ? { ...a, isActive } : a));
            }
        } catch (error) {
            console.error('Failed to toggle announcement:', error);
        }
    };

    const deleteAnnouncement = async (id: string) => {
        const token = localStorage.getItem('accessToken');

        try {
            const res = await fetch(`/api/v1/admin/announcements/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                setAnnouncements(announcements.filter(a => a.id !== id));
            }
        } catch (error) {
            console.error('Failed to delete announcement:', error);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'warning':
                return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
            case 'maintenance':
                return <Wrench className="w-4 h-4 text-orange-500" />;
            default:
                return <Info className="w-4 h-4 text-blue-500" />;
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
            <div>
                <h1 className="text-3xl font-bold">Maintenance</h1>
                <p className="text-muted-foreground">Manage system updates and announcements</p>
            </div>

            {/* Rolling Update Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <RefreshCw className="w-5 h-5" />
                        Rolling Update
                    </CardTitle>
                    <CardDescription>
                        Update all WordPress instances to a new Docker image version
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <Label>Current Image</Label>
                            <Input value={currentImage} disabled className="mt-1" />
                        </div>
                        <div>
                            <Label>New Image</Label>
                            <Input
                                value={newImage}
                                onChange={(e) => setNewImage(e.target.value)}
                                placeholder="prnndk/wp-paas-wordpress:latest"
                                className="mt-1"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={forceUpdate}
                                onChange={(e) => setForceUpdate(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300"
                            />
                            <span className="text-sm">
                                Force re-pull image (untuk memperbarui image dengan tag yang sama seperti :latest)
                            </span>
                        </label>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            onClick={handleRollingUpdate}
                            disabled={updating || !newImage || (!forceUpdate && newImage === currentImage)}
                        >
                            {updating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Start Rolling Update
                                </>
                            )}
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => {
                                setNewImage('prnndk/wp-paas-wordpress:latest');
                                setForceUpdate(true);
                            }}
                        >
                            Use Latest Image
                        </Button>
                    </div>

                    {updateResult && (
                        <div className={`p-4 rounded-lg ${updateResult.success ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                {updateResult.success ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                ) : (
                                    <XCircle className="w-5 h-5 text-red-500" />
                                )}
                                <span className="font-medium">
                                    {updateResult.success ? 'Update Complete' : 'Update Failed'}
                                </span>
                            </div>
                            {updateResult.servicesUpdated.length > 0 && (
                                <p className="text-sm text-muted-foreground">
                                    Updated: {updateResult.servicesUpdated.join(', ')}
                                </p>
                            )}
                            {updateResult.errors.length > 0 && (
                                <p className="text-sm text-red-500">
                                    Errors: {updateResult.errors.join(', ')}
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Announcements Section */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="w-5 h-5" />
                            Announcements
                        </CardTitle>
                        <CardDescription>
                            Notify users about maintenance and updates
                        </CardDescription>
                    </div>
                    <Dialog open={showNewAnnouncement} onOpenChange={setShowNewAnnouncement}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                New Announcement
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create Announcement</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div>
                                    <Label>Title</Label>
                                    <Input
                                        value={announcementForm.title}
                                        onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                                        placeholder="Maintenance Notice"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label>Message</Label>
                                    <Textarea
                                        value={announcementForm.message}
                                        onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                                        placeholder="We will be performing maintenance..."
                                        className="mt-1"
                                        rows={4}
                                    />
                                </div>
                                <div>
                                    <Label>Type</Label>
                                    <select
                                        value={announcementForm.type}
                                        onChange={(e) => setAnnouncementForm({ ...announcementForm, type: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
                                    >
                                        <option value="info">Info</option>
                                        <option value="warning">Warning</option>
                                        <option value="maintenance">Maintenance</option>
                                    </select>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <Label>Scheduled At (optional)</Label>
                                        <Input
                                            type="datetime-local"
                                            value={announcementForm.scheduledAt}
                                            onChange={(e) => setAnnouncementForm({ ...announcementForm, scheduledAt: e.target.value })}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label>Expires At (optional)</Label>
                                        <Input
                                            type="datetime-local"
                                            value={announcementForm.expiresAt}
                                            onChange={(e) => setAnnouncementForm({ ...announcementForm, expiresAt: e.target.value })}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>
                                <Button onClick={createAnnouncement} className="w-full">
                                    Create Announcement
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Type</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {announcements.map((announcement) => (
                                <TableRow key={announcement.id}>
                                    <TableCell>{getTypeIcon(announcement.type)}</TableCell>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{announcement.title}</div>
                                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                                                {announcement.message}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${announcement.isActive
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                            }`}>
                                            {announcement.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {new Date(announcement.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleAnnouncement(announcement.id, !announcement.isActive)}
                                            >
                                                {announcement.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => deleteAnnouncement(announcement.id)}
                                            >
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {announcements.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                        No announcements yet. Create one to notify users.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
