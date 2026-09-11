import { redirect } from "next/navigation";

import { ADMIN_ROUTES } from "@/constants";

export default function Home() {
  redirect(ADMIN_ROUTES.home);
}
