import { useState, useEffect, useRef, useCallback } from 'react'

import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import RewardCard from './RewardCard'
import Starfield from './Starfield'
import EnergyParticles from './EnergyParticles'



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
      // Push camera much further back on mobile to make card ~60% of screen width
      targetZ = baseZ * (targetAspect / Math.max(aspect, 0.35)) * 1.8
    }
    targetZ = Math.min(targetZ, 14)
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

// ── Camera shake (only active during burst, passive otherwise) ──
function CameraShake({ intensity }: { intensity: number }) {
  const camera = useThree((s) => s.camera)
  const shakeRef = useRef(0)
  const basePosRef = useRef(new THREE.Vector3())
  const isActiveRef = useRef(false)

  useEffect(() => {
    if (intensity > 0) {
      shakeRef.current = intensity
      basePosRef.current.copy(camera.position)
      isActiveRef.current = true
    }
  }, [intensity, camera])

  useFrame(() => {
    if (!isActiveRef.current) return
    if (shakeRef.current > 0.01) {
      const s = shakeRef.current
      camera.position.x = basePosRef.current.x + (Math.random() - 0.5) * s * 0.1
      camera.position.y = basePosRef.current.y + (Math.random() - 0.5) * s * 0.06
      shakeRef.current *= 0.88
    } else {
      camera.position.x = basePosRef.current.x
      camera.position.y = basePosRef.current.y
      shakeRef.current = 0
      isActiveRef.current = false
    }
  })

  return null
}

// ── Gesture-driven shatter progress ─────────────────
// Desktop: wheel accumulates into 0→1 shatter value (original behaviour).
// Mobile / touch: tap triggers a burst (shatter → 1 then auto-reassemble),
// and drag is much more sensitive so a single swipe does meaningful work.
const SHATTER_SENSITIVITY = 6000
const TOUCH_SENSITIVITY = 800
const INTRO_START = 0.6
const INTRO_DURATION = 2200
const BURST_PEAK_HOLD = 600
const BURST_REASSEMBLE_DURATION = 1800
function useScrollProgress() {
  const [progress, setProgress] = useState(INTRO_START)
  const [shakeIntensity, setShakeIntensity] = useState(0)
  const [shockwave, setShockwave] = useState<{ x: number; y: number; id: number } | null>(null)
  const [shatterMode, setShatterMode] = useState(0) // 0=explosion, 1=implosion, 2=slice, 3=dissolve
  const touch = useRef(isTouchPrimary())
  const burstRef = useRef<{ start: number; phase: 'hold' | 'reassemble' } | null>(null)
  const burstRaf = useRef(0)
  const shatterCountRef = useRef(0)

  // ── Haptic feedback ──
  const haptic = useCallback((ms: number | number[]) => {
    if (touch.current && navigator.vibrate) navigator.vibrate(ms)
  }, [])

  // ── Burst animation (mobile tap) ──
  const runBurst = useCallback((tapX: number, tapY: number) => {
    cancelAnimationFrame(burstRaf.current)

    const now = performance.now()
    shatterCountRef.current++

    // Cycle shatter mode every 3 shatters for variety
    if (shatterCountRef.current % 3 === 0) {
      setShatterMode((prev) => (prev + 1) % 4)
    }

    // Shockwave overlay
    setShockwave({ x: tapX, y: tapY, id: now })

    // Haptic feedback
    haptic([30, 20, 20])

    // Camera shake
    setShakeIntensity(0.5)

    const animate = () => {
      const b = burstRef.current
      if (!b) return
      const elapsed = performance.now() - b.start
      if (b.phase === 'hold') {
        setProgress(1)
        if (elapsed >= BURST_PEAK_HOLD) {
          b.phase = 'reassemble'
          b.start = performance.now()
          haptic(15)
        }
      } else {
        const t = Math.min(elapsed / BURST_REASSEMBLE_DURATION, 1)
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
  }, [haptic])

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
    let touchStartX = 0

    const onTouchStart = (e: TouchEvent) => {
      if (!touch.current) return
      const t = e.touches[0]
      lastTouchY = t?.clientY ?? null
      touchStartX = t?.clientX ?? 0
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
      if (elapsed < 250 && !touchMoved && introDone && !burstRef.current) {
        runBurst(touchStartX, lastTouchY ?? window.innerHeight / 2)
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
  return { progress, shakeIntensity, shockwave, shatterMode, isTouch: touch.current }
}



export default function Scene() {
  const { progress, shakeIntensity, shockwave, shatterMode, isTouch } = useScrollProgress()

  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ position: [0, 0.1, 4.5], fov: 35 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
        style={{ background: '#080810' }}
      >
        <ResponsiveCamera />
        <CameraShake intensity={shakeIntensity} />
        <Starfield />
        <Environment preset="night" environmentIntensity={0.5} />

        {/* Reactive lighting - intensifies with shatter */}
        <pointLight position={[0, -4, -2]} intensity={3.0} distance={14} color="#7cfc00" decay={2} />
        <pointLight position={[0, -2.5, 3]} intensity={1.5} distance={8} color="#7cfc00" decay={2.5} />
        <pointLight position={[0, 0, 2]} intensity={progress * 4} distance={6} color="#7cfc00" decay={2.5} />
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
          touches={{
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_ROTATE,
          }}
          {...(isTouch ? { enableRotate: false } : {})}
        />

        <RewardCard scrollProgress={progress} shatterMode={shatterMode} />
        <EnergyParticles shatterProgress={progress} />

        {/* Post-processing effects */}
        <EffectComposer>
          <Bloom
            intensity={0.5}
            luminanceThreshold={0.4}
            luminanceSmoothing={0.95}
            mipmapBlur
            radius={0.6}
          />
          <ChromaticAberration
            offset={new THREE.Vector2(0.0005, 0.0005)}
            radialModulation={false}
            modulationOffset={0}
          />
          <Vignette eskil={false} offset={0.2} darkness={0.5} />
        </EffectComposer>
      </Canvas>

      {/* Shockwave ring overlay */}
      {shockwave && (
        <div
          key={shockwave.id}
          className="shockwave-ring"
          style={{ left: shockwave.x, top: shockwave.y }}
        />
      )}
    </div>
  )
}
