/** @type {import('next').NextConfig} */
const nextConfig = {
  // Aumenta o limite de tamanho do body para uploads de vídeo (500MB)
  experimental: {
    serverActions: {
      bodySizeLimit: "500mb",
    },
  },
};

module.exports = nextConfig;
