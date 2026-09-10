import { BackofficeShell } from "@/components/backoffice/BackofficeShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <BackofficeShell>{children}</BackofficeShell>;
}
