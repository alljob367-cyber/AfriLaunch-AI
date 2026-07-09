/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  // Gateway (Alibaba FC + Caddy) serves prerendered HTML as static files and
  // 301-redirects /dir → /dir/ for directories. Next.js by default does the
  // opposite (308 /dir/ → /dir), which creates an infinite redirect loop on
  // the public preview URL. Setting trailingSlash: true makes Next.js expect
  // the trailing-slash form, breaking the loop.
  trailingSlash: true,
};

module.exports = nextConfig;
