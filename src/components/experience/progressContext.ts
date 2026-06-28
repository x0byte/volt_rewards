import { createContext, useContext } from 'react'
import type { MotionProfile } from '../../hooks/useReducedMotion'

/**
 * Shared, render-free access to the live scroll progress inside the canvas.
 *
 * We pass *refs* (not state) through context so components reading the value
 * inside `useFrame` never trigger React re-renders. The motion profile is also
 * carried here so every scene component can scale itself down on mobile / when
 * reduced-motion is requested.
 */
export interface ExperienceContextValue {
  progressRef: React.MutableRefObject<number>
  motion: MotionProfile
}

export const ExperienceContext = createContext<ExperienceContextValue | null>(
  null
)

export function useExperience(): ExperienceContextValue {
  const ctx = useContext(ExperienceContext)
  if (!ctx) {
    throw new Error('useExperience must be used inside <ExperienceContext>')
  }
  return ctx
}
