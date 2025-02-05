/** @type {import('next').NextConfig} */
const nextConfig = {
    api: {
      bodyParser: false,
      responseLimit: '500mb',
    },
    experimental: {
      serverComponentsExternalPackages: ['sharp'],
    }
  }
  
  module.exports = nextConfig;