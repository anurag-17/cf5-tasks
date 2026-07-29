export const SIDEBAR_COOKIE_NAME = "sidebar_state";
export const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

/** `true` = expanded, `false` = collapsed. Defaults to expanded when unset. */
export function parseSidebarOpenCookie(value: string | undefined): boolean {
  if (value === undefined) return true;
  return value === "true";
}
