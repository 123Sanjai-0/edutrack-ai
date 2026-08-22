/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com', 'avatar.vercel.sh', 'ui-avatars.com'],
  },
  async rewrites() {
    // Only proxy in local development (when NEXT_PUBLIC_API_URL is not set)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl) {
      // In production, the frontend calls the backend directly via NEXT_PUBLIC_API_URL
      return [];
    }
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
