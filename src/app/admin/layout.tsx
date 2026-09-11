import { BackofficeShell } from "@/components/backoffice/BackofficeShell";
import { RoleSwitcher } from "@/lib/auth/components/RoleSwitcher";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <BackofficeShell>
      {children}
      <RoleSwitcher />
    </BackofficeShell>
  );
}
