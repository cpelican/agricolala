/**
 * Builds design-docs/product-research/products.sql from the researched product CSVs,
 * to paste into the production SQL terminal (seed.ts is only used locally).
 *
 * Usage: npm run products:sql
 *
 * The SQL is idempotent and never deletes or overwrites: substances that already exist
 * (matched by name, e.g. Copper, Sulfur) keep their current values, and a product is
 * skipped when one with the same brand and name already exists.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const RESEARCH_DIR = join(process.cwd(), "design-docs", "product-research");
const CSV_FILES = ["organic-products.csv", "conventional-products.csv"];
const OUTPUT_FILE = join(RESEARCH_DIR, "products.sql");
const SUBSTANCE_SLOTS = [1, 2];
const DOSE_UNITS = ["GRAM", "MILLILITER"] as const;
type DoseUnit = (typeof DOSE_UNITS)[number];

/** Parses RFC 4180 CSV (quoted fields, escaped quotes, commas/newlines in quotes). */
function parseCsv(text: string): Record<string, string>[] {
	const rows: string[][] = [];
	let row: string[] = [];
	let field = "";
	let inQuotes = false;
	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		if (inQuotes) {
			if (char === '"' && text[i + 1] === '"') {
				field += '"';
				i++;
			} else if (char === '"') {
				inQuotes = false;
			} else {
				field += char;
			}
		} else if (char === '"') {
			inQuotes = true;
		} else if (char === ",") {
			row.push(field);
			field = "";
		} else if (char === "\n" || char === "\r") {
			if (char === "\r" && text[i + 1] === "\n") i++;
			row.push(field);
			rows.push(row);
			row = [];
			field = "";
		} else {
			field += char;
		}
	}
	if (field !== "" || row.length > 0) {
		row.push(field);
		rows.push(row);
	}
	const [header, ...data] = rows;
	if (!header) return [];
	return data.map((cells) => {
		if (cells.length !== header.length) {
			throw new Error(
				`CSV row has ${cells.length} cells, expected ${header.length}: ${cells.join(",")}`,
			);
		}
		return Object.fromEntries(header.map((name, i) => [name, cells[i] ?? ""]));
	});
}

function column(row: Record<string, string>, name: string): string {
	const value = row[name];
	if (value === undefined) throw new Error(`Missing CSV column "${name}"`);
	return value.trim();
}

function sqlString(value: string): string {
	return `'${value.replaceAll("'", "''")}'`;
}

function sqlNumber(value: string, label: string): string {
	if (value === "") return "NULL";
	const number = Number(value);
	if (!Number.isFinite(number))
		throw new Error(`${label}: "${value}" is not a number`);
	return String(number);
}

function sqlInteger(value: string, label: string): string {
	const number = sqlNumber(value, label);
	if (number !== "NULL" && !Number.isInteger(Number(number))) {
		throw new Error(`${label}: "${value}" is not an integer`);
	}
	return number;
}

function sqlBoolean(value: string, label: string): string {
	if (value === "true" || value === "false") return value;
	throw new Error(`${label}: "${value}" is not true/false`);
}

function isDoseUnit(value: string): value is DoseUnit {
	return DOSE_UNITS.some((unit) => unit === value);
}

interface SubstanceRow {
	name: string;
	maxDosage: string;
	restrictedAtFlowering: string;
	diseases: string[];
}

function buildProductsSql(rows: Record<string, string>[]): string {
	const substances = new Map<string, SubstanceRow>();
	const productStatements: string[] = [];

	for (const row of rows) {
		const brand = column(row, "brand");
		const name = column(row, "name");
		const label = `${brand} / ${name}`;
		const doseUnit = column(row, "doseUnit");
		if (!isDoseUnit(doseUnit))
			throw new Error(`${label}: unknown doseUnit "${doseUnit}"`);
		const rate = column(row, "productLiterToKiloGramConversionRate");
		if (doseUnit === "MILLILITER" && rate === "") {
			throw new Error(`${label}: MILLILITER product needs a conversion rate`);
		}

		const productMatch = `p.brand = ${sqlString(brand)} AND p.name = ${sqlString(name)}`;
		const statements = [
			`-- ${label} (${column(row, "organic") === "yes" ? "organic" : "conventional"}; ${column(row, "countries")}; confidence: ${column(row, "data_confidence")})`,
			`INSERT INTO "Product" (id, brand, name, "doseUnit", "productLiterToKiloGramConversionRate", "maxApplications", "daysBetweenApplications", "createdAt", "updatedAt")
SELECT gen_random_uuid(), ${sqlString(brand)}, ${sqlString(name)}, ${sqlString(doseUnit)}::"ProductDoseUnit", ${sqlNumber(rate, label)}, ${sqlInteger(column(row, "maxApplications"), label)}, ${sqlInteger(column(row, "daysBetweenApplications"), label)}, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Product" p WHERE ${productMatch});`,
		];

		for (const slot of SUBSTANCE_SLOTS) {
			const substanceName = column(row, `substance_${slot}_name`);
			if (substanceName === "") continue;
			const substanceLabel = `${label} substance ${slot}`;
			const substance: SubstanceRow = {
				name: substanceName,
				maxDosage: sqlNumber(
					column(row, `substance_${slot}_maxDosage_kg_ha_year`),
					substanceLabel,
				),
				restrictedAtFlowering: sqlBoolean(
					column(row, `substance_${slot}_restrictedAtFlowering`),
					substanceLabel,
				),
				diseases: column(row, `substance_${slot}_diseases`)
					.split("|")
					.map((disease) => disease.trim())
					.filter((disease) => disease !== ""),
			};
			if (substance.maxDosage === "NULL") {
				throw new Error(`${substanceLabel}: maxDosage is required`);
			}
			const known = substances.get(substanceName);
			if (known && JSON.stringify(known) !== JSON.stringify(substance)) {
				throw new Error(
					`${substanceLabel}: "${substanceName}" differs from an earlier row`,
				);
			}
			substances.set(substanceName, substance);

			const dose = sqlNumber(
				column(row, `substance_${slot}_dose_percent`),
				substanceLabel,
			);
			if (dose === "NULL")
				throw new Error(`${substanceLabel}: dose_percent is required`);
			statements.push(`INSERT INTO "SubstanceDose" (id, dose, "substanceId", "productId", "createdAt", "updatedAt")
SELECT gen_random_uuid(), ${dose}, s.id, p.id, NOW(), NOW()
FROM "Substance" s, "Product" p
WHERE s.name = ${sqlString(substanceName)} AND ${productMatch}
  AND NOT EXISTS (SELECT 1 FROM "SubstanceDose" sd WHERE sd."substanceId" = s.id AND sd."productId" = p.id);`);
		}
		productStatements.push(statements.join("\n"));
	}

	const substanceValues = [...substances.values()]
		.map(
			(s) =>
				`(gen_random_uuid(), ${sqlString(s.name)}, ${s.maxDosage}, 'KG_PER_HA', ${s.restrictedAtFlowering}, NOW(), NOW())`,
		)
		.join(",\n");
	const diseaseLinks = [...substances.values()]
		.flatMap((s) =>
			s.diseases.map(
				(disease) =>
					`(d.name = ${sqlString(disease)} AND s.name = ${sqlString(s.name)})`,
			),
		)
		.join("\n   OR ");

	return `-- Generated by scripts/generate-products-sql.ts from design-docs/product-research/*.csv.
-- Do not edit by hand: change the CSVs and run \`npm run products:sql\`.
--
-- Safe to run more than once. Nothing is deleted or overwritten:
--   * substances already present (matched by name) keep their maxDosage/flowering values;
--   * products are matched by brand + name and skipped if they already exist.
-- Diseases must already exist ("Oidium", "Peronospora"); missing ones are simply not linked.

BEGIN;

-- Substances
INSERT INTO "Substance" (id, name, "maxDosage", "maxDosageUnitPerAreaUnit", "restrictedAtFlowering", "createdAt", "updatedAt") VALUES
${substanceValues}
ON CONFLICT (name) DO NOTHING;

-- Substance <-> disease links ("A" = Disease, "B" = Substance)
INSERT INTO "_SubstanceDiseases" ("A", "B")
SELECT d.id, s.id
FROM "Disease" d, "Substance" s
WHERE ${diseaseLinks}
ON CONFLICT DO NOTHING;

-- Products and their composition (SubstanceDose.dose = % of active substance)
${productStatements.join("\n\n")}

COMMIT;
`;
}

function main() {
	const rows = CSV_FILES.flatMap((file) =>
		parseCsv(readFileSync(join(RESEARCH_DIR, file), "utf8")),
	);
	writeFileSync(OUTPUT_FILE, buildProductsSql(rows));
	console.log(`Wrote ${rows.length} products to ${OUTPUT_FILE}`);
}

if (process.argv[1]?.endsWith("generate-products-sql.ts")) {
	main();
}
