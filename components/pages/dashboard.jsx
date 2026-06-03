'use client'

import { useState } from 'react'
import { 
  CheckCircle2, 
  Timer, 
  Flame, 
  Plus, 
  ArrowRight,
  Sparkles,
  TrendingUp,
  Target
} from 'lucide-react'
import { useUser } from '@/context/user-context'
import { useKanban } from '@/context/kanban-context'
import { getDailyQuote } from '@/lib/quotes'
import { getTimeGreeting, calculateLevel, getProgressToNextLevel, getNextLevel } from '@/lib/xp'
import { cn } from '@/lib/utils'

export function Dashboard({ setCurrentPage }) {
  const { userData, pomodoroStats } = useUser()
  const { currentBoard, addCard } = useKanban()
  const [quickTaskTitle, setQuickTaskTitle] = useState('')
  
  const greeting = getTimeGreeting()
  const dailyQuote = getDailyQuote()
  const currentLevel = calculateLevel(userData.xp)
  const progress = getProgressToNextLevel(userData.xp)
  const nextLevel = getNextLevel(userData.xp)
  
  // Count tasks due today
  const today = new Date().toDateString()
  const tasksDueToday = currentBoard?.columns
    .flatMap(col => col.cards)
    .filter(card => card.dueDate && new Date(card.dueDate).toDateString() === today)
    .length || 0
  
  const handleQuickAdd = (e) => {
    e.preventDefault()
    if (!quickTaskTitle.trim() || !currentBoard) return
    
    const todoColumn = currentBoard.columns.find(col => 
      col.title.toLowerCase().includes('to do') || col.title.toLowerCase() === 'todo'
    ) || currentBoard.columns[0]
    
    if (todoColumn) {
      addCard(todoColumn.id, { title: quickTaskTitle.trim() })
      setQuickTaskTitle('')
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Greeting Header */}
      <div className="animate-slide-in">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">{greeting.emoji}</span>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{greeting.greeting}</h1>
            <p className="text-muted-foreground">{greeting.message}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tasks Due Today */}
        <div className="bg-card rounded-xl p-5 border border-border animate-slide-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <span className="text-2xl font-bold text-foreground">{tasksDueToday}</span>
          </div>
          <p className="text-sm text-muted-foreground">Tasks Due Today</p>
        </div>

        {/* Pomodoros Completed */}
        <div className="bg-card rounded-xl p-5 border border-border animate-slide-in" style={{ animationDelay: '0.15s' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-secondary/10">
              <Timer className="w-5 h-5 text-secondary" />
            </div>
            <span className="text-2xl font-bold text-foreground">{pomodoroStats.pomodorosCompleted}</span>
          </div>
          <p className="text-sm text-muted-foreground">Pomodoros Today</p>
          <p className="text-xs text-muted-foreground mt-1">{pomodoroStats.totalFocusMinutes} min focused</p>
        </div>

        {/* Study Streak */}
        <div className="bg-card rounded-xl p-5 border border-border animate-slide-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <Flame className="w-5 h-5 text-accent" />
            </div>
            <span className="text-2xl font-bold text-foreground">{userData.streak}</span>
          </div>
          <p className="text-sm text-muted-foreground">Day Streak</p>
          {userData.streak > 0 && (
            <p className="text-xs text-accent mt-1">Keep it going!</p>
          )}
        </div>

        {/* XP Progress */}
        <div className="bg-card rounded-xl p-5 border border-border animate-slide-in" style={{ animationDelay: '0.25s' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg">{currentLevel.icon}</span>
              <span className="text-sm font-medium text-foreground">{currentLevel.name}</span>
            </div>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          {nextLevel && (
            <p className="text-xs text-muted-foreground mt-2">
              {nextLevel.minXp - userData.xp} XP to {nextLevel.name}
            </p>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quote of the Day */}
        <div className="lg:col-span-2 bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/10 rounded-xl p-6 border border-primary/20 animate-slide-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-start gap-3 mb-4">
            <Sparkles className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-sm font-semibold text-primary mb-3">Quote of the Day</h2>
              <blockquote className="text-xl font-medium text-foreground leading-relaxed text-balance">
                &ldquo;{dailyQuote.text}&rdquo;
              </blockquote>
              <p className="text-sm text-muted-foreground mt-3">— {dailyQuote.author}</p>
            </div>
          </div>
        </div>

        {/* Quick Add Task */}
        <div className="bg-card rounded-xl p-6 border border-border animate-slide-in" style={{ animationDelay: '0.35s' }}>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Quick Add Task
          </h2>
          <form onSubmit={handleQuickAdd} className="space-y-3">
            <input
              type="text"
              value={quickTaskTitle}
              onChange={(e) => setQuickTaskTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full px-4 py-3 bg-muted rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            <button
              type="submit"
              disabled={!quickTaskTitle.trim()}
              className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Add to Kanban
            </button>
          </form>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-in" style={{ animationDelay: '0.4s' }}>
        {[
          { id: 'kanban', label: 'Kanban Board', color: 'from-primary/20 to-primary/5', border: 'border-primary/20' },
          { id: 'whiteboard', label: 'Whiteboard', color: 'from-secondary/20 to-secondary/5', border: 'border-secondary/20' },
          { id: 'timeline', label: 'Timeline', color: 'from-accent/20 to-accent/5', border: 'border-accent/20' },
          { id: 'pomodoro', label: 'Start Focus', color: 'from-primary/20 to-secondary/5', border: 'border-primary/20' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            className={cn(
              "p-4 rounded-xl border bg-gradient-to-br transition-all duration-200 hover:scale-[1.02] hover:shadow-lg group",
              item.color,
              item.border
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">{item.label}</span>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
