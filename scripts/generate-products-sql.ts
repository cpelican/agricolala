/**
 * Builds design-docs/product-research/products.sql from the researched product CSVs,
 * to paste into the production SQL terminal (seed.ts is only used locally).
 *
 * Usage: npm run products:sql
 *
 * The SQL only adds what is missing: a substance (matched by name) or product (matched by
 * brand + name) that already exists is left untouched, composition included. Substances in
 * EXISTING_SUBSTANCES are maintained directly in production, so the SQL only references them.
 *
 * Rows with include_in_sql = "no" are written as commented-out blocks that carry their own
 * substances and disease links, so uncommenting one block is enough to add that product.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const RESEARCH_DIR = join(process.cwd(), "design-docs", "product-research");
const CSV_FILES = ["organic-products.csv", "conventional-products.csv"];
const OUTPUT_FILE = join(RESEARCH_DIR, "products.sql");
const SUBSTANCE_SLOTS = [1, 2];
/** Already in production and maintained there: never created, updated or re-linked here. */
const EXISTING_SUBSTANCES = new Set([
	"Copper",
	"Sulfur",
	"Olio essenziale di arancio dolce",
]);
/**
 * Products that may already have been entered by hand in production: matched by name only
 * (case-insensitive, whatever the brand) and updated with the CSV values when found, their
 * doses included, instead of being skipped. Every other product is only added when missing.
 */
const UPSERT_PRODUCTS = new Set(["Prosper 300 CS"]);
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

function substancesSql(substances: SubstanceRow[]): string {
	if (substances.length === 0) return "";
	const values = substances
		.map(
			(s) =>
				`(gen_random_uuid(), ${sqlString(s.name)}, ${s.maxDosage}, 'KG_PER_HA', ${s.restrictedAtFlowering}, NOW(), NOW())`,
		)
		.join(",\n");
	return `INSERT INTO "Substance" (id, name, "maxDosage", "maxDosageUnitPerAreaUnit", "restrictedAtFlowering", "createdAt", "updatedAt") VALUES
${values}
ON CONFLICT (name) DO NOTHING;`;
}

/** "A" = Disease, "B" = Substance. */
function diseaseLinksSql(substances: SubstanceRow[]): string {
	const links = substances.flatMap((s) =>
		s.diseases.map(
			(disease) =>
				`(d.name = ${sqlString(disease)} AND s.name = ${sqlString(s.name)})`,
		),
	);
	if (links.length === 0) return "";
	return `INSERT INTO "_SubstanceDiseases" ("A", "B")
SELECT d.id, s.id
FROM "Disease" d, "Substance" s
WHERE ${links.join("\n   OR ")}
ON CONFLICT DO NOTHING;`;
}

function commentOut(sql: string): string {
	return sql
		.split("\n")
		.map((line) => (line === "" ? "--" : `-- ${line}`))
		.join("\n");
}

function buildProductsSql(rows: Record<string, string>[]): string {
	const substances = new Map<string, SubstanceRow>();
	const includedSubstances = new Set<string>();
	const productStatements: string[] = [];
	const excludedStatements: string[] = [];

	for (const row of rows) {
		const brand = column(row, "brand");
		const name = column(row, "name");
		const label = `${brand} / ${name}`;
		const includeValue = column(row, "include_in_sql");
		if (includeValue !== "yes" && includeValue !== "no") {
			throw new Error(`${label}: include_in_sql must be yes or no`);
		}
		const included = includeValue === "yes";
		const rowSubstances: SubstanceRow[] = [];
		const doseUnit = column(row, "doseUnit");
		if (!isDoseUnit(doseUnit))
			throw new Error(`${label}: unknown doseUnit "${doseUnit}"`);
		const rate = column(row, "productLiterToKiloGramConversionRate");
		if (doseUnit === "MILLILITER" && rate === "") {
			throw new Error(`${label}: MILLILITER product needs a conversion rate`);
		}

		const upsert = UPSERT_PRODUCTS.has(name);
		const productMatch = upsert
			? `lower(p.name) = lower(${sqlString(name)})`
			: `p.brand = ${sqlString(brand)} AND p.name = ${sqlString(name)}`;
		const unit = `${sqlString(doseUnit)}::"ProductDoseUnit"`;
		const conversionRate = sqlNumber(rate, label);
		const maxApplications = sqlInteger(column(row, "maxApplications"), label);
		const daysBetween = sqlInteger(
			column(row, "daysBetweenApplications"),
			label,
		);
		const doses: string[] = [];

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
			const known = EXISTING_SUBSTANCES.has(substanceName)
				? undefined
				: substances.get(substanceName);
			if (known && JSON.stringify(known) !== JSON.stringify(substance)) {
				throw new Error(
					`${substanceLabel}: "${substanceName}" differs from an earlier row`,
				);
			}
			if (!EXISTING_SUBSTANCES.has(substanceName)) {
				substances.set(substanceName, substance);
				rowSubstances.push(substance);
				if (included) includedSubstances.add(substanceName);
			}

			const dose = sqlNumber(
				column(row, `substance_${slot}_dose_percent`),
				substanceLabel,
			);
			if (dose === "NULL")
				throw new Error(`${substanceLabel}: dose_percent is required`);
			doses.push(`(${dose}, ${sqlString(substanceName)})`);
		}
		if (doses.length === 0) throw new Error(`${label}: no substance`);

		const comment = `-- ${label} (${column(row, "organic") === "yes" ? "organic" : "conventional"}; ${column(row, "countries")}; confidence: ${column(row, "data_confidence")}${upsert ? "; updated if it already exists" : ""})`;
		// An existing product is updated first (brand kept as entered), so the insert below
		// skips it; its doses are then updated or added.
		const update = upsert
			? `UPDATE "Product" p SET "doseUnit" = ${unit}, "productLiterToKiloGramConversionRate" = ${conversionRate}, "maxApplications" = ${maxApplications}, "daysBetweenApplications" = ${daysBetween}, "updatedAt" = NOW()
WHERE ${productMatch};
UPDATE "SubstanceDose" sd SET dose = v.dose, "updatedAt" = NOW()
FROM "Product" p, "Substance" s, (VALUES ${doses.join(", ")}) AS v(dose, name)
WHERE ${productMatch} AND s.name = v.name AND sd."productId" = p.id AND sd."substanceId" = s.id;
INSERT INTO "SubstanceDose" (id, dose, "substanceId", "productId", "createdAt", "updatedAt")
SELECT gen_random_uuid(), v.dose, s.id, p.id, NOW(), NOW()
FROM "Product" p, "Substance" s, (VALUES ${doses.join(", ")}) AS v(dose, name)
WHERE ${productMatch} AND s.name = v.name
  AND NOT EXISTS (SELECT 1 FROM "SubstanceDose" sd WHERE sd."productId" = p.id AND sd."substanceId" = s.id);
`
			: "";
		// Product has no unique key on brand + name, hence NOT EXISTS. The composition is
		// inserted from the RETURNING row only, so a skipped product is never modified.
		const productSql = `${update}WITH new_product AS (
  INSERT INTO "Product" (id, brand, name, "doseUnit", "productLiterToKiloGramConversionRate", "maxApplications", "daysBetweenApplications", "createdAt", "updatedAt")
  SELECT gen_random_uuid(), ${sqlString(brand)}, ${sqlString(name)}, ${unit}, ${conversionRate}, ${maxApplications}, ${daysBetween}, NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM "Product" p WHERE ${productMatch})
  RETURNING id
)
INSERT INTO "SubstanceDose" (id, dose, "substanceId", "productId", "createdAt", "updatedAt")
SELECT gen_random_uuid(), v.dose, s.id, np.id, NOW(), NOW()
FROM new_product np
CROSS JOIN (VALUES ${doses.join(", ")}) AS v(dose, name)
JOIN "Substance" s ON s.name = v.name;`;
		if (included) {
			productStatements.push(`${comment}\n${productSql}`);
		} else {
			const block = [
				substancesSql(rowSubstances),
				diseaseLinksSql(rowSubstances),
				productSql,
			]
				.filter((sql) => sql !== "")
				.join("\n");
			excludedStatements.push(`${comment}\n${commentOut(block)}`);
		}
	}

	const included = [...substances.values()].filter((s) =>
		includedSubstances.has(s.name),
	);

	const existingList = [...EXISTING_SUBSTANCES].map(sqlString).join(", ");

	return `-- Generated by scripts/generate-products-sql.ts from design-docs/product-research/*.csv.
-- Do not edit by hand: change the CSVs and run \`npm run products:sql\`.
--
-- Safe to run more than once: only what is missing is added (one exception below); nothing is deleted.
--   * substances are matched by name, products by brand + name;
--   * an existing product is left as is, composition included, except
--     ${[...UPSERT_PRODUCTS].map(sqlString).join(", ")}, matched by name only and updated if found;
--   * ${existingList} are only referenced
--     (maintained directly in production): the script stops if one is missing.
-- Diseases must already exist ("Oidium", "Peronospora"); missing ones are simply not linked.

BEGIN;

DO $$
BEGIN
  IF (SELECT count(*) FROM "Substance" WHERE name IN (${existingList})) <> ${EXISTING_SUBSTANCES.size} THEN
    RAISE EXCEPTION 'Missing one of the existing substances: %', ARRAY[${existingList}];
  END IF;
END $$;

-- Substances
${substancesSql(included)}

-- Substance <-> disease links
${diseaseLinksSql(included)}

-- Products, each created together with its composition (SubstanceDose.dose = % of active substance)
${productStatements.join("\n\n")}

-- Not included for now (include_in_sql = no). To add one, uncomment its whole block:
-- it creates the substances it needs too.
${excludedStatements.join("\n\n")}

COMMIT;
`;
}

function main() {
	const rows = CSV_FILES.flatMap((file) =>
		parseCsv(readFileSync(join(RESEARCH_DIR, file), "utf8")),
	);
	writeFileSync(OUTPUT_FILE, buildProductsSql(rows));
	const included = rows.filter(
		(row) => column(row, "include_in_sql") === "yes",
	);
	console.log(
		`Wrote ${included.length} products (${rows.length - included.length} commented out) to ${OUTPUT_FILE}`,
	);
}

if (process.argv[1]?.endsWith("generate-products-sql.ts")) {
	main();
}
