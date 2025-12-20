'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Loader2, Rocket, Eye, EyeOff, Copy, Check } from 'lucide-react';

interface CreatedInstance {
    id: string;
    name: string;
    subdomain: string;
    url: string;
    wpAdminUser: string;
    wpAdminPassword: string;
}

export default function NewInstancePage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [createdInstance, setCreatedInstance] = useState<CreatedInstance | null>(null);
    const [copied, setCopied] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        subdomain: '',
        wpAdminUser: 'admin',
        wpAdminPassword: '',
    });

    const serverIp = process.env.NEXT_PUBLIC_SERVER_IP || process.env.NEXT_PUBLIC_DOMAIN || 'localhost';

    const handleSubdomainChange = (value: string) => {
        // Only allow lowercase alphanumeric and hyphens
        const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
        setFormData({ ...formData, subdomain: sanitized });
    };

    const generatePassword = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < 16; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData({ ...formData, wpAdminPassword: password });
    };

    const copyToClipboard = async (text: string, field: string) => {
        await navigator.clipboard.writeText(text);
        setCopied(field);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.subdomain.length < 3) {
            toast({
                variant: 'destructive',
                title: 'Subdomain too short',
                description: 'Subdomain must be at least 3 characters',
            });
            return;
        }

        if (formData.wpAdminPassword && formData.wpAdminPassword.length < 8) {
            toast({
                variant: 'destructive',
                title: 'Password too short',
                description: 'WordPress admin password must be at least 8 characters',
            });
            return;
        }

        setIsLoading(true);
        const token = localStorage.getItem('accessToken');

        try {
            const res = await fetch('/api/v1/tenants', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: formData.name,
                    subdomain: formData.subdomain,
                    wpAdminUser: formData.wpAdminUser || undefined,
                    wpAdminPassword: formData.wpAdminPassword || undefined,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to create instance');
            }

            const data = await res.json();

            // Show the created instance with credentials
            setCreatedInstance({
                id: data.id,
                name: data.name,
                subdomain: data.subdomain,
                url: data.url,
                wpAdminUser: data.wpAdminUser,
                wpAdminPassword: data.wpAdminPassword,
            });

            toast({
                variant: 'success',
                title: 'Instance created!',
                description: 'Your WordPress instance is being deployed...',
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Failed to create instance',
                description: error instanceof Error ? error.message : 'Please try again',
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Show credentials after creation
    if (createdInstance) {
        return (
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/instances">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-green-400">Instance Created!</h1>
                        <p className="text-muted-foreground">
                            Save your WordPress admin credentials
                        </p>
                    </div>
                </div>

                <Card className="glass gradient-border">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Rocket className="w-5 h-5 text-green-400" />
                            {createdInstance.name}
                        </CardTitle>
                        <CardDescription>
                            Your WordPress instance is being deployed. Save these credentials securely.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                            <p className="text-sm text-yellow-400 font-medium mb-2">
                                ⚠️ Important: Save these credentials now!
                            </p>
                            <p className="text-xs text-muted-foreground">
                                These credentials will not be shown again. Make sure to save them securely.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>WordPress URL</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={createdInstance.url}
                                        readOnly
                                        className="font-mono"
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => copyToClipboard(createdInstance.url, 'url')}
                                    >
                                        {copied === 'url' ? (
                                            <Check className="w-4 h-4 text-green-400" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Admin Username</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={createdInstance.wpAdminUser}
                                        readOnly
                                        className="font-mono"
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => copyToClipboard(createdInstance.wpAdminUser, 'user')}
                                    >
                                        {copied === 'user' ? (
                                            <Check className="w-4 h-4 text-green-400" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Admin Password</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        value={createdInstance.wpAdminPassword}
                                        readOnly
                                        className="font-mono"
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-4 h-4" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => copyToClipboard(createdInstance.wpAdminPassword, 'password')}
                                    >
                                        {copied === 'password' ? (
                                            <Check className="w-4 h-4 text-green-400" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex gap-4">
                            <Link href={`/dashboard/instances/${createdInstance.id}`} className="flex-1">
                                <Button variant="glow" className="w-full">
                                    View Instance Details
                                </Button>
                            </Link>
                            <Link href="/dashboard/instances">
                                <Button variant="outline">
                                    Back to Instances
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/instances">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">New Instance</h1>
                    <p className="text-muted-foreground">
                        Deploy a new WordPress instance
                    </p>
                </div>
            </div>

            {/* Form */}
            <Card className="glass gradient-border">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Rocket className="w-5 h-5 text-indigo-400" />
                        Instance Details
                    </CardTitle>
                    <CardDescription>
                        Configure your WordPress instance. It will be deployed based on your subscription plan.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Instance Name</Label>
                            <Input
                                id="name"
                                placeholder="My Blog"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                disabled={isLoading}
                            />
                            <p className="text-xs text-muted-foreground">
                                A friendly name for your WordPress instance
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="subdomain">URL Path</Label>
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground whitespace-nowrap">{serverIp}/</span>
                                <Input
                                    id="subdomain"
                                    placeholder="myblog"
                                    value={formData.subdomain}
                                    onChange={(e) => handleSubdomainChange(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="flex-1"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Your WordPress will be accessible at http://{serverIp}/{formData.subdomain || 'slug'}
                            </p>
                        </div>

                        <div className="border-t border-border pt-6">
                            <h3 className="text-lg font-semibold mb-4">WordPress Admin Credentials</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Set the admin username and password for your WordPress dashboard. If left empty, credentials will be auto-generated.
                            </p>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="wpAdminUser">Admin Username</Label>
                                    <Input
                                        id="wpAdminUser"
                                        placeholder="admin"
                                        value={formData.wpAdminUser}
                                        onChange={(e) => setFormData({ ...formData, wpAdminUser: e.target.value })}
                                        disabled={isLoading}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="wpAdminPassword">Admin Password</Label>
                                    <div className="flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <Input
                                                id="wpAdminPassword"
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="Leave empty to auto-generate"
                                                value={formData.wpAdminPassword}
                                                onChange={(e) => setFormData({ ...formData, wpAdminPassword: e.target.value })}
                                                disabled={isLoading}
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="w-4 h-4" />
                                            ) : (
                                                <Eye className="w-4 h-4" />
                                            )}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={generatePassword}
                                            disabled={isLoading}
                                        >
                                            Generate
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Must be at least 8 characters. We recommend using a strong password.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex gap-4">
                            <Button type="submit" variant="glow" disabled={isLoading} className="flex-1">
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Rocket className="mr-2 h-4 w-4" />
                                        Create Instance
                                    </>
                                )}
                            </Button>
                            <Link href="/dashboard/instances">
                                <Button variant="outline" disabled={isLoading}>
                                    Cancel
                                </Button>
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Info */}
            <Card className="glass">
                <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">What gets created:</h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                            Dedicated MySQL database for your WordPress
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                            Isolated storage directory with real-time replication
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                            WordPress containers based on your plan's replica count
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                            Automatic SSL certificate via Let's Encrypt
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                            Pre-configured WordPress admin account with your credentials
                        </li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}

