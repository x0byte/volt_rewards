import { useState, useRef, useCallback, useEffect } from 'react'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

interface DataPacket {
  id: number
  name: string
  coords: string
  points: number
  origin: THREE.Vector3
  offsetX: number
  offsetZ: number
  startTime: number
  color: string
}

const NAMES = [
  'VOID-7X9', 'NEB-Q2', 'STAR-K11', 'PULSE-04', 'WARP-Z1',
  'NOVA-F8', 'ECHO-T4', 'PHANTOM-R3', 'DRIFT-M2', 'FLUX-J7',
  'CIPHER-X1', 'HORIZON-V6', 'VECTOR-A9', 'BEACON-L5', 'RADIANT-P3',
]

const COLORS = ['#7cfc00', '#6ee7ff', '#a78bfa', '#f472b6', '#fb923c']
const DURATION = 2.8

function rng(min: number, max: number) { return min + Math.random() * (max - min) }

function generatePacket(id: number, origin: THREE.Vector3): DataPacket {
  return {
    id,
    name: NAMES[Math.floor(Math.random() * NAMES.length)],
    coords: `${rng(-999, 999).toFixed(1)}, ${rng(-999, 999).toFixed(1)}, ${rng(-999, 999).toFixed(1)}`,
    points: Math.floor(rng(50, 999)),
    origin: origin.clone(),
    offsetX: (Math.random() - 0.5) * 1.6,
    offsetZ: (Math.random() - 0.5) * 1.2,
    startTime: performance.now(),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  }
}

function PacketItem({ pkt, onRemove }: { pkt: DataPacket; onRemove: (id: number) => void }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let rafId: number
    const animate = () => {
      const elapsed = (performance.now() - pkt.startTime) / 1000
      const t = Math.min(elapsed / DURATION, 1)
      setProgress(t)
      if (t < 1) {
        rafId = requestAnimationFrame(animate)
      } else {
        onRemove(pkt.id)
      }
    }
    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [pkt.id, pkt.startTime, onRemove])

  const p = progress
  const x = pkt.origin.x + pkt.offsetX * p * 0.5
  const y = pkt.origin.y + p * 2.8
  const z = pkt.origin.z + pkt.offsetZ * p * 0.3
  const opacity = Math.max(0, 1 - p * 0.8)
  const scale = 0.85 + p * 0.15

  const c = pkt.color

  return (
    <Html position={[x, y, z]} center style={{ pointerEvents: 'none', opacity, transition: 'none' }}>
      <div
        style={{
          transform: `scale(${scale})`,
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontSize: '11px',
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
          backdropFilter: 'blur(2px)',
        }}
      >
        <div style={{ fontWeight: 700, letterSpacing: '4px', marginBottom: '1px' }}>
          <span style={{ opacity: 0.4, fontWeight: 400 }}>NAME </span>
          {pkt.name}
        </div>
        <div style={{ letterSpacing: '3px', fontSize: '10px' }}>
          <span style={{ opacity: 0.4, fontWeight: 400 }}>COORD </span>
          <span style={{ opacity: 0.7 }}>{pkt.coords}</span>
        </div>
        <div style={{ letterSpacing: '4px', marginTop: '2px' }}>
          <span style={{ opacity: 0.4, fontWeight: 400 }}>PTS </span>
          <span style={{ opacity: 1, fontWeight: 700 }}>+{pkt.points}</span>
        </div>
      </div>
    </Html>
  )
}

export default function DataPackets() {
  const [packets, setPackets] = useState<DataPacket[]>([])
  const idRef = useRef(0)
  const origin = new THREE.Vector3(0, 0, 0)

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>
    const schedule = () => {
      const delay = 800 + Math.random() * 1200
      timeoutId = setTimeout(() => {
        const id = ++idRef.current
        const pkt = generatePacket(id, origin)
        setPackets((prev) => [...prev, pkt])
        schedule()
      }, delay)
    }
    schedule()
    return () => clearTimeout(timeoutId)
  }, [])

  const handleRemove = useCallback((id: number) => {
    setPackets((prev) => prev.filter((p) => p.id !== id))
  }, [])

  return (
    <>
      {packets.map((p) => (
        <PacketItem key={p.id} pkt={p} onRemove={handleRemove} />
      ))}
    </>
  )
}
