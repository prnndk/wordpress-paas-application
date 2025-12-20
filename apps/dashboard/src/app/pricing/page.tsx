'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import {
    Rocket,
    Check,
    Zap,
    Crown,
    Building2,
    Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PricingPlan {
    id: string;
    name: string;
    price: number;
    features: {
        maxInstances: number;
        replicas: number;
        storageGb: number;
        bandwidthGb: number;
        sslCert: boolean;
        customDomain: boolean;
        backups: boolean;
        prioritySupport: boolean;
    };
}

interface CurrentSubscription {
    subscription: {
        id: string;
        planId: string;
        status: string;
        endDate: string;
    } | null;
    plan: PricingPlan;
}

const planIcons: Record<string, React.ReactNode> = {
    free: <Rocket className="w-6 h-6" />,
    starter: <Zap className="w-6 h-6" />,
    professional: <Crown className="w-6 h-6" />,
    enterprise: <Building2 className="w-6 h-6" />,
};

const planColors: Record<string, string> = {
    free: 'from-gray-500/20 to-gray-600/20',
    starter: 'from-blue-500/20 to-indigo-600/20',
    professional: 'from-purple-500/20 to-pink-600/20',
    enterprise: 'from-amber-500/20 to-orange-600/20',
};

export default function PricingPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [plans, setPlans] = useState<PricingPlan[]>([]);
    const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        setIsLoggedIn(!!token);

        // Fetch pricing plans (public endpoint)
        fetch('/api/v1/subscriptions/plans')
            .then((res) => res.json())
            .then(setPlans)
            .catch(console.error);

        // Fetch current subscription if logged in
        if (token) {
            fetch('/api/v1/subscriptions/current', {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((res) => res.json())
                .then(setCurrentSubscription)
                .catch(console.error);
        }

        setIsLoading(false);
    }, []);

    const handleSelectPlan = async (planId: string) => {
        const token = localStorage.getItem('accessToken');

        if (!token) {
            router.push('/register');
            return;
        }

        if (!currentSubscription) return;

        const endpoint = currentSubscription.plan.price < (plans.find(p => p.id === planId)?.price || 0)
            ? '/api/v1/subscriptions/upgrade'
            : '/api/v1/subscriptions/downgrade';

        setActionLoading(planId);

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ planId, durationMonths: 1 }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to update plan');
            }

            toast({
                variant: 'success',
                title: 'Plan Updated!',
                description: `You are now on the ${planId.charAt(0).toUpperCase() + planId.slice(1)} plan.`,
            });

            // Refresh subscription
            const subRes = await fetch('/api/v1/subscriptions/current', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCurrentSubscription(await subRes.json());
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Failed to update plan',
                description: error instanceof Error ? error.message : 'Please try again',
            });
        } finally {
            setActionLoading(null);
        }
    };

    const formatPrice = (cents: number) => {
        if (cents === 0) return 'Free';
        return `$${(cents / 100).toFixed(2)}`;
    };

    const formatLimit = (value: number, suffix: string = '') => {
        if (value === -1) return 'Unlimited';
        return `${value}${suffix}`;
    };

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-3xl rounded-full" />

                <nav className="relative z-10 container mx-auto px-6 py-6 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <Rocket className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold">WP PaaS</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        {isLoggedIn ? (
                            <Link href="/dashboard">
                                <Button variant="glow">Dashboard</Button>
                            </Link>
                        ) : (
                            <>
                                <Link href="/login">
                                    <Button variant="ghost">Sign In</Button>
                                </Link>
                                <Link href="/register">
                                    <Button variant="glow">Get Started</Button>
                                </Link>
                            </>
                        )}
                    </div>
                </nav>

                <div className="relative z-10 container mx-auto px-6 pt-16 pb-12 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold mb-4">
                        <span className="gradient-text">Simple, Transparent</span>
                        <br />
                        <span className="text-foreground">Pricing</span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Choose the plan that fits your needs. Upgrade or downgrade anytime.
                    </p>
                </div>
            </header>

            {/* Pricing Cards */}
            <section className="py-16 container mx-auto px-6">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                        {plans.map((plan) => {
                            const isCurrentPlan = currentSubscription?.plan.id === plan.id;
                            const isPro = plan.id === 'professional';

                            return (
                                <Card
                                    key={plan.id}
                                    className={cn(
                                        'glass relative overflow-hidden transition-all hover:scale-[1.02]',
                                        isPro && 'ring-2 ring-purple-500',
                                        isCurrentPlan && 'ring-2 ring-green-500'
                                    )}
                                >
                                    {isPro && (
                                        <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
                                            POPULAR
                                        </div>
                                    )}
                                    {isCurrentPlan && (
                                        <div className="absolute top-0 left-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-br-lg">
                                            CURRENT
                                        </div>
                                    )}

                                    <CardHeader className="text-center pb-2">
                                        <div className={cn(
                                            'w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center mx-auto mb-4',
                                            planColors[plan.id]
                                        )}>
                                            {planIcons[plan.id]}
                                        </div>
                                        <CardTitle className="text-2xl">{plan.name}</CardTitle>
                                        <div className="mt-4">
                                            <span className="text-4xl font-bold">{formatPrice(plan.price)}</span>
                                            {plan.price > 0 && (
                                                <span className="text-muted-foreground">/month</span>
                                            )}
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-4">
                                        <ul className="space-y-3 text-sm">
                                            <FeatureItem
                                                included={true}
                                                text={`${formatLimit(plan.features.maxInstances)} WordPress instances`}
                                            />
                                            <FeatureItem
                                                included={true}
                                                text={`${plan.features.replicas} replicas per instance`}
                                            />
                                            <FeatureItem
                                                included={true}
                                                text={`${formatLimit(plan.features.storageGb, ' GB')} storage`}
                                            />
                                            <FeatureItem
                                                included={true}
                                                text={`${formatLimit(plan.features.bandwidthGb, ' GB')} bandwidth`}
                                            />
                                            <FeatureItem
                                                included={plan.features.sslCert}
                                                text="Free SSL certificates"
                                            />
                                            <FeatureItem
                                                included={plan.features.customDomain}
                                                text="Custom domains"
                                            />
                                            <FeatureItem
                                                included={plan.features.backups}
                                                text="Automated backups"
                                            />
                                            <FeatureItem
                                                included={plan.features.prioritySupport}
                                                text="Priority support"
                                            />
                                        </ul>

                                        <Button
                                            variant={isCurrentPlan ? 'outline' : (isPro ? 'glow' : 'default')}
                                            className="w-full mt-4"
                                            disabled={isCurrentPlan || actionLoading !== null}
                                            onClick={() => handleSelectPlan(plan.id)}
                                        >
                                            {actionLoading === plan.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : isCurrentPlan ? (
                                                'Current Plan'
                                            ) : isLoggedIn ? (
                                                currentSubscription && currentSubscription.plan.price < plan.price
                                                    ? 'Upgrade'
                                                    : 'Downgrade'
                                            ) : (
                                                'Get Started'
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* FAQ Section */}
            <section className="py-16 container mx-auto px-6">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-6">
                        <FAQItem
                            question="Can I upgrade or downgrade at any time?"
                            answer="Yes! You can change your plan at any time. When upgrading, you'll get immediate access to new features. When downgrading, the change takes effect at the end of your billing period."
                        />
                        <FAQItem
                            question="What happens if I exceed my instance limit?"
                            answer="You won't be able to create new instances until you upgrade your plan or delete existing instances. Your current instances will continue to run normally."
                        />
                        <FAQItem
                            question="Is there a free trial?"
                            answer="Yes! Our Free plan is available forever with 1 WordPress instance. You can upgrade anytime to get more instances and features."
                        />
                        <FAQItem
                            question="What payment methods do you accept?"
                            answer="We accept all major credit cards through our secure payment processor. Enterprise customers can also pay via invoice."
                        />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-border py-8">
                <div className="container mx-auto px-6 text-center text-muted-foreground">
                    <p>© {new Date().getFullYear()} WordPress PaaS. Built with Docker Swarm.</p>
                </div>
            </footer>
        </div>
    );
}

function FeatureItem({ included, text }: { included: boolean; text: string }) {
    return (
        <li className={cn(
            'flex items-center gap-2',
            !included && 'text-muted-foreground line-through'
        )}>
            <Check className={cn(
                'w-4 h-4 flex-shrink-0',
                included ? 'text-green-400' : 'text-muted-foreground'
            )} />
            {text}
        </li>
    );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
    return (
        <div className="glass rounded-xl p-6">
            <h3 className="font-semibold mb-2">{question}</h3>
            <p className="text-muted-foreground text-sm">{answer}</p>
        </div>
    );
}
