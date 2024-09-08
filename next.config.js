/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: false,
	images: {
		remotePatterns: [
			{
				hostname: "uvfdaozhnxwcohewyqep.supabase.co",
				pathname: "**",
			},
		],
	},
};

module.exports = nextConfig;
