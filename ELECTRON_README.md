# PlanFlow - Electron Desktop App

A powerful productivity suite with Kanban board, Pomodoro timer, whiteboard, notes, and more—now available as a native desktop application!

## Features

- **Dashboard**: Motivational quotes, XP progress bar, study streak tracking
- **Kanban Board**: Drag-and-drop task management with drag-and-drop cards and confetti rewards
- **Whiteboard**: Digital drawing canvas with shapes, text, sticky notes, and full undo/redo
- **Notes & Docs**: Rich text editor with Tiptap for formatted notes
- **Pomodoro Timer**: Work/break sessions with native desktop notifications and quotes
- **Floating Widget**: Always-on-top Pomodoro timer that stays visible across your desktop
- **Language Support**: English and Arabic (العربية) with RTL support

## Desktop-Specific Features

- System tray integration with quick access menu
- Always-on-top floating Pomodoro widget (draggable, always visible)
- Native OS notifications when Pomodoro sessions complete
- Global keyboard shortcut: **Ctrl+Shift+P** to toggle the Pomodoro widget
- Works offline with localStorage persistence
- One-click installers for Windows, Mac, and Linux

## Getting Started

### Prerequisites

- Node.js 16+ and npm/pnpm
- Git

### Installation

1. Clone or download the project:
```bash
git clone <your-repo>
cd planflow
```

2. Install dependencies:
```bash
pnpm install
```

### Development

Run the app in development mode (React dev server + Electron together):

```bash
pnpm run electron:dev
```

This will:
1. Start the Next.js dev server on `http://localhost:3000`
2. Open the Electron app window
3. Hot reload on code changes

**Keyboard Shortcut**: Press `Ctrl+Shift+P` to open the floating Pomodoro widget from anywhere on your desktop.

### Building & Packaging

Build the app for production:

```bash
pnpm run electron:build
```

This will:
1. Build the Next.js app for production
2. Package it with Electron
3. Generate installers for your platform:
   - **Windows**: NSIS installer (.exe)
   - **macOS**: DMG installer (.dmg)
   - **Linux**: AppImage (.AppImage)

Installers will be in the `dist/` directory.

## Project Structure

```
.
├── main.js              # Electron main process
├── widget.js            # Floating widget window manager
├── widget.html          # Standalone Pomodoro widget UI
├── preload.js           # IPC security bridge
├── app/                 # Next.js app directory
├── components/          # React components
├── context/             # React context (state management)
├── lib/                 # Utilities (quotes, storage, etc.)
├── assets/              # App icon
└── package.json         # Dependencies & scripts
```

## Key Files

- **main.js**: Electron entry point. Manages main window, tray menu, global shortcuts, and IPC handlers
- **widget.js**: Creates the always-on-top floating Pomodoro window
- **widget.html**: Standalone Pomodoro UI with quotes and language toggle (reads localStorage)
- **preload.js**: Exposes safe IPC methods: `electron.notify()`, `electron.closeWidget()`, `electron.showMainWindow()`
- **package.json**: Contains electron-builder configuration for multi-platform builds

## Configuration

### Tray Menu

Right-click the system tray icon to:
- Show/Hide the main window
- Open the Pomodoro widget
- Quit the app

### Always-On-Top Widget

- Positioned at bottom-right on first launch
- Draggable by the header
- Press `Ctrl+Shift+P` or click "Open Pomodoro Widget" in tray menu
- Click the X button to hide (not quit)
- Syncs timer state with main app via localStorage

### Language Toggle

- Click the flag emoji (🇬🇧 EN / 🇪🇬 AR) in the widget to switch languages
- Persists in localStorage
- Arabic quotes are authentic Islamic and Arabic sayings
- Arabic text renders right-to-left automatically

## Development Notes

### React & Next.js

The Electron layer is completely separate from the React app:
- No modifications to React code needed
- Electron loads the Next.js app in development or pre-built static files in production
- All localStorage data is shared between main app and widget

### IPC Communication

The app uses Electron's IPC (Inter-Process Communication) for secure communication:

```javascript
// In React components:
window.electron.notify('Title', 'Body')        // Send desktop notification
window.electron.openWidget()                    // Open widget window
window.electron.closeWidget()                   // Hide widget window
```

### Icon

Replace `assets/icon.png` with your own icon (recommended size: 512x512 or 256x256 PNG).

## Troubleshooting

### The app doesn't start in development

1. Make sure port 3000 is available
2. Check that React dev server started: `http://localhost:3000`
3. Try clearing `node_modules` and reinstalling: `rm -rf node_modules && pnpm install`

### Widget doesn't appear

- Ensure you're pressing `Ctrl+Shift+P` or using the tray menu
- Check that the main app window is running
- Look at the taskbar for the Electron app window

### Notifications don't work

- On Linux, ensure a notification daemon is running (e.g., `dunst`)
- On macOS, check System Preferences > Notifications
- On Windows, ensure notifications are enabled in system settings

### Build fails on Linux

- You may need to install dependencies: `sudo apt-get install build-essential libx11-dev`
- On Fedora: `sudo dnf install gcc gcc-c++ make libx11-devel`

## Future Enhancements

- [ ] Auto-updater integration with GitHub releases
- [ ] Sync state across multiple devices
- [ ] Dark mode toggle
- [ ] Custom theme colors
- [ ] Plugin system

## License

MIT

## Contributing

Contributions welcome! Please fork and submit a pull request.

---

**Happy planning! ⏱️**
