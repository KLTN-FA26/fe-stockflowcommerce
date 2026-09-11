/**
 * Purchase Order — selectors (pure derivations).
 *
 * Mọi tính toán KPI / join lookup / filter / format sống ở đây.
 * Component chỉ gọi selector, không .filter()/.reduce() inline.
 *
 * Source: docs/warehouse/02-purchase-order §3 (Output), §4 (open quantity).
 */

import { PO_STATUS } from "@/constants";
import { formatCompact, formatMoney } from "@/lib/format";

import type { PurchaseOrder, PoLine, PoStatus } from "./types";

export { formatMoney };
export { formatCompact as formatCompactVND };

/* ── Single-record helpers ───────────────────────────────────────────── */

/**
 * Open quantity = ordered − received.
 * docs §3: "Số lượng còn chờ nhận (open quantity) tính theo từng dòng"
 */
export function openQuantity(line: PoLine): number {
  return Math.max(0, line.orderedQty - line.receivedQty);
}

/**
 * Whether a PO line is fully received.
 */
export function isLineFullyReceived(line: PoLine): boolean {
  return line.receivedQty >= line.orderedQty;
}

/**
 * Total open quantity across all lines of a PO.
 */
export function totalOpenQuantity(po: PurchaseOrder): number {
  return po.lines.reduce((sum, line) => sum + openQuantity(line), 0);
}

export function totalOrderedQuantity(po: PurchaseOrder): number {
  return po.lines.reduce((sum, line) => sum + line.orderedQty, 0);
}

export function totalReceivedQuantity(po: PurchaseOrder): number {
  return po.lines.reduce((sum, line) => sum + line.receivedQty, 0);
}

/**
 * Percentage received for a PO (0–100).
 */
export function receivedPercent(po: PurchaseOrder): number {
  const totalOrdered = po.lines.reduce((sum, line) => sum + line.orderedQty, 0);
  if (totalOrdered === 0) return 0;
  const totalReceived = po.lines.reduce((sum, line) => sum + line.receivedQty, 0);
  return Math.round((totalReceived / totalOrdered) * 100);
}

/* ── List-level stats ────────────────────────────────────────────────── */

export interface PoListStats {
  total: number;
  draft: number;
  pendingApproval: number;
  confirmed: number;
  partiallyReceived: number;
  received: number;
  closed: number;
  cancelled: number;
  totalValueVND: number;
}

/**
 * Compute stats from a list of POs.
 * Pure function — used by PurchaseOrderList component.
 */
export function computePoStats(list: readonly PurchaseOrder[]): PoListStats {
  const result: PoListStats = {
    total: list.length,
    draft: 0,
    pendingApproval: 0,
    confirmed: 0,
    partiallyReceived: 0,
    received: 0,
    closed: 0,
    cancelled: 0,
    totalValueVND: 0,
  };

  for (const po of list) {
    switch (po.status) {
      case PO_STATUS.DRAFT:
        result.draft++;
        break;
      case PO_STATUS.PENDING_APPROVAL:
        result.pendingApproval++;
        break;
      case PO_STATUS.CONFIRMED:
        result.confirmed++;
        break;
      case PO_STATUS.PARTIALLY_RECEIVED:
        result.partiallyReceived++;
        break;
      case PO_STATUS.RECEIVED:
        result.received++;
        break;
      case PO_STATUS.CLOSED:
        result.closed++;
        break;
      case PO_STATUS.CANCELLED:
        result.cancelled++;
        break;
    }

    if (po.currency === "VND") {
      result.totalValueVND += po.grandTotal;
    }
  }

  return result;
}

/* ── Row-level UI helpers ────────────────────────────────────────────── */

/** Statuses that should flag a row in the list table. */
const FLAGGED_STATUSES: readonly PoStatus[] = [PO_STATUS.PENDING_APPROVAL, PO_STATUS.CANCELLED];

export function shouldFlagPoRow(po: PurchaseOrder): boolean {
  return FLAGGED_STATUSES.includes(po.status);
}
