/** Escape user input before interpolating into a MongoDB `$regex` filter. */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Case-insensitive exact-match pattern (anchored) with metacharacters escaped. */
export function caseInsensitiveExactRegex(value: string): string {
  return `^${escapeRegex(value)}$`;
}
