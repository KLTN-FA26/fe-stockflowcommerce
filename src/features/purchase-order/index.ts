/**
 * Purchase Order — feature public API.
 *
 * Template for all feature modules. Other modules follow this pattern:
 *   types.ts    → re-export types from mock-data
 *   api.ts      → axios calls (list, detail, create, update, transition)
 *   queries.ts  → React Query hooks using factory (createListQuery, createDetailQuery)
 *   mutations.ts → mutation hooks using factory (createMutation, createTransitionMutation)
 *   index.ts    → barrel export
 */

// Types
export type {
  PurchaseOrder,
  PoLine,
  PoStatus,
  ReplenishmentProposal,
  ProposalStatus,
} from "./types";

// Query hooks
export {
  poKeys,
  replenishmentKeys,
  usePurchaseOrders,
  usePurchaseOrder,
  useReplenishmentProposals,
} from "./queries";

// Mutation hooks
export { useCreatePo, useUpdatePo, useTransitionPo } from "./mutations";

// API (for direct use in non-hook contexts)
export type { ListPoParams, CreatePoInput, TransitionPoInput } from "./api";
