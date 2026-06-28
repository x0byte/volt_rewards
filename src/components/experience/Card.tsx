import { useMemo, useRef } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { useExperience } from './progressContext'
import {
  CARD_ROTATION_Y,
  CARD_SCALE,
  LOGO_GLOW,
  sampleNumber,
  BRAND,
} from './timeline'

/**
 * Card — the hero object and the anchor of the entire experience.
 *
 * Material direction: black graphite, high metalness, low-ish roughness for a
 * premium specular response. The logo reads as *embedded* light rather than a
 * pasted decal — it lives as an emissive plane whose glow rises with scroll.
 *
 * Motion: a slow idle float plus scroll-driven rotation/scale. A rare, gentle
 * "shiver" replaces the old aggressive glitch — premium, not arcade.
 */

const CARD_W = 3.0
const CARD_H = 1.89
const CARD_D = 0.12
const BEVEL = 0.08
const SMOOTHNESS = 4

// Native logo aspect ratio (white logo on transparent bg).
const LOGO_W = 2237
const LOGO_H = 426

export default function Card() {
  const { progressRef, motion } = useExperience()

  const groupRef = useRef<THREE.Group>(null!)
  const floatRef = useRef<THREE.Group>(null!)
  const logoMatRef = useRef<THREE.MeshStandardMaterial>(null!)
  const glowMatRef = useRef<THREE.MeshBasicMaterial>(null!)
  const sweepRef = useRef<THREE.Mesh>(null!)
  const sweepMatRef = useRef<THREE.MeshBasicMaterial>(null!)

  const logoTexture = useLoader(THREE.TextureLoader, '/logo.png')

  // Logo plane sizing — preserve native aspect, fit within ~80% of card width.
  const logoW = CARD_W * 0.8
  const logoH = logoW * (LOGO_H / LOGO_W)

  // Memoized materials so they are created once, not on every render.
  const bodyMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#0a0a0c',
        metalness: 0.92,
        roughness: 0.34,
        envMapIntensity: 1.1,
      }),
    []
  )

  const rimMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#1c1c20',
        metalness: 0.98,
        roughness: 0.22,
        envMapIntensity: 1.4,
        transparent: true,
        opacity: 0.55,
      }),
    []
  )

  // Rare glitch bookkeeping — next time a shiver may fire.
  const nextGlitch = useRef(6 + Math.random() * 8)
  const glitchUntil = useRef(0)

  useFrame((state, delta) => {
    const t = progressRef.current
    const time = state.clock.elapsedTime
    if (!groupRef.current) return

    const reduce = motion.reducedMotion

    // ── Scroll-driven rotation + scale ────────────────────────────────
    const rotY = sampleNumber(CARD_ROTATION_Y, t)
    const scale = sampleNumber(CARD_SCALE, t)
    groupRef.current.rotation.y +=
      (rotY - groupRef.current.rotation.y) * Math.min(1, delta * 2.5)
    const s = groupRef.current.scale.x + (scale - groupRef.current.scale.x) * 0.06
    groupRef.current.scale.setScalar(s)

    // ── Slow idle float — gives the card "life" ───────────────────────
    if (floatRef.current && !reduce) {
      floatRef.current.position.y = Math.sin(time * 0.6) * 0.05
      floatRef.current.rotation.x = Math.sin(time * 0.4) * 0.03
      floatRef.current.rotation.z = Math.cos(time * 0.35) * 0.02
    }

    // ── Embedded logo glow ────────────────────────────────────────────
    // Base glow from the timeline + a subtle breathing pulse.
    const baseGlow = sampleNumber(LOGO_GLOW, t)
    const pulse = reduce ? 1 : 0.85 + Math.sin(time * 1.4) * 0.15
    const glow = baseGlow * pulse
    if (logoMatRef.current) {
      logoMatRef.current.emissiveIntensity = glow
    }
    if (glowMatRef.current) {
      glowMatRef.current.opacity = 0.18 + glow * 0.4
    }

    // ── Light sweep — a thin specular streak crossing the surface ─────
    if (sweepRef.current && sweepMatRef.current && !reduce) {
      const sweepCycle = (time * 0.12) % 1
      sweepRef.current.position.x = (sweepCycle - 0.5) * CARD_W * 1.4
      // Only visible while crossing the card face.
      const visible = sweepCycle > 0.1 && sweepCycle < 0.9 ? 1 : 0
      sweepMatRef.current.opacity =
        visible * (0.12 + 0.08 * Math.sin(sweepCycle * Math.PI))
    }

    // ── Rare, gentle glitch ("shiver") ────────────────────────────────
    if (!reduce) {
      if (time > nextGlitch.current && glitchUntil.current === 0) {
        glitchUntil.current = time + 0.18
        nextGlitch.current = time + 10 + Math.random() * 12
      }
      if (glitchUntil.current > 0) {
        if (time < glitchUntil.current) {
          const j = (Math.random() - 0.5) * 0.02
          groupRef.current.position.x = j
          groupRef.current.position.z = (Math.random() - 0.5) * 0.015
          // brief green energy spike during the shiver
          if (glowMatRef.current) glowMatRef.current.opacity += 0.25
        } else {
          groupRef.current.position.x = 0
          groupRef.current.position.z = 0
          glitchUntil.current = 0
        }
      }
    }
  })

  return (
    <group ref={groupRef}>
      <group ref={floatRef}>
        {/* Main card body — black graphite metallic */}
        <RoundedBox
          args={[CARD_W, CARD_H, CARD_D]}
          radius={BEVEL}
          smoothness={SMOOTHNESS}
          material={bodyMaterial}
        />

        {/* Outer rim — slightly brighter metal for a crisp edge highlight */}
        <RoundedBox
          args={[CARD_W + 0.02, CARD_H + 0.02, CARD_D + 0.008]}
          radius={BEVEL + 0.01}
          smoothness={SMOOTHNESS}
          material={rimMaterial}
        />

        {/* Embedded green glow halo behind the logo (soft, additive) */}
        <mesh position={[0, 0, CARD_D / 2 + 0.012]}>
          <planeGeometry args={[logoW * 1.15, logoH * 2.4]} />
          <meshBasicMaterial
            ref={glowMatRef}
            color={BRAND.accent}
            transparent
            opacity={0.2}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Front logo — emissive so it reads as embedded light */}
        <mesh position={[0, 0, CARD_D / 2 + 0.02]}>
          <planeGeometry args={[logoW, logoH]} />
          <meshStandardMaterial
            ref={logoMatRef}
            map={logoTexture}
            emissiveMap={logoTexture}
            emissive={BRAND.accent}
            emissiveIntensity={0.2}
            transparent
            metalness={0.4}
            roughness={0.5}
            depthWrite={false}
          />
        </mesh>

        {/* Back logo — mirrored, dimmer */}
        <mesh position={[0, 0, -CARD_D / 2 - 0.02]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[logoW, logoH]} />
          <meshStandardMaterial
            map={logoTexture}
            emissiveMap={logoTexture}
            emissive={BRAND.accent}
            emissiveIntensity={0.1}
            transparent
            metalness={0.4}
            roughness={0.5}
            depthWrite={false}
          />
        </mesh>

        {/* Light sweep streak — thin vertical specular highlight */}
        <mesh ref={sweepRef} position={[0, 0, CARD_D / 2 + 0.025]}>
          <planeGeometry args={[0.25, CARD_H * 0.95]} />
          <meshBasicMaterial
            ref={sweepMatRef}
            color="#dfe7ff"
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  )
}
