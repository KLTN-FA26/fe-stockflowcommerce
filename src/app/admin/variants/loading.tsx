import { AdminTableSkeleton } from "@/components/shared/AdminSkeletons";

export default function VariantsLoading() {
  return <AdminTableSkeleton columns={8} rows={10} showStats showConfigSummary />;
}
