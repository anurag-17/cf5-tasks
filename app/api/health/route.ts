import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/models/User";

/** Lightweight deploy check — confirms required env vars are present (not their values). */
export async function GET() {
  const hasMongoUri = Boolean(process.env.MONGODB_URI);
  const hasAuthSecret = Boolean(process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET);

  let dbOk = false;
  let userCount: number | null = null;
  let dbError: string | null = null;

  if (hasMongoUri) {
    try {
      await connectDB();
      userCount = await User.countDocuments();
      dbOk = true;
    } catch (error) {
      dbError = error instanceof Error ? error.message : "Database connection failed";
    }
  }

  return NextResponse.json({
    ok: hasMongoUri && hasAuthSecret && dbOk,
    hasMongoUri,
    hasAuthSecret,
    dbOk,
    userCount,
    dbError,
    authUrl: process.env.AUTH_URL ?? null,
  });
}
