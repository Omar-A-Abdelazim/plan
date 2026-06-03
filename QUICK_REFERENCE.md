# PlanFlow Electron - Quick Reference

## Commands

```bash
# Install dependencies (one time)
pnpm install

# Development mode (React + Electron)
pnpm run electron:dev

# Build for production
pnpm run electron:build
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Ctrl+Shift+P** | Toggle Pomodoro widget (works anywhere on desktop!) |
| Click app in tray → "Show/Hide" | Toggle main window |
| Click app in tray → "Open Pomodoro Widget" | Open widget |

## Project Files

| File | Purpose |
|------|---------|
| `main.js` | Electron main process, tray, shortcuts |
| `widget.js` | Floating widget window manager |
| `widget.html` | Widget UI (standalone HTML) |
| `preload.js` | Security bridge for IPC |
| `electron-config.js` | Centralized config |
| `package.json` | Scripts & electron-builder config |
| `.gitignore` | Ignores build artifacts |

## Development Workflow

1. Run `pnpm run electron:dev`
2. This starts:
   - Next.js dev server (http://localhost:3000)
   - Electron app window
3. Edit React code → auto-reload in Electron
4. Edit `main.js`, `widget.js` → restart Electron manually

## Building for Distribution

```bash
# Full production build
pnpm run electron:build

# Generates:
# - dist/PlanFlow-Setup-1.0.0.exe (Windows)
# - dist/PlanFlow-1.0.0.dmg (macOS)
# - dist/PlanFlow-1.0.0.AppImage (Linux)
```

## Widget Features

- **Draggable**: Click and drag the header
- **Always-on-Top**: Stays above all windows
- **Language Toggle**: Click flag to switch EN ↔ AR
- **Synced**: Reads timer state from localStorage
- **Quotes**: Shows motivational quotes (EN & AR)
- **Close**: Click X to hide (doesn't quit)

## localStorage Keys (Widget reads these)

| Key | Purpose |
|-----|---------|
| `pomodoroState` | Timer state: timeLeft, sessionType, isRunning |
| `quoteLanguage` | User's language preference (en or ar) |

## IPC Methods Available to React

```javascript
// In React components:
window.electron.notify('Title', 'Body')      // Desktop notification
window.electron.openWidget()                  // Show widget
window.electron.closeWidget()                 // Hide widget
window.electron.showMainWindow()              // Bring main window to front
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| App won't start | Check port 3000 is free |
| Widget doesn't appear | Press Ctrl+Shift+P or use tray menu |
| Build fails | Run `pnpm install` again |
| No notifications | Check OS notification settings |

## Architecture at a Glance

```
main.js (Electron Process)
  ├─ Main Window → Loads React App
  ├─ System Tray Menu
  ├─ Global Shortcuts (Ctrl+Shift+P)
  ├─ IPC Handler
  └─ widget.js → Widget Window → widget.html
```

## Next Steps

- [ ] Run `pnpm run electron:dev` to test
- [ ] Press Ctrl+Shift+P to see widget
- [ ] Replace `assets/icon.png` with custom icon
- [ ] Run `pnpm run electron:build` to package
- [ ] Distribute installers from `dist/` folder

---

For detailed docs, see: **ELECTRON_README.md**
