'use client'

import { Sun, Moon, Timer, Flame } from 'lucide-react'
import { useTheme } from '@/context/theme-context'
import { useUser } from '@/context/user-context'
import { usePomodoro } from '@/context/pomodoro-context'
import { calculateLevel, getProgressToNextLevel, getNextLevel } from '@/lib/xp'
import { cn } from '@/lib/utils'

export function TopBar() {
  const { theme, toggleTheme } = useTheme()
  const { userData, showLevelUp, newLevel, dismissLevelUp } = useUser()
  const { toggleWidget, showWidget } = usePomodoro()
  
  const currentLevel = calculateLevel(userData.xp)
  const progress = getProgressToNextLevel(userData.xp)
  const nextLevel = getNextLevel(userData.xp)

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4">
      {/* Left side - empty or can add breadcrumbs */}
      <div className="flex items-center gap-4">
        {/* XP Bar */}
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/10 text-primary",
            showLevelUp && "animate-level-up"
          )}>
            <span className="text-lg">{currentLevel.icon}</span>
            <span className="font-semibold text-sm">{currentLevel.name}</span>
          </div>
          
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                {userData.xp} XP
              </span>
            </div>
            {nextLevel && (
              <span className="text-[10px] text-muted-foreground">
                {nextLevel.minXp - userData.xp} XP to {nextLevel.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Study Streak */}
        {userData.streak > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-accent/20 text-accent">
            <Flame className="w-4 h-4" />
            <span className="font-bold text-sm">{userData.streak}</span>
          </div>
        )}
        
        {/* Pomodoro Widget Toggle */}
        <button
          onClick={toggleWidget}
          className={cn(
            "p-2 rounded-lg transition-all duration-200",
            showWidget 
              ? "bg-primary text-primary-foreground" 
              : "hover:bg-muted text-muted-foreground hover:text-foreground"
          )}
          title="Toggle Pomodoro Widget"
        >
          <Timer className="w-5 h-5" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Level Up Notification */}
      {showLevelUp && newLevel && (
        <div 
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-scale-in"
          onClick={dismissLevelUp}
        >
          <div className="bg-card border border-primary/50 rounded-xl px-6 py-4 shadow-2xl shadow-primary/20">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{newLevel.icon}</span>
              <div>
                <p className="text-sm text-muted-foreground">Level Up!</p>
                <p className="text-xl font-bold text-foreground">{newLevel.name}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
