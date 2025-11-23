/** @type {import('next').NextConfig} */
const nextConfig = {
	experimental: {
		taint: process.env.NODE_ENV !== "production",
		serverActions: {
			allowedOrigins: ["agricolala-eta.vercel.app", "*.agricolala-eta.vercel.app"],
		},
	},
	serverExternalPackages: ["@prisma/client"],
	images: {
		domains: ["lh3.googleusercontent.com"],
	},
};

export default nextConfig;
