/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/v0/b/**"
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**"
      }
    ]
  }
};

export default nextConfig;
