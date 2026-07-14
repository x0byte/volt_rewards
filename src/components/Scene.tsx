import { useState, useEffect, useRef, useCallback } from 'react'

import { Canvas, useThree } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import RewardCard from './RewardCard'
import Starfield from './Starfield'



// ── Responsive camera ───────────────────────────────
function ResponsiveCamera() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)

  useEffect(() => {
    const aspect = size.width / size.height
    const baseZ = 4.5
    const targetAspect = 1.3
    let targetZ = baseZ
    if (aspect < targetAspect) {
      targetZ = baseZ * (targetAspect / Math.max(aspect, 0.4))
    }
    targetZ = Math.min(targetZ, 8)
    camera.position.z = targetZ
    camera.updateProjectionMatrix()
  }, [camera, size.width, size.height])

  return null
}

// ── Detect touch-primary devices ────────────────────
function isTouchPrimary(): boolean {
  if (typeof window === 'undefined') return false
  return 'ontouchstart' in window && navigator.maxTouchPoints > 0 && window.innerWidth < 1024
}

// ── Gesture-driven shatter progress ─────────────────
// Desktop: wheel accumulates into 0→1 shatter value (original behaviour).
// Mobile / touch: tap triggers a burst (shatter → 1 then auto-reassemble),
// and drag is much more sensitive so a single swipe does meaningful work.
const SHATTER_SENSITIVITY = 6000
const TOUCH_SENSITIVITY = 800       // much lower → single swipe shatters
const INTRO_START = 0.6
const INTRO_DURATION = 2200
const BURST_PEAK_HOLD = 600         // ms to hold at full shatter before reassemble
const BURST_REASSEMBLE_DURATION = 1800

function useScrollProgress() {
  const [progress, setProgress] = useState(INTRO_START)
  const touch = useRef(isTouchPrimary())
  const burstRef = useRef<{ start: number; phase: 'hold' | 'reassemble' } | null>(null)
  const burstRaf = useRef(0)

  // ── Burst animation (mobile tap) ──
  const runBurst = useCallback(() => {
    cancelAnimationFrame(burstRaf.current)
    const animate = () => {
      const b = burstRef.current
      if (!b) return
      const elapsed = performance.now() - b.start
      if (b.phase === 'hold') {
        setProgress(1)
        if (elapsed >= BURST_PEAK_HOLD) {
          b.phase = 'reassemble'
          b.start = performance.now()
        }
      } else {
        const t = Math.min(elapsed / BURST_REASSEMBLE_DURATION, 1)
        // ease-in-out cubic
        const eased = t < 0.5
          ? 4 * t * t * t
          : 1 - Math.pow(-2 * t + 2, 3) / 2
        setProgress(1 - eased)
        if (t >= 1) {
          burstRef.current = null
          setProgress(0)
          return
        }
      }
      burstRaf.current = requestAnimationFrame(animate)
    }
    burstRef.current = { start: performance.now(), phase: 'hold' }
    burstRaf.current = requestAnimationFrame(animate)
  }, [])

  useEffect(() => {
    let value = 0
    let raf = 0
    let introRaf = 0
    let introDone = false

    // ── Intro: play the construction once on load ──
    const startTime = performance.now()
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
    const runIntro = () => {
      const t = Math.min((performance.now() - startTime) / INTRO_DURATION, 1)
      const eased = INTRO_START * (1 - easeOutCubic(t))
      setProgress(eased)
      if (t < 1) {
        introRaf = requestAnimationFrame(runIntro)
      } else {
        introDone = true
        setProgress(0)
      }
    }
    introRaf = requestAnimationFrame(runIntro)

    const apply = (delta: number) => {
      if (!introDone) return
      // If a burst is running on mobile, ignore drag input
      if (burstRef.current) return
      const sensitivity = touch.current ? TOUCH_SENSITIVITY : SHATTER_SENSITIVITY
      value = Math.min(Math.max(value + delta / sensitivity, 0), 1)
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setProgress(value))
    }

    // ── Desktop: wheel ──
    const onWheel = (e: WheelEvent) => {
      if (touch.current) return
      e.preventDefault()
      apply(e.deltaY)
    }

    // ── Mobile: tap-to-burst + sensitive drag ──
    let lastTouchY: number | null = null
    let touchStartTime = 0
    let touchMoved = false

    const onTouchStart = (e: TouchEvent) => {
      if (!touch.current) return
      lastTouchY = e.touches[0]?.clientY ?? null
      touchStartTime = performance.now()
      touchMoved = false
    }
    const onTouchMove = (e: TouchEvent) => {
      if (!touch.current || lastTouchY == null) return
      const y = e.touches[0]?.clientY ?? lastTouchY
      const delta = lastTouchY - y
      lastTouchY = y
      // Only prevent default if the user is actually dragging (not just tapping)
      if (Math.abs(delta) > 2) {
        touchMoved = true
        e.preventDefault()
      }
      apply(delta * 2.2)
    }
    const onTouchEnd = (e: TouchEvent) => {
      if (!touch.current) return
      const elapsed = performance.now() - touchStartTime
      // Quick tap (< 250ms, minimal movement) → trigger burst
      if (elapsed < 250 && !touchMoved && introDone && !burstRef.current) {
        runBurst()
      }
      lastTouchY = null
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      cancelAnimationFrame(introRaf)
      cancelAnimationFrame(burstRaf.current)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [runBurst])
  return progress
}



export default function Scene() {
  const scrollProgress = useScrollProgress()
  const touch = useRef(isTouchPrimary())

  return (

    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0.1, 4.5], fov: 35 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
        style={{ background: '#050508' }}
      >
        <ResponsiveCamera />
        <Starfield />
        <Environment preset="night" environmentIntensity={0.5} />


        <pointLight position={[0, -4, -2]} intensity={6.0} distance={14} color="#7cfc00" decay={1.5} />
        <pointLight position={[0, -2.5, 3]} intensity={3.0} distance={8} color="#7cfc00" decay={2} />
        <directionalLight position={[5, 6, 4]} intensity={3.0} color="#d0d8ff" />
        <directionalLight position={[-1, 1, -6]} intensity={0.6} color="#5577aa" />
        <fog attach="fog" args={['#050508', 8, 20]} />

        <OrbitControls
          enablePan={false}
          enableZoom={false}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.5}
          autoRotate
          autoRotateSpeed={1.2}
          target={[0, 0, 0]}
          // On touch devices, disable OrbitControls' touch handling so it
          // doesn't fight the shatter drag / tap-to-burst gesture.
          touches={{
            ONE: touch.current ? THREE.TOUCH.ROTATE : THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_ROTATE,
          }}
          // Disable touch rotation on mobile to prevent conflict with shatter gesture
          {...(touch.current ? { enableRotate: false } : {})}
        />

        <RewardCard scrollProgress={scrollProgress} />
      </Canvas>
    </div>

  )
}