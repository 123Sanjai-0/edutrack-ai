/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com', 'avatar.vercel.sh', 'ui-avatars.com'],
  },
  async rewrites() {
    const defaultBackend = 'https://pwoxm-2402-e280-2011-237-4425-3f07-cacf-81a2.run.pinggy-free.link/api';
    const rawTarget = process.env.NEXT_PUBLIC_API_URL || defaultBackend;
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
