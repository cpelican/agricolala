import { PrismaClient } from "@prisma/client";

const prismaClient = new PrismaClient();

(async () => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [_a, _b, email] = process.argv;

	if (!email) {
		console.error("Please provide an email as an argument");
		process.exit(1);
	}

	void prismaClient.user.update({
		where: {
			email,
		},
		data: {
			isAdmin: true,
		},
	});
})();
