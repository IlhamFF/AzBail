import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      // Add your Supabase storage hostname if you plan to use it for avatars/files
      // Example:
      // {
      //   protocol: 'https',
      //   hostname: 'your-project-ref.supabase.co', // Replace with your Supabase project ref
      //   port: '',
      //   pathname: '/storage/v1/object/public/**',
      // },
    ],
  },
   env: {
     NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
     NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
   },
};

export default nextConfig;
