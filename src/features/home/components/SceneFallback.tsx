import { cn } from "cn";

import { BIN_GRID } from "../constants";

/**
 * Đứng thay chỗ scene 3D trong hai tình huống:
 * 1. Đang lazy-load `three` (bundle chưa về).
 * 2. WebGL không khả dụng — máy ảo, GPU bị blacklist.
 *
 * Chiếm đúng chỗ của canvas nên không gây layout shift khi scene thật xuất hiện.
 */
export function SceneFallback() {
  return (
    <div
      className="border-border-default bg-bg-subtle flex h-full w-full items-center justify-center rounded-[var(--r-md)] border"
      role="img"
      aria-label="Minh hoạ kệ kho nhiều tầng"
    >
      <div className="grid w-full max-w-xs grid-cols-4 gap-2 p-8">
        {BIN_GRID.map((bin) => (
          <div
            key={bin.id}
            className={cn(
              "aspect-square rounded-[var(--r-sm)] border",
              bin.fill === "empty"
                ? "border-border-default bg-transparent"
                : "border-border-strong bg-bg-muted",
            )}
          />
        ))}
      </div>
    </div>
  );
}
