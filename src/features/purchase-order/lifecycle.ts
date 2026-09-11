/**
 * Purchase Order — lifecycle & action-gating.
 *
 * Re-exports transition table from domain/lifecycle.ts (single source of truth).
 * Adds `allowedPoActions()` for UI action-gating per status + role.
 *
 * Source: docs/warehouse/02-purchase-order §5 + §6.
 */

import {
  PO_TRANSITIONS,
  canTransition,
  isTerminal,
  allowedTransitions,
} from "@/lib/domain/lifecycle";
import { can } from "@/lib/auth/permissions";

import type { PoStatus } from "./types";
import type { RoleName } from "@/lib/auth/roles";
import type { Permission } from "@/lib/auth/permissions";

/* ── Re-exports ──────────────────────────────────────────────────────── */

export { PO_TRANSITIONS, canTransition, isTerminal, allowedTransitions };

/* ── Action definitions ──────────────────────────────────────────────── */

/** Actions the UI can gate per status + role. */
export interface PoAction {
  /** Unique action code. */
  readonly code: string;
  /** Button label. */
  readonly label: string;
  /** Permission required. */
  readonly permission: Permission;
  /** Statuses where this action is available. */
  readonly fromStatuses: readonly PoStatus[];
  /** Target status after action (undefined = non-transition action like "edit"). */
  readonly targetStatus?: PoStatus;
  /** Destructive action styling. */
  readonly destructive?: boolean;
}

/**
 * All PO actions, derived from docs §4 + §5.
 *
 * Each action maps to a permission from permissions.ts and a set of
 * source statuses from the transition table.
 */
export const PO_ACTIONS: readonly PoAction[] = [
  // docs §4.3: Procurement tạo Draft
  {
    code: "edit",
    label: "Chỉnh sửa",
    permission: "po.create",
    fromStatuses: ["Draft"],
  },
  // docs §4.7: Submit — vượt hạn mức → Pending Approval; dưới hạn mức → Approved
  {
    code: "submit",
    label: "Gửi duyệt",
    permission: "po.create",
    fromStatuses: ["Draft"],
    targetStatus: "Pending Approval",
  },
  // docs §4.7: Submit dưới hạn mức → tự Approved
  {
    code: "submit-auto-approve",
    label: "Phê duyệt & gửi",
    permission: "po.create",
    fromStatuses: ["Draft"],
    targetStatus: "Approved",
  },
  // docs §4.8: Approver duyệt
  {
    code: "approve",
    label: "Phê duyệt",
    permission: "po.approve",
    fromStatuses: ["Pending Approval"],
    targetStatus: "Approved",
  },
  // docs §4.8: Approver từ chối → về Draft
  {
    code: "reject",
    label: "Từ chối",
    permission: "po.approve",
    fromStatuses: ["Pending Approval"],
    targetStatus: "Draft",
    destructive: true,
  },
  // docs §4.9: Procurement chốt PO
  {
    code: "confirm",
    label: "Chốt PO",
    permission: "po.confirm",
    fromStatuses: ["Approved"],
    targetStatus: "Confirmed",
  },
  // docs §4.14: Đóng PO (normal close)
  {
    code: "close",
    label: "Đóng PO",
    permission: "po.confirm",
    fromStatuses: ["Received"],
    targetStatus: "Closed",
  },
  // docs §4.14: Force close (short-close)
  {
    code: "force-close",
    label: "Đóng sớm",
    permission: "po.confirm",
    fromStatuses: ["Confirmed", "Partially Received"],
    targetStatus: "Closed",
  },
  // docs §4.15: Huỷ PO
  // BR-05 (02-purchase-order): PO không thể Cancelled khi đã có Receipt
  {
    code: "cancel",
    label: "Huỷ PO",
    permission: "po.cancel",
    fromStatuses: ["Draft", "Approved", "Confirmed"],
    targetStatus: "Cancelled",
    destructive: true,
  },
] as const;

/* ── Action gating ───────────────────────────────────────────────────── */

/**
 * Return the list of actions available for a given PO status + user role.
 *
 * Checks:
 * 1. Action's `fromStatuses` includes current status.
 * 2. If action has `targetStatus`, the transition table allows it.
 * 3. User's role has the required permission.
 */
export function allowedPoActions(status: PoStatus, role: RoleName): readonly PoAction[] {
  return PO_ACTIONS.filter((action) => {
    // 1. Status gate
    if (!action.fromStatuses.includes(status)) return false;

    // 2. Transition gate (skip for non-transition actions like "edit")
    if (action.targetStatus && !canTransition(PO_TRANSITIONS, status, action.targetStatus)) {
      return false;
    }

    // 3. Permission gate
    return can(role, action.permission);
  });
}

/**
 * Check if the PO is in a terminal (final) state.
 */
export function isPoTerminal(status: PoStatus): boolean {
  return isTerminal(PO_TRANSITIONS, status);
}

/**
 * Get allowed next statuses from the transition table.
 */
export function nextPoStatuses(status: PoStatus): readonly PoStatus[] {
  return allowedTransitions(PO_TRANSITIONS, status);
}
