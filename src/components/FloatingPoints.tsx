import { useState, useEffect } from 'react'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

const NAMES = [
  'VOID-7X9', 'NEB-Q2', 'STAR-K11', 'PULSE-04', 'WARP-Z1',
  'NOVA-F8', 'ECHO-T4', 'PHANTOM-R3', 'DRIFT-M2', 'FLUX-J7',
  'CIPHER-X1', 'HORIZON-V6', 'VECTOR-A9', 'BEACON-L5', 'RADIANT-P3',
]

const COLORS = ['#7cfc00', '#6ee7ff', '#a78bfa', '#f472b6', '#fb923c']

export interface FloatingPoint {
  id: number
  name: string
  coords: string
  points: number
  color: string
  position: THREE.Vector3
  offsetX: number
  offsetZ: number
  startTime: number
}

const DURATION = 2.4

function rng(min: number, max: number) { return min + Math.random() * (max - min) }

export function generatePoint(position: THREE.Vector3, id: number): FloatingPoint {
  return {
    id,
    name: NAMES[Math.floor(Math.random() * NAMES.length)],
    coords: `${rng(-999, 999).toFixed(1)}, ${rng(-999, 999).toFixed(1)}, ${rng(-999, 999).toFixed(1)}`,
    points: Math.floor(rng(50, 999)),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    position: position.clone(),
    offsetX: (Math.random() - 0.5) * 1.6,
    offsetZ: (Math.random() - 0.5) * 1.2,
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

  const p = elapsed
  const x = point.position.x + point.offsetX * p * 0.5
  const y = point.position.y + p * 2.8
  const z = point.position.z + point.offsetZ * p * 0.3
  const opacity = Math.max(0, 1 - p * 0.75)
  const c = point.color

  return (
    <Html position={[x, y, z]} center style={{ pointerEvents: 'none', opacity, transition: 'none' }}>
      <div
        style={{
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontSize: '16px',
          letterSpacing: '4px',
          color: c,
          textShadow: `0 0 6px ${c}66, 0 0 12px ${c}33, 0 0 24px ${c}11`,
          whiteSpace: 'nowrap',
          userSelect: 'none',
          lineHeight: 1.8,
          textTransform: 'uppercase',
          background: `${c}08`,
          border: `1px solid ${c}33`,
          borderRadius: '4px',
          padding: '6px 10px',
        }}
      >
        <div style={{ letterSpacing: '4px' }}>
          <span style={{ opacity: 0.4, fontWeight: 400 }}>NAME </span>
          <span style={{ fontWeight: 700 }}>{point.name}</span>
        </div>
        <div style={{ letterSpacing: '3px', fontSize: '14px' }}>
          <span style={{ opacity: 0.4, fontWeight: 400 }}>COORD </span>
          <span style={{ opacity: 0.7 }}>{point.coords}</span>
        </div>
        <div style={{ letterSpacing: '4px', marginTop: '2px' }}>
          <span style={{ opacity: 0.4, fontWeight: 400 }}>PTS </span>
          <span style={{ fontWeight: 700, opacity: 1 }}>+{point.points}</span>
        </div>
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
