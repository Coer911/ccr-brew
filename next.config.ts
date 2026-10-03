import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Минимальный образ для Docker: server.js + только нужные node_modules.
  output: 'standalone',
  // Миграции читаются с диска при старте — кладём их в standalone-сборку.
  outputFileTracingIncludes: { '/*': ['./drizzle/**/*'] },
  images: { unoptimized: true },
};

export default nextConfig;
