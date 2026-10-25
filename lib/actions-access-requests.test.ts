import { beforeEach, describe, expect, test, vi } from "vitest";
import { getServerSession } from "next-auth";
import { type PrismaClient } from "@prisma/client";
import { cleanDatabase } from "@/test/setup-utilities";
import { getTestPrisma } from "@/test/test-prisma-client";
import { notifyAdminOfAccessRequest, sendAccessGrantedEmail } from "./email";
import { approveAccessRequest, requestAccess } from "./actions-access-requests";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
// No network in tests: the email helper is replaced.
vi.mock("./email", () => ({
	notifyAdminOfAccessRequest: vi.fn(),
	sendAccessGrantedEmail: vi.fn(),
}));

const message = "I grow two hectares of Vermentino near Sarzana.";
const adminEmail = "admin@agricolala.test";

const formDataOf = (fields: Record<string, string>) => {
	const formData = new FormData();
	for (const [key, value] of Object.entries(fields)) {
		formData.set(key, value);
	}
	return formData;
};

const signInAs = (user: {
	id: string;
	email: string;
	isAuthorized: boolean;
}) => {
	vi.mocked(getServerSession).mockResolvedValue({
		expires: new Date(Date.now() + 60_000).toISOString(),
		user: { ...user, locale: "en" },
	});
};

describe("[Integration] access requests", () => {
	let prisma: PrismaClient;

	beforeEach(async () => {
		prisma = getTestPrisma();
		await cleanDatabase();
		vi.mocked(getServerSession).mockReset();
		vi.mocked(notifyAdminOfAccessRequest).mockReset().mockResolvedValue("sent");
		vi.mocked(sendAccessGrantedEmail).mockReset().mockResolvedValue("sent");
	});

	const createUser = (email: string, isAuthorized: boolean) =>
		prisma.user.create({
			data: { email, name: "Ada", isAuthorized, locale: "en" },
		});

	describe("requestAccess", () => {
		test("saves one request and emails me once, however often it is sent", async () => {
			const user = await createUser("ada@example.com", false);
			signInAs(user);

			const first = await requestAccess(
				{ status: "idle" },
				formDataOf({ message, locale: "it" }),
			);
			const second = await requestAccess(
				{ status: "idle" },
				formDataOf({
					message: "A second, different introduction.",
					locale: "it",
				}),
			);

			expect(first.status).toBe("sent");
			expect(second).toEqual(first);
			const requests = await prisma.accessRequest.findMany();
			expect(requests).toHaveLength(1);
			expect(requests[0]).toMatchObject({ userId: user.id, message });
			expect(notifyAdminOfAccessRequest).toHaveBeenCalledTimes(1);
			expect(notifyAdminOfAccessRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					email: "ada@example.com",
					locale: "it",
					message,
				}),
			);
			// The "you're in" email will use the language they wrote in.
			const updated = await prisma.user.findUniqueOrThrow({
				where: { id: user.id },
			});
			expect(updated.locale).toBe("it");
		});

		test("refuses accounts that are already open, and visitors without a session", async () => {
			const user = await createUser("ada@example.com", true);
			signInAs(user);
			expect(
				await requestAccess(
					{ status: "idle" },
					formDataOf({ message, locale: "en" }),
				),
			).toEqual({ status: "error", error: "generic" });

			vi.mocked(getServerSession).mockResolvedValue(null);
			expect(
				await requestAccess(
					{ status: "idle" },
					formDataOf({ message, locale: "en" }),
				),
			).toEqual({ status: "error", error: "generic" });

			expect(await prisma.accessRequest.count()).toBe(0);
			expect(notifyAdminOfAccessRequest).not.toHaveBeenCalled();
		});

		test("rejects a message that is too short", async () => {
			const user = await createUser("ada@example.com", false);
			signInAs(user);

			expect(
				await requestAccess(
					{ status: "idle" },
					formDataOf({ message: "Hi!", locale: "en" }),
				),
			).toEqual({ status: "error", error: "tooShort" });
			expect(await prisma.accessRequest.count()).toBe(0);
		});

		test("keeps the request and reports success when the email fails", async () => {
			const user = await createUser("ada@example.com", false);
			signInAs(user);
			vi.mocked(notifyAdminOfAccessRequest).mockResolvedValue("failed");

			const result = await requestAccess(
				{ status: "idle" },
				formDataOf({ message, locale: "en" }),
			);

			expect(result.status).toBe("sent");
			expect(await prisma.accessRequest.count()).toBe(1);
		});
	});

	describe("approveAccessRequest", () => {
		const createPendingRequest = async () => {
			const user = await createUser("ada@example.com", false);
			await prisma.accessRequest.create({ data: { userId: user.id, message } });
			return user;
		};

		test("refuses anyone who is not in AdminUser", async () => {
			const pending = await createPendingRequest();
			const someone = await createUser("someone@example.com", true);
			signInAs(someone);

			expect(
				await approveAccessRequest(
					{ status: "idle" },
					formDataOf({ userId: pending.id }),
				),
			).toEqual({ status: "error" });

			const user = await prisma.user.findUniqueOrThrow({
				where: { id: pending.id },
			});
			expect(user.isAuthorized).toBe(false);
			expect(sendAccessGrantedEmail).not.toHaveBeenCalled();
		});

		test("opens the account, marks the request reviewed and emails the user", async () => {
			const pending = await createPendingRequest();
			const admin = await createUser(adminEmail, true);
			await prisma.adminUser.create({ data: { email: adminEmail } });
			signInAs(admin);

			const result = await approveAccessRequest(
				{ status: "idle" },
				formDataOf({ userId: pending.id }),
			);

			expect(result).toEqual({
				status: "approved",
				name: "Ada",
				emailSent: true,
			});
			const user = await prisma.user.findUniqueOrThrow({
				where: { id: pending.id },
				include: { accessRequest: true },
			});
			expect(user.isAuthorized).toBe(true);
			expect(user.accessRequest?.reviewedAt).toBeInstanceOf(Date);
			expect(sendAccessGrantedEmail).toHaveBeenCalledWith({
				email: "ada@example.com",
				name: "Ada",
				locale: "en",
			});
		});

		test("approves anyway when the email can't be sent", async () => {
			const pending = await createPendingRequest();
			const admin = await createUser(adminEmail, true);
			await prisma.adminUser.create({ data: { email: adminEmail } });
			signInAs(admin);
			vi.mocked(sendAccessGrantedEmail).mockResolvedValue("skipped");

			expect(
				await approveAccessRequest(
					{ status: "idle" },
					formDataOf({ userId: pending.id }),
				),
			).toEqual({ status: "approved", name: "Ada", emailSent: false });
			const user = await prisma.user.findUniqueOrThrow({
				where: { id: pending.id },
			});
			expect(user.isAuthorized).toBe(true);
		});
	});
});
