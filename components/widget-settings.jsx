'use client'

import { useState, useEffect } from 'react'
import { Settings, Eye, Circle, Maximize2, Check, X } from 'lucide-react'

export function WidgetSettings() {
  const [config, setConfig] = useState({
    backgroundColor: 'rgba(31, 31, 46, 0.85)',
    backdropBlur: 20,
    borderColor: 'rgba(123, 47, 190, 0.3)',
    borderRadius: 16,
    borderWidth: 1,
    shadowIntensity: 1,
    accentColor: '#c39af0',
  })

  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Load saved widget config from localStorage
    const saved = localStorage.getItem('widget-config')
    if (saved) {
      try {
        setConfig(JSON.parse(saved))
      } catch (e) {
        // Use defaults
      }
    }
  }, [])

  const handleSave = () => {
    localStorage.setItem('widget-config', JSON.stringify(config))
    // Broadcast to widget via IPC
    if (window.electronAPI?.ipcSend) {
      window.electronAPI.ipcSend('widget-config-update', config)
    }
    setIsOpen(false)
  }

  const handleReset = () => {
    const defaults = {
      backgroundColor: 'rgba(31, 31, 46, 0.85)',
      backdropBlur: 20,
      borderColor: 'rgba(123, 47, 190, 0.3)',
      borderRadius: 16,
      borderWidth: 1,
      shadowIntensity: 1,
      accentColor: '#c39af0',
    }
    setConfig(defaults)
  }

  const parseRgba = (rgba) => {
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    if (match) {
      return `#${parseInt(match[1]).toString(16).padStart(2, '0')}${parseInt(match[2]).toString(16).padStart(2, '0')}${parseInt(match[3]).toString(16).padStart(2, '0')}`
    }
    return '#1f1f2e'
  }

  const rgbaToHex = (rgba) => parseRgba(rgba)
  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
        title="Widget Settings"
      >
        <Settings size={18} />
        Widget Settings
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg p-6 max-w-md w-full mx-4 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Settings size={20} />
            Widget Appearance
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-muted rounded"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Background Color */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Circle size={14} />
              Background Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={rgbaToHex(config.backgroundColor)}
                onChange={(e) => {
                  const alpha = config.backgroundColor.match(/[\d.]+\)$/)?.[0]?.match(/[\d.]+/)?.[0] || '0.85'
                  setConfig({
                    ...config,
                    backgroundColor: hexToRgba(e.target.value, alpha),
                  })
                }}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={parseFloat(config.backgroundColor.match(/[\d.]+\)$/)?.[0]?.match(/[\d.]+/)?.[0] || '0.85')}
                onChange={(e) => {
                  const hex = rgbaToHex(config.backgroundColor)
                  setConfig({
                    ...config,
                    backgroundColor: hexToRgba(hex, e.target.value),
                  })
                }}
                className="flex-1"
                title="Opacity"
              />
              <span className="text-xs text-muted-foreground w-12 text-right">
                {Math.round(parseFloat(config.backgroundColor.match(/[\d.]+\)$/)?.[0]?.match(/[\d.]+/)?.[0] || '0.85') * 100)}%
              </span>
            </div>
          </div>

          {/* Backdrop Blur */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Backdrop Blur: {config.backdropBlur}px</label>
            <input
              type="range"
              min="0"
              max="40"
              step="2"
              value={config.backdropBlur}
              onChange={(e) => setConfig({ ...config, backdropBlur: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Accent Color */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Circle size={14} />
              Accent Color
            </label>
            <input
              type="color"
              value={config.accentColor}
              onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
              className="w-full h-10 rounded cursor-pointer"
            />
          </div>

          {/* Border Radius */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Maximize2 size={14} />
              Border Radius: {config.borderRadius}px
            </label>
            <input
              type="range"
              min="0"
              max="24"
              step="2"
              value={config.borderRadius}
              onChange={(e) => setConfig({ ...config, borderRadius: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Border Width */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Border Width: {config.borderWidth}px</label>
            <input
              type="range"
              min="0"
              max="3"
              step="0.5"
              value={config.borderWidth}
              onChange={(e) => setConfig({ ...config, borderWidth: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Shadow Intensity */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Eye size={14} />
              Shadow: {Math.round(config.shadowIntensity * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.shadowIntensity}
              onChange={(e) => setConfig({ ...config, shadowIntensity: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>

        {/* Preview */}
        <div className="p-4 rounded-lg border border-border bg-muted/50">
          <p className="text-xs text-muted-foreground mb-3">Preview</p>
          <div
            className="h-24 rounded flex items-center justify-center text-sm text-foreground"
            style={{
              background: config.backgroundColor,
              backdropFilter: `blur(${config.backdropBlur}px)`,
              border: `${config.borderWidth}px solid ${config.borderColor}`,
              borderRadius: `${config.borderRadius}px`,
              boxShadow: `0 8px ${32 * config.shadowIntensity}px rgba(0,0,0,${0.3 * config.shadowIntensity})`,
              color: config.accentColor,
            }}
          >
            Widget Preview
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 rounded-lg bg-primary hover:bg-primary/80 text-primary-foreground transition-colors flex items-center justify-center gap-2"
          >
            <Check size={16} />
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
