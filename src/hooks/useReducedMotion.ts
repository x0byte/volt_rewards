import { useEffect, useState } from 'react'

/**
 * Detects the user's motion preference and whether they're on a small/mobile
 * device. Both signals are used to scale down or disable expensive,
 * motion-heavy parts of the experience.
 */
export interface MotionProfile {
  /** true when the user has requested reduced motion */
  reducedMotion: boolean
  /** true on small viewports / coarse pointers (treated as "mobile") */
  isMobile: boolean
}

function readProfile(): MotionProfile {
  if (typeof window === 'undefined') {
    return { reducedMotion: false, isMobile: false }
  }
  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches
  const isMobile =
    window.matchMedia('(max-width: 768px)').matches ||
    window.matchMedia('(pointer: coarse)').matches
  return { reducedMotion, isMobile }
}

export function useReducedMotion(): MotionProfile {
  const [profile, setProfile] = useState<MotionProfile>(readProfile)

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const widthQuery = window.matchMedia('(max-width: 768px)')
    const pointerQuery = window.matchMedia('(pointer: coarse)')

    const update = () => setProfile(readProfile())

    motionQuery.addEventListener('change', update)
    widthQuery.addEventListener('change', update)
    pointerQuery.addEventListener('change', update)

    return () => {
      motionQuery.removeEventListener('change', update)
      widthQuery.removeEventListener('change', update)
      pointerQuery.removeEventListener('change', update)
    }
  }, [])

  return profile
}
