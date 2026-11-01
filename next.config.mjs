/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // `npm run build:cloudflare` writes a static site to out/; plain `build` stays a server build so `npm start` works.
  output: process.env.npm_lifecycle_event === "build:cloudflare" ? "export" : undefined,
};

export default nextConfig;
