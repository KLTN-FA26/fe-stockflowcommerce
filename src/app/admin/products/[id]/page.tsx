import { ProductDetail } from "@/features/product/components/ProductDetail";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <ProductDetail params={params} />;
}
