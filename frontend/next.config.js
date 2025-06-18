/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    // Use the environment variable, with a fallback that works in the container
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://backend:5000';
    
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ]
  }
}

module.exports = nextConfig
