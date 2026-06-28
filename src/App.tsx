import Header from './components/Header'
import VoltExperience from './components/experience/VoltExperience'

/**
 * App — the cinematic Volt Rewards experience.
 *
 * The page is intentionally NOT a normal scrolling website. It is a single
 * fixed 3D stage with a scroll-driven timeline and sparse HTML overlays. The
 * only persistent chrome is the minimal logo header.
 */
export default function App() {
  return (
    <div className="relative w-screen bg-[#050507] overflow-x-hidden">
      <Header />
      <VoltExperience />
    </div>
  )
}
