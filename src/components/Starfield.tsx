import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const COUNT_SMALL = 3500
const COUNT_LARGE = 200
const RADIUS_MIN = 12
const RADIUS_MAX = 35

function makeStars(count: number, large: boolean) {
  const pos = new Float32Array(count * 3)
  const col = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const radius = RADIUS_MIN + Math.random() * (RADIUS_MAX - RADIUS_MIN)
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
    pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
    pos[i * 3 + 2] = radius * Math.cos(phi)

    const b = large
      ? 0.7 + Math.random() * 0.3
      : 0.4 + Math.random() * 0.6
    col[i * 3] = b
    col[i * 3 + 1] = b * (0.88 + Math.random() * 0.12)
    col[i * 3 + 2] = b
  }
  return pos
}

function StarCloud({ count, large }: { count: number; large: boolean }) {
  const ref = useRef<THREE.Points>(null!)
  const positions = useMemo(() => makeStars(count, large), [count, large])

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * (large ? 0.005 : 0.01)
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.003) * 0.02
    }
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={large ? 0.08 : 0.025}
        sizeAttenuation
        transparent
        opacity={large ? 1 : 0.7}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        color={large ? '#d0d8ff' : '#a0b8ff'}
      />
    </points>
  )
}

export default function Starfield() {
  return (
    <group>
      <StarCloud count={COUNT_SMALL} large={false} />
      <StarCloud count={COUNT_LARGE} large={true} />
    </group>
  )
}
