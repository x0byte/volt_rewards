import { useEffect, useState } from 'react'

function isTouchPrimary(): boolean {
  if (typeof window === 'undefined') return false
  return 'ontouchstart' in window && navigator.maxTouchPoints > 0 && window.innerWidth < 1024
}

export default function HeroContent() {
  const [visible, setVisible] = useState(false)
  // Tracks whether the user has begun interacting (scroll / drag / tap). Once they
  // do, the hint gracefully retires so it never fights the debris.
  const [engaged, setEngaged] = useState(false)
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 500)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    setIsTouch(isTouchPrimary())
  }, [])

  useEffect(() => {
    const onEngage = () => setEngaged(true)
    window.addEventListener('wheel', onEngage, { passive: true, once: true })
    window.addEventListener('touchmove', onEngage, { passive: true, once: true })
    window.addEventListener('touchend', onEngage, { passive: true, once: true })
    return () => {
      window.removeEventListener('wheel', onEngage)
      window.removeEventListener('touchmove', onEngage)
      window.removeEventListener('touchend', onEngage)
    }
  }, [])

  return (
    <div
      className="absolute inset-0 z-10 pointer-events-none"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 1.2s ease' }}
    >
      {/* Heading — bottom-left corner */}
      <div className="absolute left-[2.8rem] md:left-[5rem] bottom-20 md:bottom-24 pointer-events-auto">
        <h1 className="hero-title">{isTouch ? 'Tap to Break.' : 'Scroll to Break.'}</h1>
        <h1 className="hero-title -mt-1">Earn Rewards.</h1>
        <p className="hero-tagline mt-4 max-w-sm">
          {isTouch
            ? 'Tap to shatter the card into stardust.'
            : 'Scroll to shatter the card into stardust, then scroll back to rebuild it.'}
        </p>
      </div>

      {/* Interaction prompt — centered, animated, retires once the user engages.
          Shows a mouse wheel on desktop, a tap/finger icon on touch devices. */}
      <div
        className="scroll-prompt pointer-events-none"
        style={{
          opacity: engaged ? 0 : 1,
          transform: engaged ? 'translate(-50%, 8px)' : 'translate(-50%, 0)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}
      >
        {isTouch ? (
          <>
            <span className="scroll-prompt__label">tap to shatter</span>
            <span className="scroll-prompt__tap" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a4 4 0 0 0-4 4v6a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4z" />
                <path d="M12 16v4" />
                <path d="M8 20h8" />
                <circle cx="12" cy="6" r="1" fill="currentColor" opacity="0.5" />
              </svg>
            </span>
          </>
        ) : (
          <>
            <span className="scroll-prompt__label">scroll to shatter</span>
            <span className="scroll-prompt__mouse" aria-hidden="true">
              <span className="scroll-prompt__wheel" />
            </span>
          </>
        )}
      </div>
    </div>

  )
}

