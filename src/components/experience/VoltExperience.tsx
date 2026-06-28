import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { useScrollProgress } from '../../hooks/useScrollProgress'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { ExperienceContext } from './progressContext'
import Scene from './Scene'
import HtmlOverlay from './HtmlOverlay'

/**
 * VoltExperience — the top-level cinematic shell.
 *
 * Layout strategy:
 *  - A FIXED, fullscreen <Canvas> renders the 3D world and stays behind
 *    everything. It never scrolls.
 *  - A tall, transparent "scroll spacer" gives the page its scroll height; the
 *    scroll position is what drives the cinematic timeline.
 *  - The HTML overlay sits above the canvas (z-index) and fades copy per phase.
 *
 * Scroll height = SCROLL_PAGES * 100vh. More pages = slower, more luxurious
 * pacing. Fewer = snappier.
 */

const SCROLL_PAGES = 4

export default function VoltExperience() {
  const motion = useReducedMotion()
  // Slightly snappier smoothing on mobile where rAF budgets are tighter.
  const { progressRef, phase } = useScrollProgress(motion.isMobile ? 0.12 : 0.08)

  const ctxValue = useMemo(
    () => ({ progressRef, motion }),
    [progressRef, motion]
  )

  return (
    <ExperienceContext.Provider value={ctxValue}>
      {/* Fixed 3D stage — always behind the page */}
      <div className="fixed inset-0 z-0" style={{ background: '#050507' }}>
        <Canvas
          dpr={[1, 1.75]}
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.1,
          }}
          camera={{ position: [0, 0.15, 6], fov: 38 }}
        >
          <color attach="background" args={['#050507']} />
          <Scene />
        </Canvas>
      </div>

      {/* HTML overlay — phase-driven copy */}
      <HtmlOverlay phase={phase} />

      {/* Scroll spacer — gives the timeline its length */}
      <div
        aria-hidden
        style={{ height: `${SCROLL_PAGES * 100}vh`, pointerEvents: 'none' }}
      />
    </ExperienceContext.Provider>
  )
}
