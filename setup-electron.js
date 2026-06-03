#!/usr/bin/env node

/**
 * Quick Setup Script for PlanFlow Electron
 * Run this after cloning: node setup-electron.js
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 PlanFlow Electron Desktop App - Setup\n');

// Check if icon exists
const iconPath = path.join(__dirname, 'assets', 'icon.png');
if (!fs.existsSync(iconPath)) {
  console.log('⚠️  No app icon found at assets/icon.png');
  console.log('    The app will still work, but you should add a custom icon.\n');
}

// Check if main.js exists
const mainPath = path.join(__dirname, 'main.js');
if (!fs.existsSync(mainPath)) {
  console.log('❌ Error: main.js not found!');
  process.exit(1);
}

console.log('✅ Setup verified!\n');
console.log('📖 Next steps:\n');
console.log('   1. Install dependencies (if not already done):');
console.log('      $ pnpm install\n');
console.log('   2. Start development:');
console.log('      $ pnpm run electron:dev\n');
console.log('   3. Build for production:');
console.log('      $ pnpm run electron:build\n');
console.log('🎯 Global Shortcut:');
console.log('   Press Ctrl+Shift+P to toggle the Pomodoro widget from anywhere!\n');
console.log('📚 For more details, see ELECTRON_README.md\n');
console.log('Happy planning! ⏱️\n');
