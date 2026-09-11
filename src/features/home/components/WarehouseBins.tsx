"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";

import { SCENE_TIMING, WAREHOUSE_CENTER_X } from "../constants";

import type { SceneColors } from "../use-scene-colors";

interface WarehouseBinsProps {
  colors: SceneColors;
  animate: boolean;
}

interface WarehouseRackProps {
  colors: SceneColors;
  index: number;
  position: readonly [number, number, number];
  rotationY: number;
  scanned: boolean;
}

const RACK_DEPTH = 1.15;
const RACK_HEIGHT = 5.2;
const RACK_WIDTH = 4;
const RACK_Z_POSITIONS = [-15.8, -11.4, -7, -2.6, 1.8] as const;
const RACK_LANE_OFFSETS = [-3.45, 3.45, 8.2] as const;
const SHELF_LEVELS = [0.35, 1.75, 3.15, 4.55] as const;
const CRATE_X_POSITIONS = [-1.45, -0.48, 0.48, 1.45] as const;
const LIGHT_Z_POSITIONS = [-14, -9, -4, 1, 6] as const;
const CEILING_BEAM_Z_POSITIONS = [-17, -12, -7, -2, 3, 8] as const;
const CEILING_RAIL_X_POSITIONS = [-9, 0, 9] as const;
const WALL_COLUMN_X_POSITIONS = [-12, -8, -4, 0, 4, 8, 12] as const;
const WAREHOUSE_MATERIALS = {
  rack: "slategray",
  shelf: "dimgray",
  crate: "burlywood",
  crateAlt: "cadetblue",
  light: "lightcyan",
} as const;
const FLOOR_CRATES = [
  {
    id: "floor-crate-large",
    position: [-3.7, 0.48, 4.7],
    rotation: [0.04, -0.34, 0.05],
    size: [1.18, 0.92, 1.02],
    accent: false,
  },
  {
    id: "floor-crate-blue",
    position: [-2.35, 0.4, 3.55],
    rotation: [-0.08, 0.42, 0.16],
    size: [0.94, 0.76, 0.86],
    accent: true,
  },
  {
    id: "floor-crate-small",
    position: [-4.55, 0.32, 2.65],
    rotation: [0.12, 0.18, -0.11],
    size: [0.78, 0.62, 0.72],
    accent: false,
  },
] as const;

function WarehouseRack({ colors, index, position, rotationY, scanned }: WarehouseRackProps) {
  const postX = RACK_WIDTH / 2;
  const postZ = RACK_DEPTH / 2;

  return (
    <group position={position} rotation-y={rotationY}>
      {[-postX, postX].flatMap((x) =>
        [-postZ, postZ].map((z) => (
          <mesh castShadow key={`post-${x}-${z}`} position={[x, RACK_HEIGHT / 2, z]}>
            <boxGeometry args={[0.12, RACK_HEIGHT, 0.12]} />
            <meshStandardMaterial
              color={WAREHOUSE_MATERIALS.rack}
              roughness={0.42}
              metalness={0.72}
            />
          </mesh>
        )),
      )}

      {SHELF_LEVELS.map((level, levelIndex) => (
        <group key={`shelf-${level}`}>
          <mesh castShadow receiveShadow position={[0, level, 0]}>
            <boxGeometry args={[RACK_WIDTH, 0.1, RACK_DEPTH]} />
            <meshStandardMaterial
              color={scanned ? colors.accent : WAREHOUSE_MATERIALS.shelf}
              roughness={0.52}
              metalness={0.55}
            />
          </mesh>

          {levelIndex < SHELF_LEVELS.length - 1 &&
            CRATE_X_POSITIONS.map((x, crateIndex) => {
              const hasCrate = (index + levelIndex + crateIndex) % 5 !== 0;
              const isAccentCrate = (index + levelIndex + crateIndex) % 3 === 0;
              if (!hasCrate) return null;

              return (
                <mesh
                  castShadow
                  receiveShadow
                  key={`crate-${level}-${x}`}
                  position={[x, level + 0.54, 0]}
                >
                  <boxGeometry args={[0.84, 0.92, 0.88]} />
                  <meshStandardMaterial
                    color={isAccentCrate ? WAREHOUSE_MATERIALS.crateAlt : WAREHOUSE_MATERIALS.crate}
                    emissive={colors.accent}
                    emissiveIntensity={scanned ? 0.32 : 0}
                    metalness={0.08}
                    roughness={0.72}
                  />
                </mesh>
              );
            })}
        </group>
      ))}

      <mesh castShadow position={[0, RACK_HEIGHT / 2, -postZ]}>
        <boxGeometry args={[RACK_WIDTH, 0.08, 0.08]} />
        <meshStandardMaterial color={WAREHOUSE_MATERIALS.rack} metalness={0.65} />
      </mesh>
      <mesh castShadow position={[0, RACK_HEIGHT / 2, -postZ]} rotation-z={0.93}>
        <boxGeometry args={[0.07, 4.35, 0.06]} />
        <meshStandardMaterial color={WAREHOUSE_MATERIALS.rack} metalness={0.65} />
      </mesh>
      <mesh castShadow position={[0, RACK_HEIGHT / 2, -postZ]} rotation-z={-0.93}>
        <boxGeometry args={[0.07, 4.35, 0.06]} />
        <meshStandardMaterial color={WAREHOUSE_MATERIALS.rack} metalness={0.65} />
      </mesh>
    </group>
  );
}

export function WarehouseBins({ colors, animate }: WarehouseBinsProps) {
  const elapsedRef = useRef(0);
  const [scanIndex, setScanIndex] = useState(0);

  useFrame((_, delta) => {
    if (!animate) return;

    elapsedRef.current += delta * 1000;
    if (elapsedRef.current >= SCENE_TIMING.scanIntervalMs) {
      elapsedRef.current = 0;
      setScanIndex(
        (current) => (current + 1) % (RACK_Z_POSITIONS.length * RACK_LANE_OFFSETS.length),
      );
    }
  });

  return (
    <group>
      {FLOOR_CRATES.map((crate) => (
        <mesh
          castShadow
          receiveShadow
          key={crate.id}
          position={crate.position}
          rotation={crate.rotation}
        >
          <boxGeometry args={crate.size} />
          <meshStandardMaterial
            color={crate.accent ? WAREHOUSE_MATERIALS.crateAlt : WAREHOUSE_MATERIALS.crate}
            roughness={0.76}
          />
        </mesh>
      ))}

      {RACK_LANE_OFFSETS.flatMap((laneOffset, laneIndex) =>
        RACK_Z_POSITIONS.map((z, rackIndex) => {
          const index = laneIndex * RACK_Z_POSITIONS.length + rackIndex;
          return (
            <WarehouseRack
              key={`rack-${laneOffset}-${z}`}
              colors={colors}
              index={index}
              position={[WAREHOUSE_CENTER_X + laneOffset, 0, z]}
              rotationY={Math.PI / 2}
              scanned={animate && scanIndex === index}
            />
          );
        }),
      )}

      <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, 0, -4.5]}>
        <planeGeometry args={[46, 44]} />
        <meshStandardMaterial color={colors.subtle} roughness={0.92} metalness={0.08} />
      </mesh>

      <gridHelper
        args={[44, 44, colors.accent, colors.border]}
        position={[0, 0.01, -4.5]}
        rotation={[0, 0, 0]}
      />

      {[-2.35, 2.35].map((x) => (
        <mesh key={`aisle-line-${x}`} position={[WAREHOUSE_CENTER_X + x, 0.035, -5.5]}>
          <boxGeometry args={[0.045, 0.02, 32]} />
          <meshStandardMaterial
            color={colors.accent}
            emissive={colors.accent}
            emissiveIntensity={0.2}
          />
        </mesh>
      ))}

      <mesh receiveShadow position={[0, 5.4, -20.2]}>
        <boxGeometry args={[46, 10.8, 0.24]} />
        <meshStandardMaterial color={colors.subtle} roughness={0.82} />
      </mesh>

      {WALL_COLUMN_X_POSITIONS.map((x) => (
        <mesh key={`wall-column-${x}`} position={[x, 5.2, -20]}>
          <boxGeometry args={[0.16, 10.4, 0.18]} />
          <meshStandardMaterial color={WAREHOUSE_MATERIALS.rack} metalness={0.6} />
        </mesh>
      ))}

      <mesh receiveShadow position={[0, 9.3, -4.5]}>
        <boxGeometry args={[46, 0.18, 44]} />
        <meshStandardMaterial color={colors.surface} roughness={0.86} />
      </mesh>

      {CEILING_BEAM_Z_POSITIONS.map((z) => (
        <mesh castShadow key={`ceiling-beam-${z}`} position={[0, 9.02, z]}>
          <boxGeometry args={[28, 0.2, 0.24]} />
          <meshStandardMaterial color={WAREHOUSE_MATERIALS.rack} metalness={0.72} />
        </mesh>
      ))}

      {CEILING_RAIL_X_POSITIONS.map((x) => (
        <mesh castShadow key={`ceiling-rail-${x}`} position={[x, 8.94, -4.5]}>
          <boxGeometry args={[0.2, 0.2, 40]} />
          <meshStandardMaterial color={WAREHOUSE_MATERIALS.rack} metalness={0.72} />
        </mesh>
      ))}

      {[-14, 14].map((x) => (
        <mesh receiveShadow key={`side-wall-${x}`} position={[x, 5.1, -4.5]}>
          <boxGeometry args={[0.2, 10.2, 32]} />
          <meshStandardMaterial color={colors.subtle} roughness={0.88} />
        </mesh>
      ))}

      {LIGHT_Z_POSITIONS.map((z) => (
        <mesh key={`light-${z}`} position={[WAREHOUSE_CENTER_X, 8.8, z]}>
          <boxGeometry args={[3.6, 0.08, 0.28]} />
          <meshStandardMaterial
            color={WAREHOUSE_MATERIALS.light}
            emissive={WAREHOUSE_MATERIALS.light}
            emissiveIntensity={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}
