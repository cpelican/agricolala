export const GRAMS_PER_KILOGRAM = 1_000;

export const Errors = {
	RESOURCE_NOT_FOUND: "Resource not found",
	UNAUTHORIZED: "Unauthorized",
	ACCESS_DENIED: "Access denied",
	INTERNAL_SERVER: "Internal server error",
};

// Access errors are meant for the caller; actions turn anything else into INTERNAL_SERVER.
export function isAccessError(error: unknown) {
	return (
		error instanceof Error &&
		(error.message === Errors.ACCESS_DENIED ||
			error.message === Errors.RESOURCE_NOT_FOUND)
	);
}

export const INVALID_SESSION_ID = "";
