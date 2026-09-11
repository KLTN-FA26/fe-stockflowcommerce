import { BackofficeShell } from "@/components/backoffice/BackofficeShell";
import { AuthGuard } from "@/lib/auth/components/AuthGuard";
import { RoleSwitcher } from "@/lib/auth/components/RoleSwitcher";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <BackofficeShell>
        {children}
        <RoleSwitcher />
      </BackofficeShell>
    </AuthGuard>
  );
}
