import { useEffect, useRef, useState } from 'react'

const BENEFITS = [
  {
    title: 'Collect Points',
    description: 'Every tap of the card earns you points. The more you interact, the faster your rewards grow.',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12" aria-hidden="true">
        <circle cx="24" cy="24" r="20" stroke="#7cfc00" strokeWidth="1.5" />
        <path d="M16 24l6 6 10-10" stroke="#7cfc00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Redeem Rewards',
    description: 'Spend your points on exclusive rewards, from discounts to one-of-a-kind experiences.',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12" aria-hidden="true">
        <rect x="6" y="18" width="36" height="22" rx="3" stroke="#7cfc00" strokeWidth="1.5" />
        <path d="M16 12h16l-4 6H20l-4-6z" stroke="#7cfc00" strokeWidth="1.5" fill="none" />
        <path d="M24 18v14M18 25h12" stroke="#7cfc00" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Exclusive Perks',
    description: 'Unlock member-only benefits, early access to drops, and invites to special events.',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12" aria-hidden="true">
        <path d="M24 6l4.5 9.1 10.1 1.5-7.3 7.1 1.7 10.1L24 29.2l-9 4.6 1.7-10.1-7.3-7.1 10.1-1.5L24 6z" stroke="#7cfc00" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
]

function BenefitCard({ title, description, icon, index }: typeof BENEFITS[number] & { index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect() } },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className="benefit-card"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(30px)',
        transition: `opacity 0.8s ease ${index * 0.15}s, transform 0.8s ease ${index * 0.15}s`,
      }}
    >
      <div className="benefit-card__icon">{icon}</div>
      <h3 className="benefit-card__title">{title}</h3>
      <p className="benefit-card__desc">{description}</p>
    </div>
  )
}

export default function Features() {
  const [headingInView, setHeadingInView] = useState(false)
  const headingRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = headingRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setHeadingInView(true); observer.disconnect() } },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section id="features" className="features-section">
      <div className="max-w-6xl mx-auto px-6">
        <div
          ref={headingRef}
          className="text-center mb-20"
          style={{
            opacity: headingInView ? 1 : 0,
            transform: headingInView ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.8s ease, transform 0.8s ease',
          }}
        >
          <span className="section-label">Why Volt</span>
          <h2 className="section-title">Earn Every Click</h2>
          <p className="section-subtitle">
            A loyalty experience built for the digital age. No cards to carry,
            no points to track — it just works.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {BENEFITS.map((b, i) => (
            <BenefitCard key={b.title} {...b} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
