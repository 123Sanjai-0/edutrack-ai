/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com', 'avatar.vercel.sh', 'ui-avatars.com'],
  },
  async rewrites() {
    const rawTarget = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
    const target = rawTarget.replace(/\/$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${target}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
