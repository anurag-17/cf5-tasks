import type mongoose from "mongoose";

declare global {
  // Cached across hot-reloads in dev so we don't open a new connection per request.
  var mongooseCache:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

export {};
