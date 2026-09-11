import { AdminTableSkeleton } from "@/components/shared/AdminSkeletons";

export default function ReplenishmentLoading() {
  return <AdminTableSkeleton columns={7} rows={10} showStats showConfigSummary />;
}
