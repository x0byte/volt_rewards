import { useRef, useCallback } from 'react'
import { useLoader } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import type { Mesh } from 'three'

interface RewardCardProps {
  onEarn: (worldPos: THREE.Vector3) => void
}

const CARD_W = 3.0
const CARD_H = 1.89
const CARD_D = 0.12
const BEVEL = 0.08
const SMOOTHNESS = 4

// Native logo dimensions
const LOGO_W = 2237
const LOGO_H = 426

export default function RewardCard({ onEarn }: RewardCardProps) {
  const meshRef = useRef<Mesh>(null)

  // Load Vector.png (white logo on transparent background)
  const logoTexture = useLoader(THREE.TextureLoader, '/logo.png')

  // Handle click → spawn floating points
  const handleClick = useCallback(
    (_e: ThreeEvent<MouseEvent>) => {
      if (!meshRef.current) return
      const worldPos = new THREE.Vector3()
      meshRef.current.getWorldPosition(worldPos)
      worldPos.add(
        new THREE.Vector3(0, 0, CARD_D / 2 + 0.05).applyQuaternion(
          meshRef.current.quaternion
        )
      )
      onEarn(worldPos)
    },
    [onEarn]
  )

  // Preserve native aspect ratio (5.25:1) and fit within card width
  const logoW = CARD_W * 0.8
  const logoH = logoW * (LOGO_H / LOGO_W)

  return (
    <group>
      {/* Main card body — black metallic */}
      <RoundedBox
        ref={meshRef}
        args={[CARD_W, CARD_H, CARD_D]}
        radius={BEVEL}
        smoothness={SMOOTHNESS}
        onClick={handleClick}
      >
        <meshStandardMaterial
          color="#1A191F"
          metalness={0.95}
          roughness={0.35}
          envMapIntensity={1.0}
        />
      </RoundedBox>

      {/* Front face — original Vector.png (white logo on transparent) */}
      <mesh position={[0, 0, CARD_D / 2 + 0.02]}>
        <planeGeometry args={[logoW, logoH]} />
        <meshBasicMaterial
          map={logoTexture}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Back face — mirrored logo */}
      <mesh position={[0, 0, -CARD_D / 2 - 0.02]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[logoW, logoH]} />
        <meshBasicMaterial
          map={logoTexture}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Silver edge rim */}
      <RoundedBox
        args={[CARD_W + 0.02, CARD_H + 0.02, CARD_D + 0.01]}
        radius={BEVEL + 0.01}
        smoothness={SMOOTHNESS}
      >
        <meshStandardMaterial
          color="#2a2a2a"
          metalness={0.98}
          roughness={0.25}
          envMapIntensity={1.2}
          transparent
          opacity={0.6}
        />
      </RoundedBox>
    </group>
  )
}