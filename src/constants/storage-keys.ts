export const STORAGE_KEYS = {
  /** Zustand persist key for auth store (localStorage) */
  auth: "stockflow-auth",
  /** Cookie name for auth token (bridges localStorage ↔ Edge middleware) */
  authCookie: "stockflow-auth-token",
  adminProductsConfig: "stockflow:admin:products:config",
  adminPurchaseOrdersConfig: "stockflow:admin:purchase-orders:config",
  adminVariantsConfig: "stockflow:admin:variants:config",
} as const;
