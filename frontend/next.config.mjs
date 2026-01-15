/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  async rewrites() {
    const backend =
      process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    return [
      {
        source: '/api/:path*',
        destination: `${backend}/api/:path*`
      }
    ];
  }
};

export default nextConfig;
