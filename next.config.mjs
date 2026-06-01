/** @type {import('next').NextConfig} */
const nextConfig = {
	devIndicators: process.env.PLAYWRIGHT ? false : undefined,
	experimental: {
		taint: true,
		staleTimes: {
			dynamic: 60,
			static: 300,
		},
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
