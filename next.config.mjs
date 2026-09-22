/** @type {import('next').NextConfig} */
const nextConfig = {
	// For trying on a real mobile
	allowedDevOrigins: process.env.VERCEL_ENV !== "production" ? ["192.168.1.13"] : undefined,
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
	async headers() {
		return [
			{
				source: "/:path*",
				headers: [
					{
						key: "Permissions-Policy",
						value: "geolocation=(self)",
					},
				],
			},
		];
	},
};

export default nextConfig;
