import { PurchaseOrderDetail } from "@/features/purchase-order/components/PurchaseOrderDetail";

export default function PurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <PurchaseOrderDetail params={params} />;
}
