import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
    Rocket,
    Shield,
    Zap,
    Database,
    Server,
    Globe
} from 'lucide-react';

export default function HomePage() {
    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <header className="relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-3xl rounded-full" />

                {/* Navigation */}
                <nav className="relative z-10 container mx-auto px-6 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <Rocket className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold">WP PaaS</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/pricing">
                            <Button variant="ghost">Pricing</Button>
                        </Link>
                        <Link href="/login">
                            <Button variant="ghost">Sign In</Button>
                        </Link>
                        <Link href="/register">
                            <Button variant="glow">Get Started</Button>
                        </Link>
                    </div>
                </nav>

                {/* Hero Content */}
                <div className="relative z-10 container mx-auto px-6 pt-20 pb-32 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-fade-in">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm text-muted-foreground">Deploy WordPress in seconds</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
                        <span className="gradient-text">WordPress Hosting</span>
                        <br />
                        <span className="text-foreground">Made Simple</span>
                    </h1>

                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in">
                        Multi-tenancy platform for deploying isolated, scalable WordPress instances.
                        Powered by Docker Swarm with automatic SSL and high availability.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
                        <Link href="/register">
                            <Button size="lg" variant="glow" className="text-lg px-8">
                                Start Free Trial
                            </Button>
                        </Link>
                        <Link href="/login">
                            <Button size="lg" variant="outline" className="text-lg px-8">
                                View Dashboard
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Features Section */}
            <section className="py-24 relative">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Enterprise-Grade Infrastructure
                        </h2>
                        <p className="text-muted-foreground max-w-xl mx-auto">
                            Built on Docker Swarm with replicated storage and database clustering
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Shield className="w-8 h-8" />}
                            title="Isolated Environments"
                            description="Each WordPress instance runs in its own isolated container with dedicated resources and storage."
                        />
                        <FeatureCard
                            icon={<Database className="w-8 h-8" />}
                            title="MySQL Replication"
                            description="Master-Slave database cluster ensures your data is always replicated and available."
                        />
                        <FeatureCard
                            icon={<Server className="w-8 h-8" />}
                            title="High Availability"
                            description="Each deployment runs on 2 worker nodes. If one fails, your site stays online."
                        />
                        <FeatureCard
                            icon={<Zap className="w-8 h-8" />}
                            title="Instant Deployment"
                            description="Deploy a new WordPress instance in under 60 seconds with automatic configuration."
                        />
                        <FeatureCard
                            icon={<Globe className="w-8 h-8" />}
                            title="Automatic SSL"
                            description="Let's Encrypt certificates are automatically provisioned and renewed for all sites."
                        />
                        <FeatureCard
                            icon={<Rocket className="w-8 h-8" />}
                            title="Replicated Storage"
                            description="GlusterFS ensures your files are synchronized across all worker nodes in real-time."
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/10 to-transparent" />
                <div className="container mx-auto px-6 relative z-10">
                    <div className="glass gradient-border rounded-3xl p-12 text-center max-w-3xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Ready to Deploy?
                        </h2>
                        <p className="text-muted-foreground mb-8">
                            Create your first WordPress instance today. No credit card required.
                        </p>
                        <Link href="/register">
                            <Button size="lg" variant="glow" className="text-lg px-8">
                                Get Started for Free
                            </Button>
                        </Link>
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

function FeatureCard({
    icon,
    title,
    description
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="glass gradient-border rounded-2xl p-6 transition-all hover:scale-[1.02] hover:shadow-xl">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-4 text-indigo-400">
                {icon}
            </div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
        </div>
    );
}
