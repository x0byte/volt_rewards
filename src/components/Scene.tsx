import { useState, useEffect } from 'react'

import { Canvas, useThree } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import RewardCard from './RewardCard'
import Starfield from './Starfield'



// ── Responsive camera ───────────────────────────────
// Keeps the rotating card fully visible across screen sizes by pulling the
// camera back on narrow/portrait viewports (where the horizontal FOV shrinks).
// Runs only on resize/mount (not every frame) to avoid jitter.
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

// ── Gesture-driven shatter progress ──
// The page itself does NOT scroll. Instead we capture wheel / touch-drag
// gestures and accumulate them into a virtual 0 → 1 "shatter" value that
// breaks the card apart in place. Scrolling up reverses it.
const SHATTER_SENSITIVITY = 6000 // px of wheel/drag to go 0 → 1 (higher = slower)
const INTRO_START = 0.6          // card starts ~60% shattered on load…
const INTRO_DURATION = 2200      // …then reassembles over this many ms

function useScrollProgress() {
  const [progress, setProgress] = useState(INTRO_START)
  useEffect(() => {
    let value = 0            // the gesture-driven value (starts assembled)
    let raf = 0
    let introRaf = 0
    let introDone = false

    // ── Intro: play the construction once on load ──
    // Tween a separate value from INTRO_START → 0 with easing, then hand off
    // control to the wheel/touch gesture.
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
      // Ignore gestures until the intro construction has finished.
      if (!introDone) return
      value = Math.min(Math.max(value + delta / SHATTER_SENSITIVITY, 0), 1)
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setProgress(value))
    }

    const onWheel = (e: WheelEvent) => {
      // Only hijack the gesture while there's still shatter to play; this
      // keeps the page pinned during the break-apart.
      e.preventDefault()
      apply(e.deltaY)
    }


    let lastTouchY: number | null = null
    const onTouchStart = (e: TouchEvent) => {
      lastTouchY = e.touches[0]?.clientY ?? null
    }
    const onTouchMove = (e: TouchEvent) => {
      if (lastTouchY == null) return
      const y = e.touches[0]?.clientY ?? lastTouchY
      const delta = lastTouchY - y // dragging up → positive → shatter
      lastTouchY = y
      e.preventDefault()
      apply(delta * 2.2)
    }
    const onTouchEnd = () => {
      lastTouchY = null
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      cancelAnimationFrame(introRaf)
      window.removeEventListener('wheel', onWheel)

      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [])
  return progress
}



export default function Scene() {
  const scrollProgress = useScrollProgress()

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
        />

        <RewardCard scrollProgress={scrollProgress} />
      </Canvas>
    </div>

  )
}
