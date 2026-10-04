import { PrismaClient } from "@prisma/client";
import {
	DISEASE_STAGE_SENSITIVITY_MATRIX,
	getStageSensitivityRows,
} from "../lib/disease-stage-sensitivity";

// Writes the sensitivity matrix for the diseases already in the database, without
// touching any other data (unlike `npm run seed`). Safe to run several times.
const prismaClient = new PrismaClient();

(async () => {
	try {
		for (const name of ["Peronospora", "Oidium"] as const) {
			const disease = await prismaClient.disease.findUnique({
				where: { name },
				select: { id: true },
			});
			if (!disease) {
				console.warn(`Disease ${name} not found, skipped`);
				continue;
			}
			for (const { stage, level } of getStageSensitivityRows(name)) {
				await prismaClient.diseaseStageSensitivity.upsert({
					where: { diseaseId_stage: { diseaseId: disease.id, stage } },
					create: { diseaseId: disease.id, stage, level },
					update: { level },
				});
			}
			console.info(
				`${name}: ${Object.keys(DISEASE_STAGE_SENSITIVITY_MATRIX[name]).length} stages written`,
			);
		}
	} finally {
		await prismaClient.$disconnect();
	}
})();
