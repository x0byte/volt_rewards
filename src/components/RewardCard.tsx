import { useRef, useMemo } from 'react'
import { useLoader, useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import type { Group } from 'three'

interface RewardCardProps {
  scrollProgress?: number
}

const CARD_W = 3.0
const CARD_H = 1.89
const CARD_D = 0.12
const BEVEL = 0.08
const SMOOTHNESS = 4

// Native logo dimensions
const LOGO_W = 2237
const LOGO_H = 426

// ── Irregular rock debris ───────────────────────────
// A flawless solid card is shown at rest. Once it starts breaking, we swap in
// a cloud of *inconsistent* rock-like chunks (varied shapes, non-uniform
// scales) that blow apart with real ballistic motion.
const CHUNK_COUNT = 60

interface Chunk {
  origin: THREE.Vector3   // spawn point across the card volume
  vel: THREE.Vector3      // launch velocity
  spinAxis: THREE.Vector3
  spinSpeed: number
  scale: THREE.Vector3    // non-uniform → jagged, inconsistent look
  geoType: number
  delay: number           // staggered break-off (0..0.25)
}

function rand(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function buildChunks(): Chunk[] {
  const chunks: Chunk[] = []
  for (let i = 0; i < CHUNK_COUNT; i++) {
    const s = i * 13 + 1
    const ox = (rand(s + 0) - 0.5) * CARD_W
    const oy = (rand(s + 1) - 0.5) * CARD_H
    const oz = (rand(s + 2) - 0.5) * CARD_D * 2
    const origin = new THREE.Vector3(ox, oy, oz)

    // Launch radially outward from centre, with jitter + forward bias
    const radial = new THREE.Vector3(ox, oy, 0).normalize()
    const jitter = new THREE.Vector3(
      (rand(s + 3) - 0.5) * 0.9,
      (rand(s + 4) - 0.5) * 0.9,
      (rand(s + 5) - 0.2) * 1.6
    )
    const speed = 2.4 + rand(s + 6) * 3.0
    const vel = radial.add(jitter).normalize().multiplyScalar(speed)

    const spinAxis = new THREE.Vector3(
      rand(s + 7) - 0.5,
      rand(s + 8) - 0.5,
      rand(s + 9) - 0.5
    ).normalize()

    // Non-uniform scale so no two chunks look alike
    const base = 0.1 + rand(s + 10) * 0.22
    const scale = new THREE.Vector3(
      base * (0.6 + rand(s + 11) * 0.9),
      base * (0.6 + rand(s + 12) * 0.9),
      base * (0.6 + rand(s + 13) * 0.9)
    )

    chunks.push({
      origin,
      vel,
      spinAxis,
      spinSpeed: 2 + rand(s + 14) * 6,
      scale,
      geoType: Math.floor(rand(s + 15) * 4),
      delay: rand(s + 16) * 0.25,
    })
  }
  return chunks
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1)
  return t * t * (3 - 2 * t)
}

// ── Debris cloud ────────────────────────────────────
function Debris({ progress }: { progress: number }) {
  const groupRef = useRef<Group>(null)
  const chunks = useMemo(() => buildChunks(), [])

  // A few different jagged rock geometries for variety
  const geos = useMemo(
    () => [
      new THREE.TetrahedronGeometry(1, 0),
      new THREE.IcosahedronGeometry(1, 0),
      new THREE.DodecahedronGeometry(1, 0),
      new THREE.OctahedronGeometry(1, 0),
    ],
    []
  )

  useFrame(() => {
    const g = groupRef.current
    if (!g) return
    const GRAVITY = -6.5

    chunks.forEach((c, idx) => {
      const child = g.children[idx] as THREE.Mesh
      if (!child) return

      const local = smoothstep(c.delay, 1, progress)
      const t = local
      const dx = c.vel.x * t
      const dy = c.vel.y * t + 0.5 * GRAVITY * t * t
      const dz = c.vel.z * t

      child.position.set(c.origin.x + dx, c.origin.y + dy, c.origin.z + dz)
      child.setRotationFromAxisAngle(c.spinAxis, c.spinSpeed * local)
      // Chunks grow in from nothing as the card fractures
      const grow = smoothstep(0, 0.12, progress)
      child.scale.set(c.scale.x * grow, c.scale.y * grow, c.scale.z * grow)
    })
  })

  if (progress <= 0.001) return null

  return (
    <group ref={groupRef}>
      {chunks.map((c, i) => (
        <mesh key={i} geometry={geos[c.geoType]}>
          <meshStandardMaterial
            color="#211f27"
            metalness={0.85}
            roughness={0.5}
            envMapIntensity={0.9}
            flatShading
          />
        </mesh>
      ))}
    </group>
  )
}

// ── Flawless intact card ────────────────────────────
function IntactCard({ opacity, logoTexture }: { opacity: number; logoTexture: THREE.Texture }) {
  const logoW = CARD_W * 0.8
  const logoH = logoW * (LOGO_H / LOGO_W)
  const transparent = opacity < 1

  return (
    <group>
      {/* Solid body — one seamless rounded box */}
      <RoundedBox args={[CARD_W, CARD_H, CARD_D]} radius={BEVEL} smoothness={SMOOTHNESS}>
        <meshStandardMaterial
          color="#1A191F"
          metalness={0.95}
          roughness={0.35}
          envMapIntensity={1.0}
          transparent={transparent}
          opacity={opacity}
        />
      </RoundedBox>

      {/* Logo front / back */}
      <mesh position={[0, 0, CARD_D / 2 + 0.02]}>
        <planeGeometry args={[logoW, logoH]} />
        <meshBasicMaterial map={logoTexture} transparent opacity={opacity} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, -CARD_D / 2 - 0.02]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[logoW, logoH]} />
        <meshBasicMaterial map={logoTexture} transparent opacity={opacity} depthWrite={false} side={THREE.DoubleSide} />
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
          opacity={0.6 * opacity}
        />
      </RoundedBox>
    </group>
  )
}

// ── Main RewardCard ─────────────────────────────────
export default function RewardCard({ scrollProgress = 0 }: RewardCardProps) {
  const shatter = Math.min(Math.max(scrollProgress, 0), 1)
  const logoTexture = useLoader(THREE.TextureLoader, '/logo.png')

  // Intact card is flawless & fully opaque at rest, then dissolves quickly as
  // the debris takes over — a short cross-fade hides the hand-off.
  const intactOpacity = Math.max(0, 1 - shatter / 0.14)
  const showIntact = intactOpacity > 0.001

  return (
    <group>
      {showIntact && <IntactCard opacity={intactOpacity} logoTexture={logoTexture} />}
      <Debris progress={shatter} />
    </group>
  )
}
