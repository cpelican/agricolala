import { getTestPrisma } from "./test-prisma-client";

import { createServer } from "http";
import { parse } from "url";
import next from "next";

export default async function globalSetup() {
	const testPrisma = getTestPrisma();
	const dev = process.env.NODE_ENV !== "production";
	const app = next({ dev });
	const handle = app.getRequestHandler();

	await app.prepare();

	const server = createServer(async (req, res) => {
		try {
			const parsedUrl = parse(req.url!, true);
			await handle(req, res, parsedUrl);
		} catch (err) {
			console.error("Error occurred handling", req.url, err);
			res.statusCode = 500;
			res.end("internal server error");
		}
	});

	await new Promise<void>((resolve) => {
		server.listen(process.env.PORT, () => {
			console.info(`> Ready on http://localhost:${process.env.PORT}`);
			resolve();
		});
	});

	return async () => {
		await testPrisma.$disconnect();
		server.close();
	};
}
