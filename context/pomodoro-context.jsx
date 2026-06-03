'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { getPomodoroSettings, savePomodoroSettings } from '@/lib/storage'
import { getRandomQuote } from '@/lib/quotes'

const PomodoroContext = createContext(undefined)

// Utility to broadcast state to widget
const broadcastToWidget = (state) => {
  if (window.electronAPI?.ipcSend) {
    window.electronAPI.ipcSend('pomodoro-state-update', state)
  }
}

export function PomodoroProvider({ children }) {
  const [settings, setSettings] = useState({
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsBeforeLongBreak: 4,
  })
  
  const [timerState, setTimerState] = useState({
    mode: 'work', // 'work', 'shortBreak', 'longBreak'
    timeRemaining: 25 * 60, // in seconds
    isRunning: false,
    sessionCount: 0,
    totalSessions: 4,
  })
  
  const [currentQuote, setCurrentQuote] = useState(null)
  const [showWidget, setShowWidget] = useState(false)
  const [widgetCollapsed, setWidgetCollapsed] = useState(false)
  const [widgetPosition, setWidgetPosition] = useState({ x: 20, y: 20 })
  
  const intervalRef = useRef(null)
  const onCompleteRef = useRef(null)

  useEffect(() => {
    const saved = getPomodoroSettings()
    setSettings(saved)
    setTimerState(prev => ({
      ...prev,
      timeRemaining: saved.workDuration * 60,
      totalSessions: saved.sessionsBeforeLongBreak,
    }))
  }, [])

  // Broadcast timer state to widget
  useEffect(() => {
    broadcastToWidget(timerState)
  }, [timerState])

  // Timer logic
  useEffect(() => {
    if (timerState.isRunning) {
      intervalRef.current = setInterval(() => {
        setTimerState(prev => {
          if (prev.timeRemaining <= 1) {
            clearInterval(intervalRef.current)
            // Timer completed
            handleTimerComplete()
            return { ...prev, timeRemaining: 0, isRunning: false }
          }
          return { ...prev, timeRemaining: prev.timeRemaining - 1 }
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [timerState.isRunning])

  const handleTimerComplete = useCallback(() => {
    // Play notification sound
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleRsAW8yW6GJ6FgUyuI/weX8RCT2vjvCXdQ8/4YKE+YpYRTxupIT8iVpIPnOog/5+N3l0lov5bz92epqH/Hk7fniWi/x7P4B7lIn8fjyBe5SI/X49gnuThfx+PYJ7k4X8fT2BepOF/H09gHqThvx9PX96lIb8fD19eZWH/Hw9fHmWh/x7PHt5loj8ezx6eJeI/Ho8eniYiPx5O3l3mYn8eTt4d5qJ/Hg7d3eaivx3O3Z2m4r8dzt1dZuL/HY7dHScjPx2OnN0nI38dTpyc52N/HU6cXOejvx0Om9yn478czptcp+P/HI6bHGgkPxyOmpwoZH8cjppcaGR/HE6aHCikvxwOWdvopP8cDlmb6OU/G86ZW6klPxuOWRtpZX8bjljbaWW/G45Ym2mlvxtOGFsppf8bDhga6eY/Gw4X2qnmPxrOF5qqJn8azhcaaiZ/Go4W2ipmvxpN1poqpv8aTdZZ6qb/Gg3WGeqnPxoN1dnq5z8ZzZWZqud/GY2VWWsnf5lNlRlrJ7+ZDVTZKye/mQ1UmOtn/5jNVFjrZ/+YjRQYq6g/mI0T2GuoP5hNE5hrqH+YDRNYQ==')
      audio.volume = 0.5
      audio.play().catch(() => {})
    } catch (e) {}
    
    // Browser notification
    if (Notification.permission === 'granted') {
      new Notification('PlanFlow Timer', {
        body: timerState.mode === 'work' 
          ? 'Work session complete! Time for a break.'
          : 'Break is over! Ready to focus?',
        icon: '/favicon.ico',
      })
    }
    
    if (onCompleteRef.current) {
      onCompleteRef.current(settings.workDuration)
    }
  }, [timerState.mode, settings.workDuration])

  const startTimer = useCallback(() => {
    // Show quote at start of work session
    if (timerState.mode === 'work' && !timerState.isRunning) {
      setCurrentQuote(getRandomQuote())
    }
    setTimerState(prev => ({ ...prev, isRunning: true }))
  }, [timerState.mode, timerState.isRunning])

  const pauseTimer = useCallback(() => {
    setTimerState(prev => ({ ...prev, isRunning: false }))
  }, [])

  const resetTimer = useCallback(() => {
    const duration = timerState.mode === 'work' 
      ? settings.workDuration 
      : timerState.mode === 'shortBreak'
        ? settings.shortBreakDuration
        : settings.longBreakDuration
    
    setTimerState(prev => ({
      ...prev,
      timeRemaining: duration * 60,
      isRunning: false,
    }))
  }, [timerState.mode, settings])

  const setMode = useCallback((mode) => {
    const duration = mode === 'work' 
      ? settings.workDuration 
      : mode === 'shortBreak'
        ? settings.shortBreakDuration
        : settings.longBreakDuration
    
    setTimerState(prev => ({
      ...prev,
      mode,
      timeRemaining: duration * 60,
      isRunning: false,
    }))
    
    if (mode === 'work') {
      setCurrentQuote(getRandomQuote())
    }
  }, [settings])

  const updateSettings = useCallback((newSettings) => {
    setSettings(newSettings)
    savePomodoroSettings(newSettings)
    
    // Update current timer if not running
    if (!timerState.isRunning) {
      const duration = timerState.mode === 'work' 
        ? newSettings.workDuration 
        : timerState.mode === 'shortBreak'
          ? newSettings.shortBreakDuration
          : newSettings.longBreakDuration
      
      setTimerState(prev => ({
        ...prev,
        timeRemaining: duration * 60,
        totalSessions: newSettings.sessionsBeforeLongBreak,
      }))
    }
  }, [timerState.isRunning, timerState.mode])

  const nextSession = useCallback(() => {
    setTimerState(prev => {
      const newSessionCount = prev.mode === 'work' ? prev.sessionCount + 1 : prev.sessionCount
      const isLongBreak = newSessionCount >= settings.sessionsBeforeLongBreak
      
      if (prev.mode === 'work') {
        // Move to break
        const breakMode = isLongBreak ? 'longBreak' : 'shortBreak'
        const breakDuration = isLongBreak ? settings.longBreakDuration : settings.shortBreakDuration
        return {
          ...prev,
          mode: breakMode,
          timeRemaining: breakDuration * 60,
          isRunning: false,
          sessionCount: isLongBreak ? 0 : newSessionCount,
        }
      } else {
        // Move to work
        setCurrentQuote(getRandomQuote())
        return {
          ...prev,
          mode: 'work',
          timeRemaining: settings.workDuration * 60,
          isRunning: false,
        }
      }
    })
  }, [settings])

  const setOnComplete = useCallback((callback) => {
    onCompleteRef.current = callback
  }, [])

  const toggleWidget = useCallback(() => {
    setShowWidget(prev => !prev)
  }, [])

  const toggleWidgetCollapsed = useCallback(() => {
    setWidgetCollapsed(prev => !prev)
  }, [])

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return false
  }, [])

  return (
    <PomodoroContext.Provider value={{
      settings,
      timerState,
      currentQuote,
      showWidget,
      widgetCollapsed,
      widgetPosition,
      setWidgetPosition,
      startTimer,
      pauseTimer,
      resetTimer,
      setMode,
      updateSettings,
      nextSession,
      setOnComplete,
      toggleWidget,
      toggleWidgetCollapsed,
      setShowWidget,
      requestNotificationPermission,
    }}>
      {children}
    </PomodoroContext.Provider>
  )
}

export function usePomodoro() {
  const context = useContext(PomodoroContext)
  if (context === undefined) {
    throw new Error('usePomodoro must be used within a PomodoroProvider')
  }
  return context
}
