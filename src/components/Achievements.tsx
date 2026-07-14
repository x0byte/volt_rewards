import { useState, useEffect, useCallback, useRef } from 'react'

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: number
}

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_shatter',
    title: 'First Blood',
    description: 'Shatter the card for the first time',
    icon: '💥',
    unlocked: false,
  },
  {
    id: 'combo_3',
    title: 'Combo Starter',
    description: 'Reach a 3x combo',
    icon: '🔥',
    unlocked: false,
  },
  {
    id: 'combo_5',
    title: 'Combo Master',
    description: 'Reach a 5x combo',
    icon: '⚡',
    unlocked: false,
  },
  {
    id: 'combo_10',
    title: 'Unstoppable',
    description: 'Reach a 10x combo',
    icon: '🌟',
    unlocked: false,
  },
  {
    id: 'speed_demon',
    title: 'Speed Demon',
    description: 'Shatter 10 times in 15 seconds',
    icon: '⏱️',
    unlocked: false,
  },
  {
    id: 'shatter_50',
    title: 'Destruction Expert',
    description: 'Shatter the card 50 times',
    icon: '🏆',
    unlocked: false,
  },
]

const STORAGE_KEY = 'volt_rewards_achievements'

function loadAchievements(): Achievement[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      return DEFAULT_ACHIEVEMENTS.map((a) => {
        const found = parsed.find((p: Achievement) => p.id === a.id)
        return found ? { ...a, unlocked: found.unlocked, unlockedAt: found.unlockedAt } : a
      })
    }
  } catch {
    // ignore
  }
  return DEFAULT_ACHIEVEMENTS
}

function saveAchievements(achievements: Achievement[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(achievements))
  } catch {
    // ignore
  }
}

export function useAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>(loadAchievements)
  const [toast, setToast] = useState<Achievement | null>(null)
  const shatterTimesRef = useRef<number[]>([])
  const totalShattersRef = useRef(0)

  const unlock = useCallback((id: string) => {
    setAchievements((prev) => {
      const achievement = prev.find((a) => a.id === id)
      if (!achievement || achievement.unlocked) return prev

      const updated = prev.map((a) =>
        a.id === id ? { ...a, unlocked: true, unlockedAt: Date.now() } : a
      )
      saveAchievements(updated)

      // Show toast
      const unlockedAchievement = updated.find((a) => a.id === id)
      if (unlockedAchievement) {
        setToast(unlockedAchievement)
        setTimeout(() => setToast(null), 3000)
      }

      return updated
    })
  }, [])

  const recordShatter = useCallback(() => {
    const now = Date.now()
    shatterTimesRef.current.push(now)
    totalShattersRef.current++

    // Keep only last 15 seconds of shatters
    shatterTimesRef.current = shatterTimesRef.current.filter((t) => now - t < 15000)

    // First shatter
    unlock('first_shatter')

    // Speed demon: 10 shatters in 15 seconds
    if (shatterTimesRef.current.length >= 10) {
      unlock('speed_demon')
    }

    // Total shatters
    if (totalShattersRef.current >= 50) {
      unlock('shatter_50')
    }
  }, [unlock])

  const recordCombo = useCallback(
    (count: number) => {
      if (count >= 3) unlock('combo_3')
      if (count >= 5) unlock('combo_5')
      if (count >= 10) unlock('combo_10')
    },
    [unlock]
  )

  return { achievements, toast, recordShatter, recordCombo }
}

interface AchievementToastProps {
  achievement: Achievement
}

export function AchievementToast({ achievement }: AchievementToastProps) {
  return (
    <div className="achievement-toast">
      <div className="achievement-toast__icon">{achievement.icon}</div>
      <div className="achievement-toast__content">
        <div className="achievement-toast__label">Achievement Unlocked</div>
        <div className="achievement-toast__title">{achievement.title}</div>
        <div className="achievement-toast__desc">{achievement.description}</div>
      </div>
    </div>
  )
}

interface AchievementBadgeProps {
  achievements: Achievement[]
}

export function AchievementBadges({ achievements }: AchievementBadgeProps) {
  const [showAll, setShowAll] = useState(false)
  const unlockedCount = achievements.filter((a) => a.unlocked).length

  if (unlockedCount === 0) return null

  return (
    <div className="achievement-badges">
      <button
        className="achievement-badges__toggle"
        onClick={() => setShowAll(!showAll)}
        aria-label="Toggle achievements"
      >
        🏆 {unlockedCount}/{achievements.length}
      </button>
      {showAll && (
        <div className="achievement-badges__list">
          {achievements.map((a) => (
            <div
              key={a.id}
              className={`achievement-badge ${a.unlocked ? 'achievement-badge--unlocked' : ''}`}
              title={a.description}
            >
              <span className="achievement-badge__icon">{a.unlocked ? a.icon : '🔒'}</span>
              <span className="achievement-badge__title">{a.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}