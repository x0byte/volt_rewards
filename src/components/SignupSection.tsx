import { useEffect, useRef, useState } from 'react'
import Button from './Button'

export default function SignupSection() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [inView, setInView] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect() } },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setSubmitted(true)
    }
  }

  return (
    <section id="signup" className="signup-section">
      <div
        ref={ref}
        className="max-w-xl mx-auto px-6 text-center"
        style={{
          opacity: inView ? 1 : 0,
          transform: inView ? 'translateY(0)' : 'translateY(30px)',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}
      >
        <span className="section-label">Get Started</span>
        <h2 className="section-title">Ready to Power Up?</h2>
        <p className="section-subtitle mb-10">
          Be the first to know when Volt Rewards launches. Join the waitlist
          and get 500 bonus points on signup.
        </p>

        {submitted ? (
          <div className="text-[#7cfc00] text-lg font-semibold">
            You&rsquo;re on the list. See you among the stars.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 justify-center">
            <input
              type="email"
              required
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="signup-input"
            />
            <Button>Join Now</Button>
          </form>
        )}
      </div>

      {/* Footer */}
      <footer className="site-footer">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none" aria-hidden="true">
              <defs>
                <linearGradient id="boltGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
              <path
                d="M22 4L8 22h10l-2 14 16-20H22l2-12z"
                fill="url(#boltGrad)"
                stroke="#a78bfa"
                strokeWidth="0.5"
              />
            </svg>
            <span className="text-sm font-bold tracking-[0.15em] text-gray-400">VOLT</span>
          </div>
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} Volt Rewards. All rights reserved.
          </p>
        </div>
      </footer>
    </section>
  )
}
