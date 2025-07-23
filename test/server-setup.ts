import { spawn } from "child_process";

import { getTestPrisma } from "./test-prisma-client";
import { cleanDatabase, seedTestData } from "./setup-utilities";

let serverProcess: any = null;
// Global setup runs only at first when launching tests
export default async function globalSetup() {
	const testPrisma = getTestPrisma();

	console.log("Setting up test environment...");

	await cleanDatabase();
	await seedTestData();

	console.log("Starting Next.js development server...");
	console.log("Current working directory:", process.cwd());
	console.log("Environment PORT:", process.env);

	serverProcess = spawn("npm", ["run", "dev"], {
		stdio: "pipe",
		env: process.env,
		cwd: process.cwd(),
	});

	// Wait for server to be ready
	await new Promise<void>((resolve, reject) => {
		const timeout = setTimeout(() => {
			reject(new Error("Server startup timeout"));
		}, 10_000);

		serverProcess.stdout?.on("data", (data: Buffer) => {
			const output = data.toString();
			if (
				output.includes("Ready") ||
				output.includes("started server") ||
				output.includes("Local:")
			) {
				clearTimeout(timeout);
				resolve();
			}
		});

		serverProcess.stderr?.on("data", (data: Buffer) => {
			const output = data.toString();
			console.log("Server stderr:", output);
			// Don't treat stderr as error for Next.js dev server
		});

		serverProcess.on("error", (error: Error) => {
			console.error("Failed to start server:", error);
			clearTimeout(timeout);
			reject(error);
		});
	});

	console.log("Next.js server started on port 3001");

	// Verify server is actually running
	try {
		const response = await fetch(
			`http://localhost:${process.env.PORT}/api/health`,
			{
				method: "GET",
				signal: AbortSignal.timeout(5000), // 5 second timeout
			},
		);
		console.log("Server health check response:", response.status);
	} catch (error) {
		console.log(
			"Server health check failed (this might be normal if no health endpoint):",
			error,
		);
	}

	console.log("=== GLOBAL SETUP COMPLETED ===");

	return async () => {
		await testPrisma.$disconnect();

		if (serverProcess) {
			console.log("Stopping Next.js server...");
			serverProcess.kill("SIGTERM");
			await new Promise((resolve) => {
				serverProcess.on("close", resolve);
			});
		}
	};
}
