import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const COUNT_DUST = 5000
const COUNT_STARS = 400
const COUNT_DEBRIS = 600
const COUNT_GREEN = 60
const RADIUS_MIN = 10
const RADIUS_MAX = 40

function makePositions(count: number, opts: { debris?: boolean; green?: boolean }) {
  const pos = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const radius = opts.debris
      ? 6 + Math.random() * 18
      : opts.green
      ? 4 + Math.random() * 20
      : RADIUS_MIN + Math.random() * (RADIUS_MAX - RADIUS_MIN)
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
    pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
    pos[i * 3 + 2] = radius * Math.cos(phi)
  }
  return pos
}

function DustLayer() {
  const ref = useRef<THREE.Points>(null!)
  const positions = useMemo(() => makePositions(COUNT_DUST, {}), [])

  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.006
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.015} sizeAttenuation transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} color="#8899bb" />
    </points>
  )
}

function StarLayer() {
  const ref = useRef<THREE.Points>(null!)
  const positions = useMemo(() => makePositions(COUNT_STARS, { debris: false }), [])

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.003
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.002) * 0.015
    }
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.07} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} color="#d0d8ff" />
    </points>
  )
}

function DebrisLayer() {
  const ref = useRef<THREE.Points>(null!)
  const positions = useMemo(() => makePositions(COUNT_DEBRIS, { debris: true }), [])

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.004
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.005) * 0.01
    }
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.04} sizeAttenuation transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} color="#887766" />
    </points>
  )
}

function GreenPulsars() {
  const ref = useRef<THREE.Points>(null!)
  const matRef = useRef<THREE.PointsMaterial>(null!)
  const positions = useMemo(() => makePositions(COUNT_GREEN, { green: true }), [])

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.002
    }
    if (matRef.current) {
      const pulse = 0.12 + Math.sin(state.clock.elapsedTime * 2.5) * 0.06
      matRef.current.size = pulse
    }
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        size={0.12}
        sizeAttenuation
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        color="#7cfc00"
      />
    </points>
  )
}

export default function Starfield() {
  return (
    <group>
      <DustLayer />
      <StarLayer />
      <DebrisLayer />
      <GreenPulsars />
    </group>
  )
}
