import { disconnectE2ePrisma } from "./support/e2e-data";

export default async function globalTeardown() {
	await disconnectE2ePrisma();
}
