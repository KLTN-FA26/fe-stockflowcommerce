import { SkuDetail } from "@/features/product/components/SkuDetail";

export default function SkuDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <SkuDetail params={params} />;
}
