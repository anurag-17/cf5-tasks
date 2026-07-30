import { redirect } from "next/navigation";

/** Legacy My Day route — keep redirect so old bookmarks still work. */
export default function EmployeeSchedulePage() {
  redirect("/employee/tasks");
}
