/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://drbloomedi-backend.onrender.com/:path*',
      },
    ];
  },
};

module.exports = nextConfig;