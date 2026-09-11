import { Boxes, ClipboardCheck, ScanLine } from "lucide-react";

import type { LucideIcon } from "lucide-react";

/** Copy của trang chủ — giữ nguyên văn bản bản cũ, không viết mới. */
const HOME_TITLE_LEAD = "Kiểm soát dòng hàng từ";
const HOME_TITLE_ACCENT = "nhập kho đến bàn giao.";

export const HOME_COPY = {
  eyebrow: "Cổng vận hành nội bộ",
  title: `${HOME_TITLE_LEAD} ${HOME_TITLE_ACCENT}`,
  titleLead: HOME_TITLE_LEAD,
  titleAccent: HOME_TITLE_ACCENT,
  description:
    "StockFlowCommerce tập trung dữ liệu mua hàng, tồn kho và hoàn tất đơn vào một không gian làm việc nhất quán cho đội ngũ vận hành.",
  ctaLabel: "Vào hệ thống",
  ctaHint: "Dành cho nhân sự được cấp quyền",
  loginLabel: "Đăng nhập",
  footerLeft: "© 2026 StockFlowCommerce",
  footerRight: "Hệ thống quản lý vận hành kho",
} as const;

interface HomeFeature {
  title: string;
  description: string;
  icon: LucideIcon;
}

/** Ba điểm chạm vận hành — giữ nguyên text từ page.tsx, chỉ nén layout thôi. */
export const HOME_FEATURES: readonly HomeFeature[] = [
  {
    title: "Nhập hàng có kiểm soát",
    description: "Theo dõi đơn đặt nhà cung cấp, phiếu nhận, kiểm tra và cất hàng trên một luồng.",
    icon: ClipboardCheck,
  },
  {
    title: "Tồn kho theo vị trí",
    description: "Quan sát sức chứa, điều chuyển và bổ sung hàng theo từng khu vực kho.",
    icon: Boxes,
  },
  {
    title: "Hoàn tất đơn chính xác",
    description: "Điều phối lấy hàng, đóng gói và bàn giao vận chuyển với trạng thái rõ ràng.",
    icon: ScanLine,
  },
] as const;

export type BinFill = "full" | "partial" | "empty";

/** Kích thước và tỉ lệ của kệ 3D. Đơn vị là world unit của three, không phải px. */
export const SCENE_GEOMETRY = {
  columns: 4,
  levels: 3,
  binWidth: 1,
  binDepth: 1,
  binGapX: 1.35,
  levelHeight: 1.1,
  /** Chiều cao khối hàng bên trong bin, theo mức lấp đầy. */
  fillHeight: { full: 0.72, partial: 0.38, empty: 0 } satisfies Record<BinFill, number>,
} as const;

/**
 * Phân bố mức lấp đầy của 12 bin.
 *
 * ĐÂY LÀ TRANG TRÍ THỊ GIÁC, KHÔNG PHẢI DỮ LIỆU TỒN KHO. Cùng tinh thần với luật
 * `<WarehouseMap>` (mode-a-backoffice.md §4.4): map 3D không phải nguồn sự thật tồn.
 * Scene không hiển thị bất kỳ con số, mã SKU hay nhãn định lượng nào.
 *
 * Viết tay thành hằng số thay vì random runtime: tránh hydration mismatch giữa SSR và
 * client, và tránh mỗi lần load lại ra một hình khác.
 * Đọc theo hàng: level 0 (dưới cùng) → level 2 (trên cùng), mỗi hàng 4 cột.
 */
const BIN_FILL_LAYOUT: readonly BinFill[][] = [
  ["full", "full", "partial", "full"],
  ["full", "partial", "full", "empty"],
  ["partial", "full", "empty", "full"],
] as const;

interface BinCell {
  id: string;
  column: number;
  level: number;
  fill: BinFill;
}

export const BIN_GRID: readonly BinCell[] = BIN_FILL_LAYOUT.flatMap((row, level) =>
  row.map((fill, column) => ({ id: `bin-${level}-${column}`, column, level, fill })),
);

/** Thông số chuyển động của scene. */
export const SCENE_TIMING = {
  /** Khoảng cách giữa hai lần một bin sáng lên trong chuỗi scan sweep. */
  scanIntervalMs: 2400,
  /** Thời gian một bin tắt dần sau khi sáng. */
  scanFadeMs: 900,
  /** Tốc độ auto-rotate quanh trục Y, rad/giây — rất chậm, không gây chóng mặt. */
  rotationSpeed: 0.15,
  /** Biên độ parallax theo chuột: ±8°. Giới hạn để góc isometric không bị phá. */
  parallaxMaxRad: (8 * Math.PI) / 180,
  /** Hệ số lerp mỗi frame cho parallax — càng nhỏ càng mượt và trễ. */
  parallaxDamping: 0.06,
  /** Quãng dịch chuyển camera theo parallax, world unit. */
  parallaxTravel: 4,
  /**
   * Fade-in của canvas khi scene sẵn sàng.
   * NGOẠI LỆ có chủ đích so với dải 120–180ms của Mode A (mode-a-backoffice.md §Motion):
   * đây là lần xuất hiện của một asset nặng, fade nhanh hơn sẽ giật.
   */
  canvasFadeMs: 400,
} as const;

/**
 * Vị trí camera orthographic, cố định ở góc isometric.
 * Dùng ở hai chỗ: prop `camera` của <Canvas> và gốc toạ độ cho phép tính parallax.
 */
export const CAMERA_POSITION: readonly [number, number, number] = [-6.4, 6.5, 17.6];
export const CAMERA_TARGET: readonly [number, number, number] = [1.2, 2.45, -6.4];
export const WAREHOUSE_CENTER_X = 3.8;
