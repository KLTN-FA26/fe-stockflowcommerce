import { AdminTableSkeleton } from "@/components/shared/AdminSkeletons";

export default function SuppliersLoading() {
  return <AdminTableSkeleton columns={9} rows={10} showStats showConfigSummary />;
}
