import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Points } from 'three'

interface EnergyParticlesProps {
  shatterProgress: number
}

const PARTICLE_COUNT = 120

export default function EnergyParticles({ shatterProgress }: EnergyParticlesProps) {
  const pointsRef = useRef<Points>(null)
  const timeRef = useRef(0)

  // Generate particle data once
  const { positions, velocities, phases, radii } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3)
    const vel = new Float32Array(PARTICLE_COUNT * 3)
    const phase = new Float32Array(PARTICLE_COUNT)
    const rad = new Float32Array(PARTICLE_COUNT)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2
      const r = 1.2 + Math.random() * 1.5
      const y = (Math.random() - 0.5) * 2

      pos[i * 3] = Math.cos(angle) * r
      pos[i * 3 + 1] = y
      pos[i * 3 + 2] = Math.sin(angle) * r

      vel[i * 3] = (Math.random() - 0.5) * 0.02
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.01
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.02

      phase[i] = Math.random() * Math.PI * 2
      rad[i] = r
    }

    return { positions: pos, velocities: vel, phases: phase, radii: rad }
  }, [])

  useFrame((_, delta) => {
    const points = pointsRef.current
    if (!points) return

    timeRef.current += delta
    const t = timeRef.current
    const posAttr = points.geometry.attributes.position as THREE.BufferAttribute
    const posArray = posAttr.array as Float32Array

    // Shatter effect: particles get sucked in then explode out
    const speedMult = 1
    const radiusMult = 1
    const shatterPhase = shatterProgress > 0.5
      ? (shatterProgress - 0.5) * 2 // 0 to 1 during second half
      : 0

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const phase = phases[i]
      const baseRadius = radii[i] * radiusMult
      const angle = t * speedMult * 0.5 + phase

      // Orbital motion
      let x = Math.cos(angle) * baseRadius
      let z = Math.sin(angle) * baseRadius
      let y = Math.sin(t * 0.3 + phase) * 0.5

      // During shatter: explode outward
      if (shatterPhase > 0) {
        const explode = shatterPhase * 3
        x += Math.cos(angle) * explode * 2
        z += Math.sin(angle) * explode * 2
        y += (Math.random() - 0.5) * explode
      }

      posArray[i * 3] = x
      posArray[i * 3 + 1] = y
      posArray[i * 3 + 2] = z
    }

    posAttr.needsUpdate = true

    // Rotate the whole system slowly
    points.rotation.y = t * 0.1
  })

  const color = '#7cfc00'
  const size = 0.03

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        color={color}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}