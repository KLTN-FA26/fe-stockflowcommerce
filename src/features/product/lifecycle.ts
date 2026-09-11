/**
 * Product — lifecycle & action-gating.
 *
 * Source: docs/warehouse/01-product-creation §5 + §6.
 */

import { can } from "@/lib/auth/permissions";
import {
  PRODUCT_TRANSITIONS,
  SKU_TRANSITIONS,
  allowedTransitions,
  canTransition,
  isTerminal,
} from "@/lib/domain/lifecycle";

import type { Permission } from "@/lib/auth/permissions";
import type { RoleName } from "@/lib/auth/roles";
import type { ProductStatus, SkuStatus } from "./types";

export { PRODUCT_TRANSITIONS, SKU_TRANSITIONS, allowedTransitions, canTransition, isTerminal };

export interface ProductAction {
  readonly code: string;
  readonly label: string;
  readonly permission: Permission;
  readonly fromStatuses: readonly ProductStatus[];
  readonly targetStatus?: ProductStatus;
  readonly destructive?: boolean;
}

export interface SkuAction {
  readonly code: string;
  readonly label: string;
  readonly permission: Permission;
  readonly fromStatuses: readonly SkuStatus[];
  readonly targetStatus?: SkuStatus;
  readonly destructive?: boolean;
}

export const PRODUCT_ACTIONS: readonly ProductAction[] = [
  {
    code: "edit",
    label: "Chỉnh sửa",
    permission: "product.edit",
    fromStatuses: ["Draft", "Approved", "Active", "Published", "Inactive"],
  },
  // docs §4.8: Submit for review → Pending Approval.
  {
    code: "submit",
    label: "Gửi duyệt",
    permission: "product.edit",
    fromStatuses: ["Draft"],
    targetStatus: "Pending Approval",
  },
  // docs §4.9: Approve → Approved; reject returns Draft.
  {
    code: "approve",
    label: "Phê duyệt",
    permission: "product.approve",
    fromStatuses: ["Pending Approval"],
    targetStatus: "Approved",
  },
  {
    code: "reject",
    label: "Từ chối",
    permission: "product.approve",
    fromStatuses: ["Pending Approval"],
    targetStatus: "Draft",
    destructive: true,
  },
  // docs §4.10: Approved → Active.
  {
    code: "activate",
    label: "Kích hoạt",
    permission: "product.approve",
    fromStatuses: ["Approved", "Inactive", "Published"],
    targetStatus: "Active",
  },
  // BR-04 (01-product-creation): chỉ Published mới hiển thị trên catalog.
  // BR-05 (01-product-creation): Customizable phải có print area trước khi Published.
  {
    code: "publish",
    label: "Xuất bản",
    permission: "product.approve",
    fromStatuses: ["Active"],
    targetStatus: "Published",
  },
  {
    code: "deactivate",
    label: "Tạm ngừng",
    permission: "product.edit",
    fromStatuses: ["Active", "Published"],
    targetStatus: "Inactive",
    destructive: true,
  },
  // BR-02 (01-product-creation): không xoá product/SKU có tham chiếu; chỉ Inactive/Discontinued.
  {
    code: "discontinue",
    label: "Ngừng kinh doanh",
    permission: "product.edit",
    fromStatuses: ["Inactive"],
    targetStatus: "Discontinued",
    destructive: true,
  },
] as const;

export const SKU_ACTIONS: readonly SkuAction[] = [
  {
    code: "block",
    label: "Khoá SKU",
    permission: "product.edit",
    fromStatuses: ["Active"],
    targetStatus: "Blocked",
    destructive: true,
  },
  {
    code: "unblock",
    label: "Mở khoá SKU",
    permission: "product.edit",
    fromStatuses: ["Blocked"],
    targetStatus: "Active",
  },
  {
    code: "obsolete",
    label: "Ngừng dùng SKU",
    permission: "product.edit",
    fromStatuses: ["Active", "Blocked"],
    targetStatus: "Obsolete",
    destructive: true,
  },
] as const;

export function allowedProductActions(
  status: ProductStatus,
  role: RoleName,
): readonly ProductAction[] {
  return PRODUCT_ACTIONS.filter((action) => {
    if (!action.fromStatuses.includes(status)) return false;
    if (action.targetStatus && !canTransition(PRODUCT_TRANSITIONS, status, action.targetStatus)) {
      return false;
    }
    return can(role, action.permission);
  });
}

export function allowedSkuActions(status: SkuStatus, role: RoleName): readonly SkuAction[] {
  return SKU_ACTIONS.filter((action) => {
    if (!action.fromStatuses.includes(status)) return false;
    if (action.targetStatus && !canTransition(SKU_TRANSITIONS, status, action.targetStatus)) {
      return false;
    }
    return can(role, action.permission);
  });
}

export function isProductTerminal(status: ProductStatus): boolean {
  return isTerminal(PRODUCT_TRANSITIONS, status);
}

export function isSkuTerminal(status: SkuStatus): boolean {
  return isTerminal(SKU_TRANSITIONS, status);
}

export function nextProductStatuses(status: ProductStatus): readonly ProductStatus[] {
  return allowedTransitions(PRODUCT_TRANSITIONS, status);
}

export function nextSkuStatuses(status: SkuStatus): readonly SkuStatus[] {
  return allowedTransitions(SKU_TRANSITIONS, status);
}
