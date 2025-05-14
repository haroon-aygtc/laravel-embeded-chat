/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    webpack: (config, { isServer }) => {
        // Fixes npm packages that depend on Node.js modules
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                stream: false,
                os: false,
                path: false,
            };
        }
        return config;
    },
};

module.exports = nextConfig; 