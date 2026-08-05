import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/mongoose";
import { requireApiRole } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api/handle-api-error";
import { ROLES } from "@/lib/constants/roles";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";
import { changePasswordSchema } from "@/lib/validations/auth";
import { User } from "@/models";

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiRole(ROLES);
    if (!auth.ok) return auth.response;

    const rateKey = `change-password:${auth.user.id}`;
    const rate = checkRateLimit(rateKey, { limit: RATE_LIMIT, windowMs: RATE_WINDOW_MS });

    if (!rate.ok) {
      console.warn("[change-password] rate_limited", {
        userId: auth.user.id,
        retryAfterSec: rate.retryAfterSec,
      });
      return NextResponse.json(
        {
          success: false,
          error: `Too many attempts. Try again in ${rate.retryAfterSec} seconds.`,
        },
        {
          status: 429,
          headers: { "Retry-After": String(rate.retryAfterSec) },
        },
      );
    }

    const body = await req.json();
    const parsed = changePasswordSchema.parse(body);

    await connectDB();

    const user = await User.findOne({ _id: auth.user.id, isActive: true }).select("+password");
    if (!user) {
      console.warn("[change-password] user_not_found", { userId: auth.user.id });
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const currentMatches = await bcrypt.compare(parsed.currentPassword, user.password);
    if (!currentMatches) {
      console.warn("[change-password] invalid_current", { userId: auth.user.id });
      return NextResponse.json(
        { success: false, error: "Current password is incorrect." },
        { status: 400 },
      );
    }

    user.password = await bcrypt.hash(parsed.newPassword, 10);
    await user.save();

    resetRateLimit(rateKey);
    console.info("[change-password] success", { userId: auth.user.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
