'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { usePomodoro } from '@/context/pomodoro-context'
import { useUser } from '@/context/user-context'
import { getRandomQuote } from '@/lib/quotes'
import { Play, Pause, RotateCcw, X, GripVertical, Minimize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const LANG_STORAGE_KEY = 'planflow-widget-language'

export function FloatingPomodoroWidget() {
  const { 
    timerState, 
    showWidget, 
    widgetCollapsed,
    widgetPosition,
    setWidgetPosition,
    startTimer, 
    pauseTimer, 
    resetTimer,
    setShowWidget,
    toggleWidgetCollapsed,
    settings,
  } = usePomodoro()
  const { completePomodoro } = useUser()
  
  const [isDragging, setIsDragging] = useState(false)
  const [language, setLanguage] = useState('en')
  const [currentQuote, setCurrentQuote] = useState(null)
  const [quoteKey, setQuoteKey] = useState(0)
  const prevSessionRef = useRef(timerState.sessionCount)
  const prevModeRef = useRef(timerState.mode)
  const dragRef = useRef(null)
  const offsetRef = useRef({ x: 0, y: 0 })

  // Load language preference from localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem(LANG_STORAGE_KEY)
    if (savedLang === 'ar' || savedLang === 'en') {
      setLanguage(savedLang)
    }
  }, [])

  // Initialize quote on mount
  useEffect(() => {
    setCurrentQuote(getRandomQuote(language))
  }, [language])

  // Update quote when a new work session starts
  useEffect(() => {
    const isNewWorkSession = 
      timerState.mode === 'work' && 
      (prevModeRef.current !== 'work' || timerState.sessionCount !== prevSessionRef.current)
    
    if (isNewWorkSession && timerState.isRunning) {
      setCurrentQuote(getRandomQuote(language))
      setQuoteKey(prev => prev + 1)
    }
    
    prevSessionRef.current = timerState.sessionCount
    prevModeRef.current = timerState.mode
  }, [timerState.mode, timerState.sessionCount, timerState.isRunning, language])

  const handleLanguageToggle = (lang) => {
    setLanguage(lang)
    localStorage.setItem(LANG_STORAGE_KEY, lang)
    setCurrentQuote(getRandomQuote(lang))
    setQuoteKey(prev => prev + 1)
  }

  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('button')) return
    
    setIsDragging(true)
    offsetRef.current = {
      x: e.clientX - widgetPosition.x,
      y: e.clientY - widgetPosition.y,
    }
  }, [widgetPosition])

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return
    
    const newX = Math.max(0, Math.min(window.innerWidth - 200, e.clientX - offsetRef.current.x))
    const newY = Math.max(0, Math.min(window.innerHeight - 100, e.clientY - offsetRef.current.y))
    
    setWidgetPosition({ x: newX, y: newY })
  }, [isDragging, setWidgetPosition])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getModeLabel = () => {
    switch (timerState.mode) {
      case 'work': return 'Focus'
      case 'shortBreak': return 'Short Break'
      case 'longBreak': return 'Long Break'
      default: return 'Focus'
    }
  }

  const getModeColor = () => {
    switch (timerState.mode) {
      case 'work': return 'border-primary/50 bg-primary/10'
      case 'shortBreak': return 'border-secondary/50 bg-secondary/10'
      case 'longBreak': return 'border-accent/50 bg-accent/10'
      default: return 'border-primary/50 bg-primary/10'
    }
  }

  if (!showWidget) return null

  return (
    <div
      ref={dragRef}
      className={cn(
        "fixed z-[9999] select-none",
        isDragging && "cursor-grabbing"
      )}
      style={{
        left: widgetPosition.x,
        top: widgetPosition.y,
      }}
    >
      {widgetCollapsed ? (
        // Collapsed pill view
        <div
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full cursor-grab",
            "bg-card/95 backdrop-blur-md border-2 shadow-2xl",
            getModeColor()
          )}
          onMouseDown={handleMouseDown}
          onDoubleClick={toggleWidgetCollapsed}
        >
          <span className={cn(
            "font-mono font-bold text-lg",
            timerState.mode === 'work' ? "text-primary" : 
            timerState.mode === 'shortBreak' ? "text-secondary" : "text-accent"
          )}>
            {formatTime(timerState.timeRemaining)}
          </span>
          
          <button
            onClick={timerState.isRunning ? pauseTimer : startTimer}
            className="p-1 rounded-full hover:bg-muted transition-colors"
          >
            {timerState.isRunning ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </button>
        </div>
      ) : (
        // Expanded card view
        <div
          className={cn(
            "w-72 rounded-xl cursor-grab",
            "bg-card/95 backdrop-blur-md border-2 shadow-2xl",
            getModeColor()
          )}
          onMouseDown={handleMouseDown}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{getModeLabel()}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleWidgetCollapsed}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Minimize"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowWidget(false)}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Timer */}
          <div className="p-4">
            <div className="text-center mb-4">
              <span className={cn(
                "text-5xl font-mono font-bold tracking-tight",
                timerState.mode === 'work' ? "text-primary" : 
                timerState.mode === 'shortBreak' ? "text-secondary" : "text-accent"
              )}>
                {formatTime(timerState.timeRemaining)}
              </span>
              <p className="text-xs text-muted-foreground mt-1">
                Session {timerState.sessionCount + 1} / {timerState.totalSessions}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={resetTimer}
                className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                title="Reset"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={timerState.isRunning ? pauseTimer : startTimer}
                className={cn(
                  "p-3 rounded-full transition-all",
                  timerState.mode === 'work' 
                    ? "bg-primary hover:bg-primary/90" 
                    : timerState.mode === 'shortBreak'
                      ? "bg-secondary hover:bg-secondary/90"
                      : "bg-accent hover:bg-accent/90",
                  "text-white"
                )}
              >
                {timerState.isRunning ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </button>
            </div>
          </div>

          {/* Quote Section */}
          {currentQuote && (
            <div className="px-4 pb-3">
              <div 
                key={quoteKey}
                className={cn(
                  "p-3 rounded-lg bg-muted/50 animate-quote-fade",
                  language === 'ar' ? "text-right" : "text-left"
                )}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
                style={{ fontFamily: language === 'ar' ? "'Noto Naskh Arabic', sans-serif" : 'inherit' }}
              >
                <p className="text-xs text-foreground/80 leading-relaxed italic">
                  {`"${currentQuote.text}"`}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1" style={{ fontFamily: language === 'ar' ? "'Noto Naskh Arabic', sans-serif" : 'inherit' }}>
                  — {currentQuote.author}
                </p>
              </div>
              
              {/* Language Toggle */}
              <div className="flex items-center justify-center gap-1 mt-2">
                <button
                  onClick={() => handleLanguageToggle('en')}
                  className={cn(
                    "px-2 py-1 text-[10px] rounded-md transition-colors flex items-center gap-1",
                    language === 'en' 
                      ? "bg-primary/20 text-primary font-medium" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <span>🇬🇧</span>
                  <span>EN</span>
                </button>
                <button
                  onClick={() => handleLanguageToggle('ar')}
                  className={cn(
                    "px-2 py-1 text-[10px] rounded-md transition-colors flex items-center gap-1",
                    language === 'ar' 
                      ? "bg-primary/20 text-primary font-medium" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <span>🇪🇬</span>
                  <span>AR</span>
                </button>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="h-1 bg-muted/50 rounded-b-xl overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-300",
                timerState.mode === 'work' ? "bg-primary" : 
                timerState.mode === 'shortBreak' ? "bg-secondary" : "bg-accent"
              )}
              style={{
                width: `${((timerState.mode === 'work' ? settings.workDuration * 60 : 
                  timerState.mode === 'shortBreak' ? settings.shortBreakDuration * 60 : 
                  settings.longBreakDuration * 60) - timerState.timeRemaining) / 
                  (timerState.mode === 'work' ? settings.workDuration * 60 : 
                  timerState.mode === 'shortBreak' ? settings.shortBreakDuration * 60 : 
                  settings.longBreakDuration * 60) * 100}%`
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
