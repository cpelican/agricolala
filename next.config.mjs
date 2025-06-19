/** @type {import('next').NextConfig} */
const nextConfig = {
	serverExternalPackages: ["@prisma/client"],
	images: {
		domains: ["lh3.googleusercontent.com"],
	},
};

export default nextConfig;
