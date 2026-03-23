/**
 * Extract a human-readable error message from API errors.
 *
 * Handles all FastAPI error shapes:
 *  - 422 validation: { detail: [{ msg: "...", loc: [...] }] }
 *  - Business logic:  { detail: "Email already exists" }
 *  - Axios wrapper:   Error with .message
 *  - Unknown:         fallback string
 *
 * Usage:
 *   catch (err) { toast.error(extractApiError(err, "Failed to save")); }
 *   onError: (err) => toast.error(extractApiError(err, "Action failed"))
 */
export function extractApiError(
  err: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  // 1. Axios-style error with response.data.detail
  const axErr = err as {
    response?: { data?: { detail?: unknown; message?: string }; status?: number };
  };
  const detail = axErr?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  // 2. FastAPI 422 validation array: [{ msg, loc, type }]
  if (Array.isArray(detail) && detail.length > 0) {
    const messages = detail
      .map((d: { msg?: string; loc?: unknown[] }) => {
        const field = Array.isArray(d.loc)
          ? String(d.loc[d.loc.length - 1])
          : undefined;
        const msg = d.msg ?? "";
        return field && field !== "body" ? `${field}: ${msg}` : msg;
      })
      .filter(Boolean);
    return messages.join(". ") || fallback;
  }

  // 3. Axios-style response.data.message
  if (axErr?.response?.data?.message) {
    return axErr.response.data.message;
  }

  // 4. Standard Error object (axios interceptor may normalize to this)
  if (err instanceof Error && err.message) {
    return err.message;
  }

  return fallback;
}
