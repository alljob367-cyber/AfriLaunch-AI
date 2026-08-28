/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: false },
  // trailingSlash: false — required for Vercel (API routes need no trailing slash)
  // The Alibaba FC gateway issue is handled separately and doesn't apply to Vercel
  trailingSlash: false,
};

module.exports = nextConfig;
