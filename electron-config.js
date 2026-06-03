/**
 * Electron configuration and environment detection
 * Used by main.js to determine dev vs production mode
 */

const isDev = require('electron-is-dev');
const path = require('path');

/**
 * Get the URL to load in the renderer process
 */
function getAppUrl() {
  if (isDev) {
    // Development: Load from Next.js dev server
    return 'http://localhost:3000';
  } else {
    // Production: Load from built static files
    return `file://${path.join(__dirname, '.next', 'standalone', '.next')}`;
  }
}

/**
 * Environment variables
 */
const config = {
  isDevelopment: isDev,
  appName: 'PlanFlow',
  appUrl: getAppUrl(),
  windowConfig: {
    mainWindow: {
      width: 1200,
      height: 800,
      minWidth: 900,
      minHeight: 600,
    },
    widget: {
      width: 300,
      height: 180,
      alwaysOnTop: true,
    },
  },
  shortcuts: {
    toggleWidget: 'ctrl+shift+p',
  },
};

module.exports = config;
