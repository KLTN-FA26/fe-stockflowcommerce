"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode } from "react";

import { SceneFallback } from "./SceneFallback";

/**
 * `ssr: false` là bắt buộc: `three` cần WebGL nên không render được trên server,
 * và cách ly này giữ ~600KB của three ra khỏi bundle server lẫn bundle route /admin/*.
 */
const WarehouseScene = dynamic(() => import("./WarehouseScene").then((mod) => mod.WarehouseScene), {
  ssr: false,
  loading: () => <SceneFallback />,
});

interface BoundaryState {
  failed: boolean;
}

/**
 * Bắt lỗi khởi tạo WebGL (máy ảo, GPU bị blacklist, driver cũ). Khi đó trang vẫn dùng
 * được: fallback tĩnh thay chỗ, không màn trắng, không crash toàn trang.
 *
 * Phải là class component — React chưa có API error boundary dạng hook.
 */
class SceneBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return <SceneFallback />;
    return this.props.children;
  }
}

export function WarehouseSceneLazy() {
  return (
    <SceneBoundary>
      <WarehouseScene />
    </SceneBoundary>
  );
}
