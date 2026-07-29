import mongoose from "mongoose";

const cached = (global.mongooseCache ??= { conn: null, promise: null });

/**
 * Reuses a single connection across hot-reloads (dev) and warm serverless
 * invocations (prod) instead of opening a new one per call.
 */
export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("Missing MONGODB_URI environment variable");
    }

    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10_000,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}
