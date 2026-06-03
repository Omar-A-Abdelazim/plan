# Widget Rebuild - Architecture Overview

## Summary
The Pomodoro widget has been completely rebuilt from scratch with a clean, maintainable architecture. The old broken widget system with circular dependencies and state duplication has been replaced with a single-source-of-truth pattern using IPC for real-time synchronization.

## What Changed

### Deleted Files
- **`components/widget-settings.jsx`** - Old broken settings component
- **`widget.js`** - Old broken widget factory (had `require('./widget')` circular dependency)

### Updated Files

#### 1. **`components/pages/pomodoro.jsx`**
- Removed `WidgetSettingsButton` import and usage
- Context is now the single source of truth
- No widget-specific state or UI

#### 2. **`context/pomodoro-context.jsx`** ✨ Key Changes
```javascript
// New state additions:
const [tasks, setTasks] = useState([])
const [language, setLanguage] = useState('en')

// New functionality:
- addTask(task)
- removeTask(taskId)
- toggleTaskComplete(taskId)
- setLanguage(lang)
- setTasksArray(tasks)

// NEW: State broadcasting via IPC
useEffect(() => {
  if (typeof window !== 'undefined' && window.electronAPI) {
    const state = {
      timerState,
      settings,
      currentQuote,
      tasks,
      language,
    }
    window.electronAPI.updateWidgetState(state)
  }
}, [timerState, settings, currentQuote, tasks, language])
```

#### 3. **`main.js`** ✨ Simplified & Enhanced
```javascript
// Unified createWidgetWindow() function
// Removed broken external widget.js import
// Added IPC handlers:
ipcMain.on('update-widget-state', (event, state) => {
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    widgetWindow.webContents.send('widget-state-update', state)
  }
})

ipcMain.on('widget-action', (event, action) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('widget-action', action)
  }
})
```

#### 4. **`preload.js`** ✨ New APIs
```javascript
// State synchronization APIs:
updateWidgetState: (state) => ipcRenderer.send('update-widget-state', state)
onWidgetStateUpdate: (callback) => ipcRenderer.on('widget-state-update', callback)
onWidgetAction: (callback) => ipcRenderer.on('widget-action', callback)
sendWidgetAction: (action) => ipcRenderer.send('widget-action', action)
```

#### 5. **`widget.html`** ✨ Complete Rewrite
New standalone HTML widget with:
- **Draggable header** (only the title bar is draggable, buttons are not)
- **Standalone timer logic** (independent of main app)
- **Task management** (add, complete, delete tasks)
- **Language support** (EN/AR with proper quote pools)
- **Real-time state sync** via IPC
- **Clean vanilla JS** (no frameworks)
- **Responsive design** with clamp() for scaling
- **Color-coded modes** (Work = Purple, Short Break = Blue, Long Break = Orange)

Key features:
```javascript
// State in widget
let widgetState = {
  timerState: { mode, timeRemaining, isRunning, sessionCount, totalSessions },
  settings: { workDuration, shortBreakDuration, longBreakDuration, sessionsBeforeLongBreak },
  currentQuote: null,
  tasks: [],
  language: 'en' || 'ar'
}

// IPC listener for state updates from main app
window.electronAPI.onWidgetStateUpdate((state) => {
  widgetState = state
  currentQuote = widgetState.currentQuote || getRandomQuote()
  render()
})
```

## Architecture Flow

```
┌──────────────────────────────────────────┐
│   Main App (React)                       │
│   PomodoroContext (Single Source)        │
│   - timerState                           │
│   - settings                             │
│   - currentQuote                         │
│   - tasks                                │
│   - language                             │
└──────────┬───────────────────────────────┘
           │ useEffect broadcasts state via IPC
           │ window.electronAPI.updateWidgetState(state)
           │
           ├─────────────────────────────────────────────┐
           │                                             │
           ↓                                             ↓
    ┌────────────────┐                        ┌──────────────────┐
    │ Main Process   │                        │ Widget Process   │
    │                │                        │                  │
    │ main.js        │ ◄──── IPC Sync ────►   │ widget.html      │
    │                │                        │                  │
    │ ipcMain        │                        │ - Independent    │
    │ handlers       │                        │   timer logic    │
    │                │                        │ - Task UI        │
    └────────────────┘                        │ - Quote display  │
                                              │ - Language toggle│
                                              └──────────────────┘

User actions in widget → Send to main → Update context → Broadcast to widget
```

## Key Improvements

### ✅ Before (Broken)
- Circular dependency: `widget.js` required other modules that tried to import `widget.js`
- Duplicate state: Timer state existed in both main app and widget
- No real-time sync: Changes in one didn't reflect in the other
- Complex nested components with prop drilling
- Settings UI component that didn't work

### ✅ After (Clean)
- **Single Source of Truth**: PomodoroContext in main app is authoritative
- **IPC-Based Sync**: Widget subscribes to state updates
- **Independent Widget**: Can run standalone timer without main app interference
- **Real-Time Updates**: State changes broadcast instantly to widget
- **Clean Separation**: Widget is pure HTML/JS, no React dependency
- **Task Management**: Full task CRUD operations
- **Language Support**: EN/AR with proper locale handling
- **No Duplicates**: State doesn't exist in multiple places

## How to Use

### Starting the Widget
```javascript
// From tray menu: "Open Pomodoro Widget"
// Or: Ctrl+Shift+P hotkey
// Or: From main app IPC
window.electronAPI.openWidget()
```

### Widget Operations
1. **Start/Pause**: Click the play/pause button
2. **Reset**: Click reset to go back to start
3. **Add Tasks**: Type task name and click "Add" or press Enter
4. **Complete Task**: Check the checkbox
5. **Delete Task**: Click the × button
6. **Language**: Toggle EN/AR buttons
7. **Close**: Click the × in the header

### Main App to Widget Sync
The widget receives state updates automatically whenever:
- Timer ticks
- Settings change
- Quote changes
- Tasks are added/removed
- Mode switches

## Testing

To verify the rebuild works:

1. **Main App**: Start the main Pomodoro timer
2. **Widget**: Open widget with Ctrl+Shift+P
3. **Sync Test**: Timer should match between windows
4. **Task Test**: Add task in widget, should update
5. **Language**: Change to AR, quotes should update
6. **Dragging**: Header should be draggable, buttons should be clickable

## Files Structure After Rebuild

```
project/
├── main.js (updated)
├── preload.js (updated)
├── widget.html (new, complete rewrite)
├── context/
│   └── pomodoro-context.jsx (updated)
├── components/
│   ├── pages/
│   │   └── pomodoro.jsx (updated)
│   └── widgets/
│       └── floating-pomodoro.jsx (unchanged, not used)
```

**Note**: `floating-pomodoro.jsx` is not used anywhere and can be safely removed in a future cleanup.

## Future Improvements

1. **Persistence**: Save widget position/size to localStorage
2. **Multi-Language**: Add more languages beyond EN/AR
3. **Themes**: Multiple color schemes
4. **Notifications**: Desktop notifications on timer complete
5. **Statistics**: Show completed sessions in widget
6. **Shortcuts**: Keyboard shortcuts in widget
