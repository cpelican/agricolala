/** @type {import('next').NextConfig} */
const nextConfig = {
	experimental: {
		taint: process.env.NODE_ENV !== "production",
		serverActions: {
			allowedOrigins: ["agricolala-eta.vercel.app", "*.agricolala-eta.vercel.app"],
		},
		// Use Turbopack to avoid webpack minification issues
		turbo: {
			rules: {
				"*.svg": {
					loaders: ["@svgr/webpack"],
					as: "*.js",
				},
			},
		},
		webVitalsAttribution: ['CLS', 'LCP', 'FCP', 'TTFB', 'INP'],
	},
	serverExternalPackages: ["@prisma/client"],
	images: {
		domains: ["lh3.googleusercontent.com"],
	},
};

export default nextConfig;
