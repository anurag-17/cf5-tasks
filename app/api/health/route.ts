import { NextResponse } from "next/server";

/** Lightweight deploy check — confirms required env vars are present (not their values). */
export async function GET() {
  return NextResponse.json({
    ok: Boolean(process.env.MONGODB_URI && (process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET)),
    hasMongoUri: Boolean(process.env.MONGODB_URI),
    hasAuthSecret: Boolean(process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET),
    authUrl: process.env.AUTH_URL ?? null,
  });
}
