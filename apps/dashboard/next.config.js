/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    reactStrictMode: true,
    poweredByHeader: false,

    async rewrites() {
        return [
            {
                source: '/api/v1/:path*',
                destination: `${process.env.ORCHESTRATOR_URL || 'http://localhost:3001'}/:path*`,
            },
        ];
    },
};

module.exports = nextConfig;
