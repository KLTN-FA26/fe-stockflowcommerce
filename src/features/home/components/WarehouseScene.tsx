"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { CAMERA_POSITION, CAMERA_ZOOM, SCENE_TIMING } from "../constants";
import { useSceneColors } from "../use-scene-colors";

import { WarehouseBins } from "./WarehouseBins";

/** Nghiêng scene theo chuột, có damping. Biên độ khoá ở ±8° để góc isometric không bị phá. */
function ParallaxRig({ enabled }: { enabled: boolean }) {
  const target = useRef({ x: 0, y: 0 });

  // Mutate qua `state.camera` của callback thay vì destructure `camera` từ
  // `useThree()` ở scope ngoài: react-hooks/immutability (react-compiler) chặn
  // gán property lên giá trị lấy trực tiếp từ hook. `state` là tham số callback
  // của `useFrame`, không phải binding hook — three.js camera vốn là mutable object,
  // đây là cách R3F khuyến nghị để animate mỗi frame mà không re-render.
  useFrame((state) => {
    if (!enabled) return;

    const { parallaxMaxRad, parallaxDamping, parallaxTravel } = SCENE_TIMING;
    target.current.x += (state.pointer.x * parallaxMaxRad - target.current.x) * parallaxDamping;
    target.current.y += (state.pointer.y * parallaxMaxRad - target.current.y) * parallaxDamping;

    const [baseX, baseY] = CAMERA_POSITION;
    state.camera.position.x = baseX + target.current.x * parallaxTravel;
    state.camera.position.y = baseY + target.current.y * parallaxTravel;
    state.camera.lookAt(0, 0, 0);
  });

  return null;
}

/**
 * Dừng render loop khi tab ẩn — không đốt CPU nền.
 *
 * `enabled` false (prefers-reduced-motion): scene không có gì để animate nên giữ luôn
 * frameloop ở "never" sau lần render đầu, thay vì bật "always" cho một loop chạy rỗng.
 */
function PauseWhenHidden({ enabled }: { enabled: boolean }) {
  const { setFrameloop } = useThree();

  useEffect(() => {
    function sync() {
      if (!enabled) {
        setFrameloop("never");
        return;
      }
      setFrameloop(document.hidden ? "never" : "always");
    }
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [setFrameloop, enabled]);

  return null;
}

export function WarehouseScene() {
  const colors = useSceneColors();
  const prefersReducedMotion = useReducedMotion();
  const animate = !prefersReducedMotion;
  const [ready, setReady] = useState(false);

  return (
    <div
      className="h-full w-full transition-opacity"
      style={{
        opacity: ready ? 1 : 0,
        // Ngoại lệ có chủ ý so với dải 120–180ms của Mode A: fade-in một lần của asset
        // nặng, nhanh hơn sẽ giật. Xem constants SCENE_TIMING.canvasFadeMs.
        transitionDuration: `${SCENE_TIMING.canvasFadeMs}ms`,
      }}
    >
      <Canvas
        orthographic
        camera={{ position: CAMERA_POSITION, zoom: CAMERA_ZOOM, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        onCreated={() => setReady(true)}
      >
        <ambientLight intensity={0.85} />
        <directionalLight position={[5, 8, 5]} intensity={1.1} />
        <directionalLight position={[-6, 3, -4]} intensity={0.35} />

        <WarehouseBins colors={colors} animate={animate} />

        <ParallaxRig enabled={animate} />
        <PauseWhenHidden enabled={animate} />
      </Canvas>
    </div>
  );
}

export default WarehouseScene;
