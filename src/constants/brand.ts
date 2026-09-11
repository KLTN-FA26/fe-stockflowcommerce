/**
 * Brand assets.
 *
 * Logo dùng palette riêng (teal #0F766E → cyan #0891B2 → blue #2563EB) —
 * CỐ Ý không khớp design token của Mode A/B. Logo là ngoại lệ được chấp nhận:
 * palette thương hiệu sống độc lập với token UI, không kéo màu này vào component.
 * Xem .claude/rules/design-tokens.md — hex chỉ bị chặn trong src/app|components|features,
 * file SVG trong public/ nằm ngoài phạm vi đó.
 */
export const BRAND = {
  /** Wordmark đầy đủ + subtitle COMMERCE. Tỉ lệ gốc 900×260. */
  logoSrc: "/stockflowcommerce-logo.svg",
  /** Chỉ mark, không chữ — favicon, app icon, logo thu gọn. Tỉ lệ gốc 1:1. */
  iconSrc: "/stockflowcommerce-icon.svg",
  name: "StockFlowCommerce",
  /** Alt text cho bản có chữ — wordmark đã chứa tên nên alt nêu đúng tên thương hiệu. */
  logoAlt: "StockFlowCommerce",
} as const;

/**
 * Gradient của chữ "Flow" trong wordmark — chép đúng stop của `#sfcLogoWord`
 * trong public/stockflowcommerce-logo.svg để text HTML khớp với logo SVG.
 *
 * Đặt ở constants (không phải trong component) vì đây là hex của palette thương hiệu:
 * design-tokens.md cấm hex trần trong src/app|components|features. Tầng constants là
 * nơi duy nhất khai báo, component chỉ tiêu thụ qua biến này.
 */
export const BRAND_WORDMARK_GRADIENT = "linear-gradient(105deg, #0891B2 0%, #2563EB 100%)";

/** Tỉ lệ khung gốc của hai file SVG — dùng để tính width từ height, tránh méo ảnh. */
export const BRAND_ASPECT = {
  /** 900 / 260 */
  full: 900 / 260,
  /** vuông */
  mark: 1,
} as const;
