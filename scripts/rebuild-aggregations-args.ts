import { parseArgs } from "node:util";
import { z } from "zod";

const rebuildAggregationsArgsSchema = z
	.object({
		user: z.string().email().optional(),
		year: z.coerce
			.number()
			.int()
			.min(2000)
			.max(2100)
			.default(() => new Date().getFullYear()),
	})
	.strict();

export type RebuildAggregationsArgs = z.infer<
	typeof rebuildAggregationsArgsSchema
>;

/** `[--user <email>] [--year <yyyy>]`, as passed after `npm run aggregations:rebuild --`. */
export function parseRebuildAggregationsArgs(argv: string[]) {
	const { values } = parseArgs({
		args: argv,
		options: {
			user: { type: "string" },
			year: { type: "string" },
		},
		strict: true,
	});
	return rebuildAggregationsArgsSchema.parse(values);
}
