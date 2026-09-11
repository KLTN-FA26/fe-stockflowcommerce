import { AdminFormSkeleton } from "@/components/shared/AdminSkeletons";

export default function ProductCreateLoading() {
  return <AdminFormSkeleton sections={4} fieldsPerSection={4} withSidebar />;
}
