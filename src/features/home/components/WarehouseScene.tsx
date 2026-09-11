"use client";

import { ContactShadows } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ACESFilmicToneMapping } from "three";

import { CAMERA_POSITION, CAMERA_TARGET, SCENE_TIMING, WAREHOUSE_CENTER_X } from "../constants";
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
    state.camera.lookAt(...CAMERA_TARGET);
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
        shadows
        camera={{ position: CAMERA_POSITION, fov: 44, near: 0.1, far: 90 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        onCreated={(state) => {
          state.camera.lookAt(...CAMERA_TARGET);
          state.gl.toneMapping = ACESFilmicToneMapping;
          state.gl.toneMappingExposure = 1.1;
          setReady(true);
        }}
      >
        <color attach="background" args={[colors.subtle]} />
        <fog attach="fog" args={[colors.subtle, 30, 58]} />

        <ambientLight intensity={0.72} />
        <hemisphereLight args={["white", colors.surface, 1.15]} />
        <directionalLight
          castShadow
          position={[8, 12, 10]}
          intensity={2.4}
          color="white"
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-far={48}
          shadow-camera-left={-14}
          shadow-camera-right={14}
          shadow-camera-top={14}
          shadow-camera-bottom={-14}
        />
        <directionalLight position={[-8, 5, -6]} intensity={0.7} color="lightblue" />
        <pointLight
          position={[WAREHOUSE_CENTER_X, 5.6, 3]}
          intensity={4}
          distance={13}
          color="lightcyan"
        />
        <pointLight
          position={[WAREHOUSE_CENTER_X, 5.6, -8]}
          intensity={3}
          distance={12}
          color="lightcyan"
        />

        <WarehouseBins colors={colors} animate={animate} />
        <ContactShadows
          position={[0, 0.025, -4]}
          scale={38}
          opacity={0.32}
          blur={2.5}
          far={12}
          resolution={512}
          frames={1}
          color="black"
        />

        <ParallaxRig enabled={animate} />
        <PauseWhenHidden enabled={animate} />
      </Canvas>
    </div>
  );
}

export default WarehouseScene;
