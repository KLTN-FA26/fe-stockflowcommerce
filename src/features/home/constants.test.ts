import { describe, expect, it } from "vitest";

import { BIN_GRID, HOME_FEATURES, SCENE_GEOMETRY, SCENE_TIMING } from "./constants";

describe("BIN_GRID (spec §4 — trang trí, không phải dữ liệu tồn)", () => {
  it("sinh đúng columns × levels bin", () => {
    expect(BIN_GRID).toHaveLength(SCENE_GEOMETRY.columns * SCENE_GEOMETRY.levels);
  });

  it("mọi id là duy nhất", () => {
    const ids = new Set(BIN_GRID.map((bin) => bin.id));
    expect(ids.size).toBe(BIN_GRID.length);
  });

  it("phân bố fill là hằng số — hai lần đọc cho kết quả identical (không random runtime)", () => {
    const first = BIN_GRID.map((bin) => bin.fill).join(",");
    const second = BIN_GRID.map((bin) => bin.fill).join(",");
    expect(first).toBe(second);
  });

  it("có đủ cả ba trạng thái fill để scene không đơn điệu", () => {
    const fills = new Set(BIN_GRID.map((bin) => bin.fill));
    expect(fills).toEqual(new Set(["full", "partial", "empty"]));
  });

  it("column và level nằm trong biên hình học", () => {
    for (const bin of BIN_GRID) {
      expect(bin.column).toBeGreaterThanOrEqual(0);
      expect(bin.column).toBeLessThan(SCENE_GEOMETRY.columns);
      expect(bin.level).toBeGreaterThanOrEqual(0);
      expect(bin.level).toBeLessThan(SCENE_GEOMETRY.levels);
    }
  });
});

describe("SCENE_TIMING (spec §5 — Mode A 120–180ms, canvas 400ms là ngoại lệ)", () => {
  it("canvas fade đúng 400ms theo ngoại lệ đã ghi trong spec", () => {
    expect(SCENE_TIMING.canvasFadeMs).toBe(400);
  });

  it("parallax giới hạn ±8° để user không kéo lệch góc nhìn", () => {
    expect(SCENE_TIMING.parallaxMaxRad).toBeCloseTo((8 * Math.PI) / 180, 5);
  });
});

describe("HOME_FEATURES", () => {
  it("có đúng 3 thẻ để vừa một hàng trong khung hình", () => {
    expect(HOME_FEATURES).toHaveLength(3);
  });

  it("description khớp nguyên văn từ src/app/page.tsx (không được sửa copy)", () => {
    const expectedDescriptions = [
      "Theo dõi đơn đặt nhà cung cấp, phiếu nhận, kiểm tra và cất hàng trên một luồng.",
      "Quan sát sức chứa, điều chuyển và bổ sung hàng theo từng khu vực kho.",
      "Điều phối lấy hàng, đóng gói và bàn giao vận chuyển với trạng thái rõ ràng.",
    ];

    HOME_FEATURES.forEach((feature, index) => {
      expect(feature.description).toBe(expectedDescriptions[index]);
    });
  });
});
