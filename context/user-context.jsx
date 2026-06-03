'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { getUserData, saveUserData, getPomodoroStats, savePomodoroStats } from '@/lib/storage'
import { XP_REWARDS, calculateLevel, getNextLevel } from '@/lib/xp'
import confetti from 'canvas-confetti'

const UserContext = createContext(undefined)

export function UserProvider({ children }) {
  const [userData, setUserData] = useState({
    xp: 0,
    level: 1,
    streak: 0,
    lastActiveDate: null,
    lastPomodoroDate: null,
  })
  const [pomodoroStats, setPomodoroStats] = useState({
    date: new Date().toDateString(),
    pomodorosCompleted: 0,
    totalFocusMinutes: 0,
  })
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [newLevel, setNewLevel] = useState(null)
  const prevLevelRef = useRef(null)

  useEffect(() => {
    const savedUserData = getUserData()
    const savedPomodoroStats = getPomodoroStats()
    setUserData(savedUserData)
    setPomodoroStats(savedPomodoroStats)
    prevLevelRef.current = calculateLevel(savedUserData.xp)
  }, [])

  const checkLevelUp = useCallback((newXp) => {
    const oldLevel = prevLevelRef.current
    const currentLevel = calculateLevel(newXp)
    
    if (oldLevel && currentLevel.name !== oldLevel.name) {
      setNewLevel(currentLevel)
      setShowLevelUp(true)
      
      // Celebration confetti
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#7B2FBE', '#4361EE', '#F77F00'],
      })
      
      setTimeout(() => setShowLevelUp(false), 3000)
    }
    
    prevLevelRef.current = currentLevel
  }, [])

  const addXp = useCallback((amount, reason) => {
    setUserData(prev => {
      const newXp = prev.xp + amount
      const newData = {
        ...prev,
        xp: newXp,
        lastActiveDate: new Date().toDateString(),
      }
      saveUserData(newData)
      checkLevelUp(newXp)
      return newData
    })
  }, [checkLevelUp])

  const completeTask = useCallback(() => {
    addXp(XP_REWARDS.TASK_COMPLETED, 'task')
  }, [addXp])

  const completePomodoro = useCallback((focusMinutes) => {
    const today = new Date().toDateString()
    
    setUserData(prev => {
      const isNewDay = prev.lastPomodoroDate !== today
      const newStreak = isNewDay ? prev.streak + 1 : prev.streak
      
      const newData = {
        ...prev,
        xp: prev.xp + XP_REWARDS.POMODORO_COMPLETED,
        streak: newStreak,
        lastActiveDate: today,
        lastPomodoroDate: today,
      }
      saveUserData(newData)
      checkLevelUp(newData.xp)
      return newData
    })
    
    setPomodoroStats(prev => {
      const newStats = {
        date: today,
        pomodorosCompleted: prev.date === today ? prev.pomodorosCompleted + 1 : 1,
        totalFocusMinutes: prev.date === today ? prev.totalFocusMinutes + focusMinutes : focusMinutes,
      }
      savePomodoroStats(newStats)
      return newStats
    })
  }, [checkLevelUp])

  const dismissLevelUp = useCallback(() => {
    setShowLevelUp(false)
  }, [])

  return (
    <UserContext.Provider value={{
      userData,
      pomodoroStats,
      addXp,
      completeTask,
      completePomodoro,
      showLevelUp,
      newLevel,
      dismissLevelUp,
    }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
