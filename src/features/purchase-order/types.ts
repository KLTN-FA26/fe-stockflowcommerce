/**
 * Purchase Order — types re-exported from mock-data.
 *
 * When backend is ready, these become the zod-inferred types from schemas.ts.
 * For now they reference mock-data types to stay in sync.
 */

export type {
  PurchaseOrder,
  PoLine,
  PoStatus,
  ReplenishmentProposal,
  ProposalStatus,
} from "@/lib/mock-data";
