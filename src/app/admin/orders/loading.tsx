import { AdminTableSkeleton } from "@/components/shared/AdminSkeletons";

export default function OrdersLoading() {
  return <AdminTableSkeleton columns={8} rows={10} showStats showConfigSummary />;
}
