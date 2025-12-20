'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Key, CreditCard, Loader2, Crown, Zap, Rocket, Building2 } from 'lucide-react';

interface PricingPlan {
    id: string;
    name: string;
    price: number;
    features: {
        maxInstances: number;
        replicas: number;
        storageGb: number;
        bandwidthGb: number;
    };
}

interface Subscription {
    id: string;
    planId: string;
    status: string;
    endDate: string;
}

interface CurrentSubscription {
    subscription: Subscription | null;
    plan: PricingPlan;
}

const planIcons: Record<string, React.ReactNode> = {
    free: <Rocket className="w-5 h-5" />,
    starter: <Zap className="w-5 h-5" />,
    professional: <Crown className="w-5 h-5" />,
    enterprise: <Building2 className="w-5 h-5" />,
};

export default function SettingsPage() {
    const [subscription, setSubscription] = useState<CurrentSubscription | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        fetch('/api/v1/subscriptions/current', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then(setSubscription)
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, []);

    const formatPrice = (cents: number) => {
        if (cents === 0) return 'Free';
        return `$${(cents / 100).toFixed(2)}/month`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground">
                    Manage your account settings
                </p>
            </div>

            {/* Subscription Settings */}
            <Card className="glass gradient-border">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-indigo-400" />
                        Subscription
                    </CardTitle>
                    <CardDescription>
                        Manage your subscription and billing
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : subscription ? (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                                        {planIcons[subscription.plan.id] || <CreditCard className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{subscription.plan.name} Plan</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {formatPrice(subscription.plan.price)}
                                        </p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${subscription.subscription?.status === 'active'
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-yellow-500/20 text-yellow-400'
                                    }`}>
                                    {subscription.subscription?.status === 'active' ? 'Active' : 'Free Tier'}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="p-3 rounded-lg bg-secondary/30">
                                    <p className="text-muted-foreground">Max Instances</p>
                                    <p className="font-semibold">
                                        {subscription.plan.features.maxInstances === -1
                                            ? 'Unlimited'
                                            : subscription.plan.features.maxInstances}
                                    </p>
                                </div>
                                <div className="p-3 rounded-lg bg-secondary/30">
                                    <p className="text-muted-foreground">Replicas per Instance</p>
                                    <p className="font-semibold">{subscription.plan.features.replicas}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-secondary/30">
                                    <p className="text-muted-foreground">Storage</p>
                                    <p className="font-semibold">
                                        {subscription.plan.features.storageGb === -1
                                            ? 'Unlimited'
                                            : `${subscription.plan.features.storageGb} GB`}
                                    </p>
                                </div>
                                <div className="p-3 rounded-lg bg-secondary/30">
                                    <p className="text-muted-foreground">Bandwidth</p>
                                    <p className="font-semibold">
                                        {subscription.plan.features.bandwidthGb === -1
                                            ? 'Unlimited'
                                            : `${subscription.plan.features.bandwidthGb} GB`}
                                    </p>
                                </div>
                            </div>

                            {subscription.subscription?.endDate && (
                                <p className="text-sm text-muted-foreground">
                                    Your subscription renews on {formatDate(subscription.subscription.endDate)}
                                </p>
                            )}

                            <Link href="/pricing">
                                <Button variant="glow" className="w-full">
                                    {subscription.plan.price === 0 ? 'Upgrade Plan' : 'Manage Plan'}
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground mb-4">Unable to load subscription info</p>
                            <Link href="/pricing">
                                <Button variant="glow">View Plans</Button>
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Profile Settings */}
            <Card className="glass gradient-border">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5 text-indigo-400" />
                        Profile
                    </CardTitle>
                    <CardDescription>
                        Update your profile information
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" placeholder="John Doe" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="you@example.com" disabled />
                            <p className="text-xs text-muted-foreground">
                                Email cannot be changed
                            </p>
                        </div>
                        <Button>Save Changes</Button>
                    </form>
                </CardContent>
            </Card>

            {/* Password Settings */}
            <Card className="glass gradient-border">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Key className="w-5 h-5 text-indigo-400" />
                        Password
                    </CardTitle>
                    <CardDescription>
                        Change your password
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <Input id="currentPassword" type="password" placeholder="••••••••" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input id="newPassword" type="password" placeholder="••••••••" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input id="confirmPassword" type="password" placeholder="••••••••" />
                        </div>
                        <Button>Update Password</Button>
                    </form>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/50">
                <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    <CardDescription>
                        Irreversible actions
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="destructive">Delete Account</Button>
                </CardContent>
            </Card>
        </div>
    );
}

