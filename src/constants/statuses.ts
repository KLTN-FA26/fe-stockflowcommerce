export const PO_STATUSES = [
  "Draft",
  "Pending Approval",
  "Approved",
  "Confirmed",
  "Partially Received",
  "Received",
  "Closed",
  "Cancelled",
] as const;

export const PO_STATUS = {
  APPROVED: "Approved",
  CANCELLED: "Cancelled",
  CLOSED: "Closed",
  CONFIRMED: "Confirmed",
  DRAFT: "Draft",
  PARTIALLY_RECEIVED: "Partially Received",
  PENDING_APPROVAL: "Pending Approval",
  RECEIVED: "Received",
} as const satisfies Record<string, PoStatus>;

export const PROPOSAL_STATUSES = ["Draft Proposal", "Reviewed", "Converted"] as const;

export const PRODUCT_STATUSES = [
  "Draft",
  "Pending Approval",
  "Approved",
  "Active",
  "Published",
  "Inactive",
  "Discontinued",
] as const;

export const PRODUCT_STATUS = {
  ACTIVE: "Active",
  APPROVED: "Approved",
  DISCONTINUED: "Discontinued",
  DRAFT: "Draft",
  INACTIVE: "Inactive",
  PENDING_APPROVAL: "Pending Approval",
  PUBLISHED: "Published",
} as const satisfies Record<string, ProductStatus>;

export const SKU_STATUSES = ["Active", "Blocked", "Obsolete"] as const;

export const SKU_STATUS = {
  ACTIVE: "Active",
  BLOCKED: "Blocked",
  OBSOLETE: "Obsolete",
} as const satisfies Record<string, SkuStatus>;

export type PoStatus = (typeof PO_STATUSES)[number];
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];
export type SkuStatus = (typeof SKU_STATUSES)[number];
