import { cookies } from "next/headers";
import { parseSidebarOpenCookie, SIDEBAR_COOKIE_NAME } from "@/lib/sidebar-persistence";

export async function getSidebarDefaultOpen(): Promise<boolean> {
  const cookieStore = await cookies();
  return parseSidebarOpenCookie(cookieStore.get(SIDEBAR_COOKIE_NAME)?.value);
}
