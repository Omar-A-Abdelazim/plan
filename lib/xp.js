// XP and leveling system for PlanFlow

export const XP_REWARDS = {
  TASK_COMPLETED: 10,
  POMODORO_COMPLETED: 25,
}

export const LEVELS = [
  { name: 'Beginner', minXp: 0, icon: '🌱' },
  { name: 'Focused', minXp: 100, icon: '🎯' },
  { name: 'Scholar', minXp: 300, icon: '📚' },
  { name: 'Master', minXp: 600, icon: '🏆' },
  { name: 'Legend', minXp: 1000, icon: '⭐' },
]

export function calculateLevel(xp) {
  let level = LEVELS[0]
  for (const l of LEVELS) {
    if (xp >= l.minXp) {
      level = l
    } else {
      break
    }
  }
  return level
}

export function getNextLevel(xp) {
  const currentLevel = calculateLevel(xp)
  const currentIndex = LEVELS.findIndex(l => l.name === currentLevel.name)
  if (currentIndex < LEVELS.length - 1) {
    return LEVELS[currentIndex + 1]
  }
  return null
}

export function getProgressToNextLevel(xp) {
  const currentLevel = calculateLevel(xp)
  const nextLevel = getNextLevel(xp)
  
  if (!nextLevel) {
    return 100 // Max level reached
  }
  
  const xpInCurrentLevel = xp - currentLevel.minXp
  const xpNeededForNext = nextLevel.minXp - currentLevel.minXp
  
  return Math.floor((xpInCurrentLevel / xpNeededForNext) * 100)
}

export function getTimeGreeting() {
  const hour = new Date().getHours()
  
  if (hour >= 5 && hour < 12) {
    return { greeting: 'Good morning', emoji: '☀️', message: 'Ready to tackle the day?' }
  } else if (hour >= 12 && hour < 17) {
    return { greeting: 'Good afternoon', emoji: '🌤️', message: 'Keep up the momentum!' }
  } else if (hour >= 17 && hour < 21) {
    return { greeting: 'Good evening', emoji: '🌅', message: 'Finishing strong!' }
  } else {
    return { greeting: 'Working late', emoji: '🌙', message: 'Remember to rest!' }
  }
}
