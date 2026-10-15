import { NextResponse } from "next/server";
import { ZodError } from "zod";

export async function parseJson(
  req: Request,
  maxBytes = 1024 * 1024,
): Promise<unknown> {
  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > maxBytes) throw new Error("REQUEST_TOO_LARGE");
  const text = await req.text();
  if (Buffer.byteLength(text, "utf8") > maxBytes)
    throw new Error("REQUEST_TOO_LARGE");
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("INVALID_JSON");
  }
}
export function apiError(error: unknown) {
  if (error instanceof ZodError)
    return NextResponse.json(
      { error: "Invalid request", issues: error.issues },
      { status: 400 },
    );
  const message = error instanceof Error ? error.message : "INTERNAL";
  const status =
    message === "UNAUTHENTICATED"
      ? 401
      : message === "FORBIDDEN"
        ? 403
        : message === "NOT_FOUND"
          ? 404
          : message === "CONFLICT"
            ? 409
            : message === "RATE_LIMITED"
              ? 429
              : message === "PLAN_LIMIT"
                ? 402
                : message === "REQUEST_TOO_LARGE"
                  ? 413
                  : message === "INVALID_JSON"
                    ? 400
                    : message === "EMAIL_NOT_CONFIGURED" ||
                        message === "RATE_LIMIT_NOT_CONFIGURED" ||
                        message === "STRIPE_NOT_CONFIGURED"
                      ? 503
                      : (error as { code?: string })?.code === "P2002"
                        ? 409
                        : 500;
  if (status === 500) console.error("API error", error);
  return NextResponse.json(
    { error: status === 500 ? "Something went wrong" : message },
    { status },
  );
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
