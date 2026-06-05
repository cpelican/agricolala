import { runErrorPagesWalkthrough } from "./flows/error-pages-walkthrough";
import { test } from "./support/test";

test("walkthrough: sign-in redirects and not-found page", async ({
	browser,
	page,
}) => {
	await runErrorPagesWalkthrough(browser, page);
});
