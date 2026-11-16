/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Mammoth and file parsing can handle larger payloads
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
