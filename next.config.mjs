/** @type {import('next').NextConfig} */
const nextConfig = {
	experimental: {
		taint: process.env.NODE_ENV !== "production",
		serverActions: {
			allowedOrigins: ["agricolala-eta.vercel.app", "*.agricolala-eta.vercel.app"],
		},
		webVitalsAttribution: ['CLS', 'LCP', 'FCP', 'TTFB', 'INP'],
	},
	turbopack: {
		rules: {
			"*.svg": {
				loaders: ["@svgr/webpack"],
				as: "*.js",
			},
		},
	},
	serverExternalPackages: ["@prisma/client"],
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "lh3.googleusercontent.com",
			},
		],
	},
};

export default nextConfig;
