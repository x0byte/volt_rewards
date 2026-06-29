import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { useLoader, useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import type { Mesh } from 'three'
import type { Object3D } from 'three'
import MatrixMaterial from '../shaders/MatrixMaterial'

interface RewardCardProps {
  wireframe: boolean
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

// ── Perimeter wireframe overlay ─────────────────────
function WireframeOverlay({ geometry }: { geometry: THREE.BufferGeometry }) {
  const linesRef = useRef<THREE.LineSegments>(null!)
  const pointsRef = useRef<THREE.Points>(null!)

  // Extract only perimeter edges (hard creases)
  const edgeGeo = useMemo(() => {
    return new THREE.EdgesGeometry(geometry, 1)
  }, [geometry])

  // Store original edge vertex positions for animation
  const origPos = useMemo(() => {
    const pos = edgeGeo.attributes.position
    return new Float32Array(pos.array)
  }, [edgeGeo])

  // Skip animation if there's no position data
  const hasPos = edgeGeo.attributes.position.count > 0

  // Animate vertices — soft wave on the perimeter cage
  useFrame((state) => {
    if (!linesRef.current || !hasPos) return
    const pos = edgeGeo.attributes.position
    const t = state.clock.elapsedTime
    for (let i = 0; i < pos.count; i++) {
      const i3 = i * 3
      pos.array[i3]     = origPos[i3]     + Math.sin(t * 2.5 + i * 0.7) * 0.012
      pos.array[i3 + 1] = origPos[i3 + 1] + Math.cos(t * 2.0 + i * 0.5) * 0.012
      pos.array[i3 + 2] = origPos[i3 + 2] + Math.sin(t * 1.8 + i * 0.3) * 0.012
    }
    pos.needsUpdate = true
    if (pointsRef.current) {
      pointsRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <group>
      {/* White perimeter lines */}
      <lineSegments ref={linesRef} geometry={edgeGeo} position={[0, 0, 0.01]}>
        <lineBasicMaterial color="white" transparent opacity={0.9} />
      </lineSegments>
      {/* White nodes at perimeter vertices */}
      <points ref={pointsRef} geometry={edgeGeo} position={[0, 0, 0.01]}>
        <pointsMaterial
          color="white"
          size={0.04}
          sizeAttenuation
          transparent
          opacity={1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  )
}

// ── Main RewardCard ─────────────────────────────────
export default function RewardCard({ onEarn, wireframe }: RewardCardProps) {
  const meshRef = useRef<Mesh>(null)
  const [cageGeo, setCageGeo] = useState<THREE.BufferGeometry | null>(null)
  const geoCaptured = useRef(false)
  // Capture the RoundedBox geometry once after mount
  useEffect(() => {
    if (meshRef.current && !geoCaptured.current) {
      const geo = meshRef.current.geometry.clone()
      setCageGeo(geo)
      geoCaptured.current = true
    }
  })

  // Load Vector.png (white logo on transparent background)
  const logoTexture = useLoader(THREE.TextureLoader, '/logo.png')

  // ── Mouse tracking for shader ─────────────────────────────
  const [mouseUV, setMouseUV] = useState<THREE.Vector2>(new THREE.Vector2(-1, -1))
  const [isHovered, setIsHovered] = useState(false)
  const localPoint = useRef(new THREE.Vector3())

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    // Convert the raycast intersection point from world space to the card's local space
    e.object.worldToLocal(localPoint.current.copy(e.point))
    // Compute UV from local XY position, matching the vertex shader formula:
    //   vUv = position.xy / vec2(1.5, 0.945) * 0.5 + 0.5
    const u = localPoint.current.x / 1.5 * 0.5 + 0.5
    const v = localPoint.current.y / 0.945 * 0.5 + 0.5
    setMouseUV(new THREE.Vector2(u, v))
    setIsHovered(true)
  }, [])

  const handlePointerLeave = useCallback(() => {
    setIsHovered(false)
  }, [])

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
      {/* Main card body — Matrix-watercolor shader */}
      <RoundedBox
        ref={meshRef}
        args={[CARD_W, CARD_H, CARD_D]}
        radius={BEVEL}
        smoothness={SMOOTHNESS}
        onClick={handleClick}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <MatrixMaterial
          mouseUV={mouseUV}
          isHovered={isHovered}
          wireframe={wireframe}
        />
      </RoundedBox>

      {/* Perimeter wireframe overlay — only outer edges */}
      {wireframe && cageGeo && <WireframeOverlay geometry={cageGeo} />}

      {/* Front face — logo */}
      <mesh position={[0, 0, CARD_D / 2 + 0.02]}>
        <planeGeometry args={[logoW, logoH]} />
        <meshBasicMaterial
          map={logoTexture}
          transparent
          opacity={1}
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
          opacity={1}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Silver edge rim — hidden during wireframe */}
      {!wireframe && (
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
      )}
    </group>
  )
}
