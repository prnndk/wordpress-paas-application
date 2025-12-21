'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    Users,
    Search,
    Shield,
    ShieldCheck,
    ToggleLeft,
    ToggleRight,
    Loader2,
} from 'lucide-react';

interface User {
    id: string;
    email: string;
    name: string | null;
    role: string;
    isActive: boolean;
    createdAt: string;
    _count: {
        tenants: number;
    };
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [updating, setUpdating] = useState<string | null>(null);

    const fetchUsers = async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        try {
            const res = await fetch('/api/v1/admin/users', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const toggleUserStatus = async (userId: string, isActive: boolean) => {
        setUpdating(userId);
        const token = localStorage.getItem('accessToken');

        try {
            const res = await fetch(`/api/v1/admin/users/${userId}/status`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isActive }),
            });

            if (res.ok) {
                setUsers(users.map(u => u.id === userId ? { ...u, isActive } : u));
            }
        } catch (error) {
            console.error('Failed to update user:', error);
        } finally {
            setUpdating(null);
        }
    };

    const toggleUserRole = async (userId: string, role: 'user' | 'admin') => {
        setUpdating(userId);
        const token = localStorage.getItem('accessToken');

        try {
            const res = await fetch(`/api/v1/admin/users/${userId}/role`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ role }),
            });

            if (res.ok) {
                setUsers(users.map(u => u.id === userId ? { ...u, role } : u));
            }
        } catch (error) {
            console.error('Failed to update user role:', error);
        } finally {
            setUpdating(null);
        }
    };

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.name?.toLowerCase().includes(search.toLowerCase())
    );

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
                    <h1 className="text-3xl font-bold">User Management</h1>
                    <p className="text-muted-foreground">{users.length} total users</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search users..."
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
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Tenants</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{user.email}</div>
                                            <div className="text-sm text-muted-foreground">{user.name || 'No name'}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <button
                                            onClick={() => toggleUserRole(user.id, user.role === 'admin' ? 'user' : 'admin')}
                                            disabled={updating === user.id}
                                            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${user.role === 'admin'
                                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                                }`}
                                        >
                                            {user.role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                                            {user.role}
                                        </button>
                                    </TableCell>
                                    <TableCell>{user._count.tenants}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${user.isActive
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                            }`}>
                                            {user.isActive ? 'Active' : 'Disabled'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant={user.isActive ? 'destructive' : 'default'}
                                            size="sm"
                                            onClick={() => toggleUserStatus(user.id, !user.isActive)}
                                            disabled={updating === user.id}
                                        >
                                            {updating === user.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : user.isActive ? (
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
