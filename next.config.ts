import type {NextConfig} from 'next';

/** Static export for Hostinger (landing branch). Vercel main branch uses Node server. */
const isHostingerStatic = process.env.HOSTINGER_STATIC === '1';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: isHostingerStatic ? 'export' : undefined,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: isHostingerStatic,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  ...(isHostingerStatic
    ? {}
    : {
        experimental: {
          serverActions: {
            bodySizeLimit: '16mb',
          },
        },
      }),
  trailingSlash: true,
  transpilePackages: ['motion'],
  webpack: (config, {dev}) => {
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
