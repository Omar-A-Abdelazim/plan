'use client'

import { useState, useEffect } from 'react'
import { usePomodoro } from '@/context/pomodoro-context'
import { useKanban } from '@/context/kanban-context'
import { useUser } from '@/context/user-context'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  ChevronRight,
  ChevronLeft,
  Check,
  Coffee,
  Brain,
  Bell,
  BellOff,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'

const PRIORITY_STYLES = {
  high: 'bg-destructive/20 text-destructive',
  medium: 'bg-accent/20 text-accent',
  low: 'bg-secondary/20 text-secondary',
}

export function Pomodoro() {
  const { 
    settings, 
    timerState, 
    currentQuote,
    startTimer, 
    pauseTimer, 
    resetTimer, 
    setMode,
    updateSettings,
    nextSession,
    setOnComplete,
    requestNotificationPermission,
  } = usePomodoro()
  const { getAllTasks, markTaskAsDone } = useKanban()
  const { completeTask, completePomodoro, pomodoroStats } = useUser()
  
  const [showSettings, setShowSettings] = useState(false)
  const [showTaskPanel, setShowTaskPanel] = useState(true)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [tempSettings, setTempSettings] = useState(settings)
  const [completedTaskIds, setCompletedTaskIds] = useState(new Set())

  // Get tasks from Kanban
  const allTasks = getAllTasks()
  const activeTasks = allTasks.filter(task => !task.isDone)
  const completedToday = completedTaskIds.size

  // Set up completion handler
  useEffect(() => {
    setOnComplete((focusMinutes) => {
      if (timerState.mode === 'work') {
        completePomodoro(focusMinutes)
      }
    })
  }, [setOnComplete, completePomodoro, timerState.mode])

  // Check notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted')
    }
  }, [])

  const handleToggleNotifications = async () => {
    const granted = await requestNotificationPermission()
    setNotificationsEnabled(granted)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getProgress = () => {
    const totalSeconds = timerState.mode === 'work' 
      ? settings.workDuration * 60
      : timerState.mode === 'shortBreak'
        ? settings.shortBreakDuration * 60
        : settings.longBreakDuration * 60
    
    return ((totalSeconds - timerState.timeRemaining) / totalSeconds) * 100
  }

  const handleSaveSettings = () => {
    updateSettings(tempSettings)
    setShowSettings(false)
  }

  const handleTaskComplete = (taskId) => {
    markTaskAsDone(taskId, () => {
      completeTask()
      setCompletedTaskIds(prev => new Set([...prev, taskId]))
    })
  }

  const modeStyles = {
    work: {
      gradient: 'from-primary to-secondary',
      bg: 'bg-primary/10',
      text: 'text-primary',
      ring: 'stroke-primary',
    },
    shortBreak: {
      gradient: 'from-secondary to-primary',
      bg: 'bg-secondary/10',
      text: 'text-secondary',
      ring: 'stroke-secondary',
    },
    longBreak: {
      gradient: 'from-accent to-primary',
      bg: 'bg-accent/10',
      text: 'text-accent',
      ring: 'stroke-accent',
    },
  }

  const currentStyle = modeStyles[timerState.mode]

  return (
    <div className="h-full flex">
      {/* Main Timer Area */}
      <div className={cn(
        "flex-1 flex flex-col items-center justify-center p-8 transition-colors duration-500",
        currentStyle.bg
      )}>
        {/* Quote Display */}
        {currentQuote && timerState.mode === 'work' && (
          <div className="max-w-md text-center mb-8 animate-fade-in">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Focus Quote</span>
            </div>
            <blockquote className="text-lg text-foreground italic text-balance">
              &ldquo;{currentQuote.text}&rdquo;
            </blockquote>
            <p className="text-sm text-muted-foreground mt-2">— {currentQuote.author}</p>
          </div>
        )}

        {/* Mode Tabs */}
        <div className="flex items-center gap-2 mb-8">
          {[
            { mode: 'work', label: 'Focus', icon: Brain },
            { mode: 'shortBreak', label: 'Short Break', icon: Coffee },
            { mode: 'longBreak', label: 'Long Break', icon: Coffee },
          ].map(({ mode, label, icon: Icon }) => (
            <button
              key={mode}
              onClick={() => setMode(mode)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
                timerState.mode === mode
                  ? `${modeStyles[mode].bg} ${modeStyles[mode].text}`
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Timer Circle */}
        <div className="relative w-80 h-80 mb-8">
          {/* SVG Progress Ring */}
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-muted/30"
            />
            {/* Progress ring */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              className={cn(currentStyle.ring, "transition-all duration-300")}
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - getProgress() / 100)}`}
            />
          </svg>

          {/* Timer Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn(
              "text-7xl font-bold tracking-tight",
              currentStyle.text
            )}>
              {formatTime(timerState.timeRemaining)}
            </span>
            <span className="text-sm text-muted-foreground mt-2">
              Session {timerState.sessionCount + 1} of {timerState.totalSessions}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={resetTimer}
            className="p-3 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
            title="Reset"
          >
            <RotateCcw className="w-6 h-6" />
          </button>

          <button
            onClick={timerState.isRunning ? pauseTimer : startTimer}
            className={cn(
              "p-6 rounded-full transition-all transform hover:scale-105",
              `bg-gradient-to-br ${currentStyle.gradient} text-white shadow-lg`
            )}
          >
            {timerState.isRunning ? (
              <Pause className="w-10 h-10" />
            ) : (
              <Play className="w-10 h-10 ml-1" />
            )}
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className="p-3 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
            title="Settings"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-8 mt-8">
          <div className="text-center">
            <span className="text-3xl font-bold text-foreground">{pomodoroStats.pomodorosCompleted}</span>
            <p className="text-xs text-muted-foreground">Pomodoros Today</p>
          </div>
          <div className="w-px h-10 bg-border" />
          <div className="text-center">
            <span className="text-3xl font-bold text-foreground">{pomodoroStats.totalFocusMinutes}</span>
            <p className="text-xs text-muted-foreground">Minutes Focused</p>
          </div>
        </div>

        {/* Notification Toggle */}
        <button
          onClick={handleToggleNotifications}
          className="mt-6 flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {notificationsEnabled ? (
            <>
              <Bell className="w-4 h-4" />
              Notifications On
            </>
          ) : (
            <>
              <BellOff className="w-4 h-4" />
              Enable Notifications
            </>
          )}
        </button>
      </div>

      {/* Task Panel */}
      <div className={cn(
        "border-l border-border bg-card transition-all duration-300",
        showTaskPanel ? "w-80" : "w-12"
      )}>
        {/* Toggle Button */}
        <button
          onClick={() => setShowTaskPanel(!showTaskPanel)}
          className="w-full p-3 border-b border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          {showTaskPanel ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>

        {showTaskPanel && (
          <div className="p-4 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Tasks</h3>
              <span className="text-sm text-muted-foreground">
                {completedToday} of {activeTasks.length + completedToday} done
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-muted rounded-full mb-4 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                style={{ width: `${(completedToday / Math.max(activeTasks.length + completedToday, 1)) * 100}%` }}
              />
            </div>

            {/* Task List */}
            <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
              {activeTasks.length === 0 ? (
                <div className="text-center py-8">
                  <Check className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">All tasks complete!</p>
                </div>
              ) : (
                activeTasks.map(task => (
                  <div
                    key={task.id}
                    className="group flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <button
                      onClick={() => handleTaskComplete(task.id)}
                      className="w-5 h-5 rounded border-2 border-muted-foreground hover:border-primary hover:bg-primary/10 flex items-center justify-center transition-all flex-shrink-0 mt-0.5"
                    >
                      <Check className="w-3 h-3 text-transparent group-hover:text-primary transition-colors" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn(
                          "px-1.5 py-0.5 text-[10px] font-medium rounded",
                          PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium
                        )}>
                          {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1)}
                        </span>
                        {task.subject && (
                          <span className="text-[10px] text-muted-foreground">
                            {task.subject}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowSettings(false)}
          />
          
          <div className="relative bg-card rounded-xl border border-border shadow-2xl w-full max-w-sm mx-4 animate-scale-in">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Timer Settings</h2>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Work Duration (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={tempSettings.workDuration}
                  onChange={(e) => setTempSettings({ ...tempSettings, workDuration: parseInt(e.target.value) || 25 })}
                  className="w-full px-3 py-2 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Short Break (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={tempSettings.shortBreakDuration}
                  onChange={(e) => setTempSettings({ ...tempSettings, shortBreakDuration: parseInt(e.target.value) || 5 })}
                  className="w-full px-3 py-2 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Long Break (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={tempSettings.longBreakDuration}
                  onChange={(e) => setTempSettings({ ...tempSettings, longBreakDuration: parseInt(e.target.value) || 15 })}
                  className="w-full px-3 py-2 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Sessions before Long Break
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={tempSettings.sessionsBeforeLongBreak}
                  onChange={(e) => setTempSettings({ ...tempSettings, sessionsBeforeLongBreak: parseInt(e.target.value) || 4 })}
                  className="w-full px-3 py-2 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSettings}
                  className="flex-1 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
