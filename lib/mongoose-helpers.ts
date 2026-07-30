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

/** Read a populated ref's id, or stringify a raw ObjectId/string. */
export function populatedId(value: unknown): string {
  if (value && typeof value === "object" && "_id" in value) {
    return String((value as { _id: unknown })._id);
  }
  return String(value ?? "");
}
