import { useState, useEffect } from 'react'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

export interface FloatingPoint {
  id: number
  value: number
  position: THREE.Vector3
  offsetX: number
  offsetZ: number
  startTime: number
}

const POINT_VALUES = [10, 25, 50, 100, 250]
const DURATION = 1.8 // seconds

function randomPointValue(): number {
  return POINT_VALUES[Math.floor(Math.random() * POINT_VALUES.length)]
}

export function generatePoint(position: THREE.Vector3, id: number): FloatingPoint {
  return {
    id,
    value: randomPointValue(),
    position: position.clone(),
    offsetX: (Math.random() - 0.5) * 1.2,
    offsetZ: (Math.random() - 0.5) * 0.8,
    startTime: performance.now(),
  }
}

function FloatingPointItem({
  point,
  onRemove,
}: {
  point: FloatingPoint
  onRemove: (id: number) => void
}) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    let rafId: number
    const animate = () => {
      const now = (performance.now() - point.startTime) / 1000
      const progress = Math.min(now / DURATION, 1)
      setElapsed(progress)
      if (progress < 1) {
        rafId = requestAnimationFrame(animate)
      } else {
        onRemove(point.id)
      }
    }
    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [point.id, point.startTime, onRemove])

  const progress = elapsed
  const x = point.position.x + point.offsetX * progress * 0.5
  const y = point.position.y + progress * 2.5
  const z = point.position.z + point.offsetZ * progress * 0.3
  const opacity = Math.max(0, 1 - progress)

  return (
    <Html position={[x, y, z]} center style={{ pointerEvents: 'none' }}>
      <div
        style={{
          color: '#7cfc00',
          fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
          fontWeight: 800,
          fontSize: 'clamp(1rem, 2.5vw, 1.6rem)',
          textShadow:
            '0 0 4px rgba(124,252,0,0.8), 0 0 8px rgba(124,252,0,0.6), 0 0 16px rgba(124,252,0,0.4), 0 0 32px rgba(124,252,0,0.2)',
          opacity,
          whiteSpace: 'nowrap',
          userSelect: 'none',
          transition: 'none',
        }}
      >
        + {point.value} pts
      </div>
    </Html>
  )
}

export default function FloatingPoints({
  points,
  onRemove,
}: {
  points: FloatingPoint[]
  onRemove: (id: number) => void
}) {
  return (
    <>
      {points.map((p) => (
        <FloatingPointItem key={p.id} point={p} onRemove={onRemove} />
      ))}
    </>
  )
}