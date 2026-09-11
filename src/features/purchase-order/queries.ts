/**
 * Purchase Order — query hooks (React Query).
 *
 * Uses createQueryKeys / createListQuery / createDetailQuery factories.
 */

import { createQueryKeys, createListQuery, createDetailQuery } from "@/lib/api/query-factory";
import {
  listPurchaseOrders,
  getPurchaseOrder,
  listReplenishmentProposals,
  type ListPoParams,
} from "./api";
import type { PurchaseOrder, ReplenishmentProposal } from "./types";

/* ── Query keys ──────────────────────────────────────────────────────── */

export const poKeys = createQueryKeys<ListPoParams>("purchase-orders");

export const replenishmentKeys = createQueryKeys<{
  page?: number;
  pageSize?: number;
}>("replenishment-proposals");

/* ── List hooks ──────────────────────────────────────────────────────── */

export const usePurchaseOrders = createListQuery<PurchaseOrder, ListPoParams>(
  poKeys,
  listPurchaseOrders,
);

export const useReplenishmentProposals = createListQuery<
  ReplenishmentProposal,
  { page?: number; pageSize?: number }
>(replenishmentKeys, listReplenishmentProposals);

/* ── Detail hooks ────────────────────────────────────────────────────── */

export const usePurchaseOrder = createDetailQuery<PurchaseOrder>(poKeys, getPurchaseOrder);
