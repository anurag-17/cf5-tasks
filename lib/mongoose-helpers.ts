import { Types } from "mongoose";

/** Convert a string ID to a Mongoose ObjectId without unsafe casts. */
export function toObjectId(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

/** Read a populated document field's display name safely. */
export function populatedName(
  value: unknown,
  fallback = "—",
): string {
  if (value && typeof value === "object" && "name" in value) {
    const name = (value as { name?: string }).name;
    return name ?? fallback;
  }
  return fallback;
}
