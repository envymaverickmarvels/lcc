/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@localmed/ui', '@localmed/core', '@localmed/api-client'],
};

module.exports = nextConfig;
