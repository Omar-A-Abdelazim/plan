// localStorage utility functions for PlanFlow

const STORAGE_KEYS = {
  KANBAN_BOARDS: 'planflow_kanban_boards',
  NOTES: 'planflow_notes',
  NOTES_FOLDERS: 'planflow_notes_folders',
  WHITEBOARD: 'planflow_whiteboard',
  TIMELINE_TASKS: 'planflow_timeline_tasks',
  POMODORO_SETTINGS: 'planflow_pomodoro_settings',
  POMODORO_STATS: 'planflow_pomodoro_stats',
  USER_DATA: 'planflow_user_data',
  THEME: 'planflow_theme',
}

export function getFromStorage(key, defaultValue = null) {
  if (typeof window === 'undefined') return defaultValue
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error)
    return defaultValue
  }
}

export function saveToStorage(key, value) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Error saving to localStorage key "${key}":`, error)
  }
}

export function removeFromStorage(key) {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error(`Error removing from localStorage key "${key}":`, error)
  }
}

// Kanban
export function getKanbanBoards() {
  return getFromStorage(STORAGE_KEYS.KANBAN_BOARDS, [
    {
      id: 'default',
      name: 'My Board',
      columns: [
        { id: 'todo', title: 'To Do', cards: [] },
        { id: 'in-progress', title: 'In Progress', cards: [] },
        { id: 'done', title: 'Done', cards: [] },
      ],
    },
  ])
}

export function saveKanbanBoards(boards) {
  saveToStorage(STORAGE_KEYS.KANBAN_BOARDS, boards)
}

// Notes
export function getNotes() {
  return getFromStorage(STORAGE_KEYS.NOTES, [])
}

export function saveNotes(notes) {
  saveToStorage(STORAGE_KEYS.NOTES, notes)
}

export function getNotesFolders() {
  return getFromStorage(STORAGE_KEYS.NOTES_FOLDERS, [
    { id: 'all', name: 'All Notes' },
  ])
}

export function saveNotesFolders(folders) {
  saveToStorage(STORAGE_KEYS.NOTES_FOLDERS, folders)
}

// Whiteboard
export function getWhiteboardData() {
  return getFromStorage(STORAGE_KEYS.WHITEBOARD, {
    elements: [],
    viewport: { x: 0, y: 0, zoom: 1 },
  })
}

export function saveWhiteboardData(data) {
  saveToStorage(STORAGE_KEYS.WHITEBOARD, data)
}

// Timeline
export function getTimelineTasks() {
  return getFromStorage(STORAGE_KEYS.TIMELINE_TASKS, [])
}

export function saveTimelineTasks(tasks) {
  saveToStorage(STORAGE_KEYS.TIMELINE_TASKS, tasks)
}

// Pomodoro
export function getPomodoroSettings() {
  return getFromStorage(STORAGE_KEYS.POMODORO_SETTINGS, {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsBeforeLongBreak: 4,
  })
}

export function savePomodoroSettings(settings) {
  saveToStorage(STORAGE_KEYS.POMODORO_SETTINGS, settings)
}

export function getPomodoroStats() {
  const today = new Date().toDateString()
  const stats = getFromStorage(STORAGE_KEYS.POMODORO_STATS, {
    date: today,
    pomodorosCompleted: 0,
    totalFocusMinutes: 0,
  })
  
  // Reset daily stats if it's a new day
  if (stats.date !== today) {
    return {
      date: today,
      pomodorosCompleted: 0,
      totalFocusMinutes: 0,
    }
  }
  
  return stats
}

export function savePomodoroStats(stats) {
  saveToStorage(STORAGE_KEYS.POMODORO_STATS, stats)
}

// User Data (XP, streak, etc.)
export function getUserData() {
  const today = new Date().toDateString()
  const data = getFromStorage(STORAGE_KEYS.USER_DATA, {
    xp: 0,
    level: 1,
    streak: 0,
    lastActiveDate: null,
    lastPomodoroDate: null,
  })
  
  // Check streak
  if (data.lastPomodoroDate) {
    const lastDate = new Date(data.lastPomodoroDate)
    const todayDate = new Date(today)
    const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24))
    
    if (diffDays > 1) {
      // Streak broken
      data.streak = 0
    }
  }
  
  return data
}

export function saveUserData(data) {
  saveToStorage(STORAGE_KEYS.USER_DATA, data)
}

// Theme
export function getTheme() {
  return getFromStorage(STORAGE_KEYS.THEME, 'dark')
}

export function saveTheme(theme) {
  saveToStorage(STORAGE_KEYS.THEME, theme)
}

export { STORAGE_KEYS }
