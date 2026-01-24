/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disabled for compatibility
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
