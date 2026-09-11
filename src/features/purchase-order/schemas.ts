/**
 * Purchase Order — zod schemas + BR traceability.
 *
 * Nguồn BR: docs/warehouse/02-purchase-order/README.md §6.
 * Status/lifecycle: src/lib/domain/lifecycle.ts (PO_TRANSITIONS).
 */

import { z } from "zod";

import { PO_STATUSES, PROPOSAL_STATUSES } from "@/constants";

/* ── Status enums ────────────────────────────────────────────────────── */

/** PO status — nguyên văn từ docs §5. */
export const poStatusValues = PO_STATUSES;

export const poStatusSchema = z.enum(poStatusValues);

/** Proposal status — nguyên văn từ docs §5. */
export const proposalStatusValues = PROPOSAL_STATUSES;

export const proposalStatusSchema = z.enum(proposalStatusValues);

/* ── PO Line schema ──────────────────────────────────────────────────── */

export const poLineSchema = z.object({
  lineId: z.string(),
  poId: z.string(),
  skuId: z.string(),
  orderedQty: z.number().int().positive("Số lượng phải > 0"),
  receivedQty: z.number().int().min(0),
  unitPrice: z.number().min(0, "Đơn giá không âm"),
  currency: z.enum(["VND", "USD", "CNY"]),
  taxRate: z.number().min(0).max(1, "Thuế suất 0–100%"),
  discountRate: z.number().min(0).max(1, "Chiết khấu 0–100%"),
  uom: z.enum(["pcs", "box", "kg", "m", "ream", "set"]),
  lineTotal: z.number().min(0),
});

/* ── PO schema (response DTO) ────────────────────────────────────────── */

export const purchaseOrderSchema = z.object({
  poId: z.string(),
  poNumber: z.string(),
  supplierId: z.string(),
  warehouseId: z.string(),
  status: poStatusSchema,
  currency: z.enum(["VND", "USD", "CNY"]),
  orderDate: z.string(), // ISODate
  expectedDate: z.string(), // ISODate
  createdBy: z.string(),
  approvedBy: z.string().optional(),
  approvalNote: z.string().optional(),
  rejectionReason: z.string().optional(),
  subtotal: z.number(),
  taxTotal: z.number(),
  grandTotal: z.number(),
  lines: z.array(poLineSchema),
  fromProposalId: z.string().optional(),
  revisionOf: z.string().optional(),
  notes: z.string().optional(),
});

/* ── Create PO input ─────────────────────────────────────────────────── */

export const poLineInputSchema = z.object({
  skuId: z.string().min(1, "Chọn SKU"),
  orderedQty: z.number().int().positive("Số lượng phải > 0"),
  unitPrice: z.number().min(0, "Đơn giá không âm"),
  taxRate: z.number().min(0).max(1),
  discountRate: z.number().min(0).max(1),
  uom: z.enum(["pcs", "box", "kg", "m", "ream", "set"]),
});

export const createPoSchema = z.object({
  supplierId: z.string().min(1, "Chọn nhà cung cấp"),
  warehouseId: z.string().min(1, "Chọn kho nhận"),
  currency: z.enum(["VND", "USD", "CNY"]),
  expectedDate: z.string().min(1, "Nhập ngày giao dự kiến"),
  lines: z
    .array(poLineInputSchema)
    // BR-01 (02-purchase-order): PO phải có ít nhất 1 dòng hàng (docs §3 Input)
    .min(1, "Phải có ít nhất 1 dòng hàng"),
  notes: z.string().optional(),
  fromProposalId: z.string().optional(),
});

/* ── Transition input ────────────────────────────────────────────────── */

export const transitionPoSchema = z.object({
  id: z.string(),
  targetStatus: poStatusSchema,
  reason: z.string().optional(),
});

/* ── Replenishment Proposal schema ───────────────────────────────────── */

export const replenishmentProposalSchema = z.object({
  proposalId: z.string(),
  skuId: z.string(),
  warehouseId: z.string(),
  suggestedQty: z.number().int().positive(),
  reason: z.string(),
  status: proposalStatusSchema,
  createdAt: z.string(),
  reviewedBy: z.string().optional(),
  convertedToPoId: z.string().optional(),
});

/* ── Inferred types (will replace mock-data re-exports when backend ready) ── */

export type PoStatusValue = z.infer<typeof poStatusSchema>;
export type ProposalStatusValue = z.infer<typeof proposalStatusSchema>;
export type PoLineDto = z.infer<typeof poLineSchema>;
export type PurchaseOrderDto = z.infer<typeof purchaseOrderSchema>;
export type CreatePoInput = z.infer<typeof createPoSchema>;
export type PoLineInput = z.infer<typeof poLineInputSchema>;
export type TransitionPoInput = z.infer<typeof transitionPoSchema>;
export type ReplenishmentProposalDto = z.infer<typeof replenishmentProposalSchema>;
