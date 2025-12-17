'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Loader2, Rocket } from 'lucide-react';

export default function NewInstancePage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        subdomain: '',
    });

    const domain = process.env.NEXT_PUBLIC_DOMAIN || 'localhost';

    const handleSubdomainChange = (value: string) => {
        // Only allow lowercase alphanumeric and hyphens
        const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
        setFormData({ ...formData, subdomain: sanitized });
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

        setIsLoading(true);
        const token = localStorage.getItem('accessToken');

        try {
            const res = await fetch('/api/v1/tenants', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to create instance');
            }

            toast({
                variant: 'success',
                title: 'Instance created!',
                description: 'Your WordPress instance is being deployed...',
            });

            router.push('/dashboard/instances');
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
                        Configure your WordPress instance. It will be deployed with 2 replicas for high availability.
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
                            <Label htmlFor="subdomain">Subdomain</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="subdomain"
                                    placeholder="myblog"
                                    value={formData.subdomain}
                                    onChange={(e) => handleSubdomainChange(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="flex-1"
                                />
                                <span className="text-muted-foreground whitespace-nowrap">.{domain}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Your WordPress will be accessible at https://{formData.subdomain || 'subdomain'}.{domain}
                            </p>
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
                            WordPress container running on 2 worker nodes
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                            Automatic SSL certificate via Let's Encrypt
                        </li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
