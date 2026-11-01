/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // `npm run build:cloudflare` writes a static site to out/; plain `build` stays a server build so `npm start` works.
  output: process.env.npm_lifecycle_event === "build:cloudflare" ? "export" : undefined,
  // Set NEXT_PUBLIC_BASE_PATH (e.g. /projects/expense-tracker-ai) to serve the app from a subfolder; unset serves from /.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
};

export default nextConfig;
