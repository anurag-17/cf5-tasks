import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { ZodError } from "zod";

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: number }).code === 11000
  );
}

/** Map thrown errors from API route handlers to consistent JSON responses. */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    const message = error.issues[0]?.message ?? "Validation failed.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }

  if (error instanceof SyntaxError) {
    return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
  }

  if (error instanceof mongoose.Error.CastError) {
    return NextResponse.json({ success: false, error: "Invalid ID format." }, { status: 400 });
  }

  if (error instanceof mongoose.Error.ValidationError) {
    const message = Object.values(error.errors)[0]?.message ?? "Validation failed.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }

  if (isDuplicateKeyError(error)) {
    return NextResponse.json(
      { success: false, error: "A record with this value already exists." },
      { status: 409 },
    );
  }

  console.error("[API]", error);
  return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
}
