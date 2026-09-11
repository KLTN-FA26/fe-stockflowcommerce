"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";

import { BIN_GRID, SCENE_GEOMETRY, SCENE_TIMING } from "../constants";

import type { SceneColors } from "../use-scene-colors";
import type { Group } from "three";

interface WarehouseBinsProps {
  colors: SceneColors;
  /** `false` khi người dùng bật prefers-reduced-motion — scene đứng yên. */
  animate: boolean;
}

/** Đưa kệ về giữa gốc toạ độ để camera nhìn cân. */
function useShelfOffset() {
  return useMemo(() => {
    const { columns, levels, binGapX, levelHeight } = SCENE_GEOMETRY;
    return {
      x: ((columns - 1) * binGapX) / 2,
      y: ((levels - 1) * levelHeight) / 2,
    };
  }, []);
}

export function WarehouseBins({ colors, animate }: WarehouseBinsProps) {
  const groupRef = useRef<Group>(null);
  const elapsedRef = useRef(0);
  const [scanIndex, setScanIndex] = useState(0);
  const offset = useShelfOffset();

  useFrame((_, delta) => {
    if (!animate) return;

    if (groupRef.current) {
      groupRef.current.rotation.y += SCENE_TIMING.rotationSpeed * delta;
    }

    elapsedRef.current += delta * 1000;
    if (elapsedRef.current >= SCENE_TIMING.scanIntervalMs) {
      elapsedRef.current = 0;
      setScanIndex((current) => (current + 1) % BIN_GRID.length);
    }
  });

  return (
    <group ref={groupRef}>
      {BIN_GRID.map((bin, index) => {
        const x = bin.column * SCENE_GEOMETRY.binGapX - offset.x;
        const y = bin.level * SCENE_GEOMETRY.levelHeight - offset.y;
        const fillHeight = SCENE_GEOMETRY.fillHeight[bin.fill];
        const isScanned = animate && index === scanIndex;

        return (
          <group key={bin.id} position={[x, y, 0]}>
            {/* Khung bin — luôn hiện, kể cả bin rỗng */}
            <RoundedBox
              args={[
                SCENE_GEOMETRY.binWidth,
                SCENE_GEOMETRY.levelHeight * 0.9,
                SCENE_GEOMETRY.binDepth,
              ]}
              radius={0.03}
              smoothness={2}
            >
              <meshStandardMaterial
                color={colors.border}
                transparent
                opacity={0.22}
                roughness={0.9}
              />
            </RoundedBox>

            {/* Khối hàng bên trong — chiều cao theo mức lấp đầy. Trang trí, không phải số tồn. */}
            {fillHeight > 0 && (
              <RoundedBox
                args={[SCENE_GEOMETRY.binWidth * 0.82, fillHeight, SCENE_GEOMETRY.binDepth * 0.82]}
                radius={0.04}
                smoothness={3}
                position={[0, -(SCENE_GEOMETRY.levelHeight * 0.9 - fillHeight) / 2, 0]}
              >
                <meshStandardMaterial
                  color={isScanned ? colors.accent : colors.ink}
                  emissive={isScanned ? colors.accent : colors.surface}
                  emissiveIntensity={isScanned ? 0.55 : 0}
                  roughness={0.55}
                  metalness={0.12}
                />
              </RoundedBox>
            )}
          </group>
        );
      })}
    </group>
  );
}
