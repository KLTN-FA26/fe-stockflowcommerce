import { Skeleton } from "@/components/ui/skeleton";

export default function ProductsLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-64" />
      </div>
      <Skeleton className="h-24 rounded-[var(--card-radius)]" />
      <Skeleton className="h-12 rounded-[var(--card-radius)]" />
      <Skeleton className="h-[520px] rounded-[var(--card-radius)]" />
    </div>
  );
}
