import { PrismaClient } from "@prisma/client";

const prismaClient = new PrismaClient();

(async () => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [_a, _b, email] = process.argv;

	if (!email) {
		console.error("Please provide an email as an argument");
		process.exit(1);
	}
	console.log(`Creating admin user with email ${email}`);

	const adminUser = await prismaClient.adminUser.create({ data: { email } });
	console.log(`Admin user created with id ${adminUser.id}`);
})();
