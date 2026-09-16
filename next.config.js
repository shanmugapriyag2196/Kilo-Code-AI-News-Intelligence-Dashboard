/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.cocodataset.org" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*" }
    ]
  },
  experimental: {
    serverActions: { allowedOrigins: ["*"] }
  }
};

module.exports = nextConfig;