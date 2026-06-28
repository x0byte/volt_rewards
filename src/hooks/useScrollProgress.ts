import { useEffect, useRef, useState } from 'react'

/**
 * Scroll progress system.
 *
 * The page renders a tall, invisible scroll container behind a fixed canvas.
 * As the user scrolls, we compute a normalized 0..1 value representing how far
 * through the cinematic timeline they are.
 *
 * Two flavours of the value are exposed:
 *  - `progressRef`  : a smoothed (damped) value updated every animation frame.
 *                     Read this inside `useFrame` — it never triggers a React
 *                     re-render, which keeps the 3D loop cheap.
 *  - `phase` state  : a coarse, debounced integer (0..3) used by the HTML
 *                     overlay to decide which copy block is visible. This is
 *                     allowed to re-render React because it changes rarely.
 */

export const PHASE_COUNT = 4

export interface ScrollProgress {
  /** smoothed normalized scroll value, read inside useFrame */
  progressRef: React.MutableRefObject<number>
  /** raw (unsmoothed) normalized scroll value, read inside useFrame */
  rawRef: React.MutableRefObject<number>
  /** current coarse phase index (0..PHASE_COUNT-1) for overlay copy */
  phase: number
}

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

/**
 * @param smoothing damping factor per frame (0..1). Lower = smoother/slower.
 */
export function useScrollProgress(smoothing = 0.08): ScrollProgress {
  const progressRef = useRef(0)
  const rawRef = useRef(0)
  const [phase, setPhase] = useState(0)
  const lastPhase = useRef(0)

  useEffect(() => {
    let rafId = 0
    let mounted = true

    const computeRaw = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const value = max > 0 ? window.scrollY / max : 0
      return clamp01(value)
    }

    const onScroll = () => {
      rawRef.current = computeRaw()
    }

    // Smooth the value every frame and derive a coarse phase.
    const tick = () => {
      if (!mounted) return
      const target = rawRef.current
      progressRef.current += (target - progressRef.current) * smoothing

      const nextPhase = Math.min(
        PHASE_COUNT - 1,
        Math.floor(progressRef.current * PHASE_COUNT)
      )
      if (nextPhase !== lastPhase.current) {
        lastPhase.current = nextPhase
        setPhase(nextPhase)
      }

      rafId = requestAnimationFrame(tick)
    }

    rawRef.current = computeRaw()
    progressRef.current = rawRef.current
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    rafId = requestAnimationFrame(tick)

    return () => {
      mounted = false
      cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [smoothing])

  return { progressRef, rawRef, phase }
}
