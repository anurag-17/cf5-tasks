import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { roleHomePath } from "@/lib/permissions";

// Pure router: send signed-in users to their role's home, everyone else to
// the login page. No UI of its own.
export default async function Home() {
  const user = await getCurrentUser();
  redirect(user ? roleHomePath(user.role) : "/login");
}
