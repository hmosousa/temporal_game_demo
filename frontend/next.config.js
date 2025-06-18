/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    // For production, API calls should go through nginx proxy
    // For development, they go to the backend directly
    const apiUrl = process.env.NODE_ENV === 'production' 
      ? '' // Let nginx handle routing 
      : (process.env.NEXT_PUBLIC_API_URL || 'http://backend:5000');
    
    return apiUrl ? [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ] : []; // Empty array when using nginx proxy
  }
}

module.exports = nextConfig
