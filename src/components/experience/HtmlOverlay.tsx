/**
 * HtmlOverlay — sparse, premium copy that fades in/out per phase.
 *
 * It sits above the fixed canvas (z-index) and is purely presentational. Which
 * block is visible is driven by the coarse `phase` integer from the scroll
 * system (changes rarely → cheap re-renders). Pointer events are disabled
 * except on the final CTA so the canvas stays interactive for parallax.
 */

interface HtmlOverlayProps {
  phase: number
}

interface PanelProps {
  active: boolean
  children: React.ReactNode
  /** corner placement of the copy block */
  place?: 'center' | 'bottom-left' | 'bottom-center'
}

function Panel({ active, children, place = 'center' }: PanelProps) {
  const position =
    place === 'bottom-left'
      ? 'items-end justify-start text-left pb-24 pl-8 md:pb-28 md:pl-20'
      : place === 'bottom-center'
        ? 'items-end justify-center text-center pb-24 md:pb-28'
        : 'items-center justify-center text-center'

  return (
    <div
      className={`pointer-events-none absolute inset-0 flex ${position}`}
      style={{
        opacity: active ? 1 : 0,
        transform: active ? 'translateY(0)' : 'translateY(14px)',
        transition: 'opacity 1s ease, transform 1.1s cubic-bezier(0.16,1,0.3,1)',
      }}
      aria-hidden={!active}
    >
      <div className="max-w-xl px-2">{children}</div>
    </div>
  )
}

export default function HtmlOverlay({ phase }: HtmlOverlayProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-20">
      {/* Phase 1 — Dormant */}
      <Panel active={phase === 0} place="bottom-left">
        <h1 className="overlay-hero">Loyalty, charged.</h1>
        <p className="overlay-sub mt-5 max-w-sm">
          A rewards experience that feels effortless at the counter and
          unforgettable to the customer.
        </p>
      </Panel>

      {/* Phase 2 — Awakening */}
      <Panel active={phase === 1} place="center">
        <p className="overlay-eyebrow">Volt Rewards</p>
        <h2 className="overlay-line mt-4">Every purchase becomes a signal.</h2>
      </Panel>

      {/* Phase 3 — Reward Field */}
      <Panel active={phase === 2} place="center">
        <h2 className="overlay-line">
          A living network of value, around every customer.
        </h2>
        <p className="overlay-sub mt-5 mx-auto max-w-md">
          Points, perks and recognition — flowing quietly in the background.
        </p>
      </Panel>

      {/* Phase 4 — Network Reveal + CTA */}
      <Panel active={phase === 3} place="center">
        <h2 className="overlay-hero">Bring Volt Rewards to your business.</h2>
        <p className="overlay-sub mt-5 mx-auto max-w-md">
          Premium loyalty, ready at the counter on day one.
        </p>
        <div className="pointer-events-auto mt-9 flex items-center justify-center">
          <a href="#contact" className="overlay-cta">
            Request access
          </a>
        </div>
      </Panel>

      {/* Persistent scroll hint — only during the first phase */}
      <div
        className="pointer-events-none absolute bottom-9 left-1/2 -translate-x-1/2"
        style={{
          opacity: phase === 0 ? 1 : 0,
          transition: 'opacity 0.8s ease',
        }}
      >
        <span className="overlay-scroll">scroll</span>
      </div>
    </div>
  )
}
