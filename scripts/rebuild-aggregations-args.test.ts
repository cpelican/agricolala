import { describe, expect, test } from "vitest";
import { parseRebuildAggregationsArgs } from "./rebuild-aggregations-args";

describe("aggregations:rebuild arguments", () => {
	test("defaults to every user for the current year", () => {
		expect(parseRebuildAggregationsArgs([])).toEqual({
			year: new Date().getFullYear(),
		});
	});

	test("reads a user email and a year", () => {
		expect(
			parseRebuildAggregationsArgs([
				"--user",
				"grower@example.com",
				"--year",
				"2025",
			]),
		).toEqual({ user: "grower@example.com", year: 2025 });
	});

	test("rejects an invalid email, year or unknown option", () => {
		expect(() => parseRebuildAggregationsArgs(["--user", "nope"])).toThrow();
		expect(() => parseRebuildAggregationsArgs(["--year", "last"])).toThrow();
		expect(() => parseRebuildAggregationsArgs(["--all"])).toThrow();
	});
});
