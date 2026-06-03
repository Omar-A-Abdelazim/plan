'use client'

import { useState } from 'react'
import { 
  MousePointer2, 
  Pencil, 
  Eraser, 
  Square, 
  Circle, 
  ArrowRight, 
  Minus,
  Type,
  StickyNote,
  Palette,
  Triangle,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const ERASER_MODES = {
  PIXEL: 'pixel',
  ELEMENT: 'element',
}

export function WhiteboardToolbar({
  tool,
  setTool,
  color,
  setColor,
  strokeWidth,
  setStrokeWidth,
  colors,
  strokeWidths,
  tools,
  eraserMode,
  setEraserMode,
}) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [customColor, setCustomColor] = useState('#000000')

  const toolButtons = [
    { id: tools.SELECT, icon: MousePointer2, label: 'Select' },
    { id: tools.PEN, icon: Pencil, label: 'Pen' },
    { id: tools.ERASER, icon: Eraser, label: 'Eraser' },
    { id: tools.RECTANGLE, icon: Square, label: 'Rectangle' },
    { id: tools.CIRCLE, icon: Circle, label: 'Circle' },
    { id: tools.TRIANGLE, icon: Triangle, label: 'Triangle' },
    { id: tools.ARROW, icon: ArrowRight, label: 'Arrow' },
    { id: tools.LINE, icon: Minus, label: 'Line' },
    { id: tools.TEXT, icon: Type, label: 'Text' },
    { id: tools.STICKY, icon: StickyNote, label: 'Sticky Note' },
  ]

  return (
    <div className="w-14 bg-card border-r border-border flex flex-col items-center py-3 gap-1 flex-shrink-0">
      {/* Tool Buttons */}
      {toolButtons.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => setTool(id)}
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
            tool === id
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          title={label}
        >
          <Icon className="w-5 h-5" />
        </button>
      ))}

      <div className="w-8 h-px bg-border my-2" />

      {/* Eraser Mode Toggle */}
      {tool === tools.ERASER && (
        <div className="flex flex-col items-center gap-1 mb-2">
          <span className="text-[10px] text-muted-foreground">Eraser</span>
          <button
            onClick={() => setEraserMode(ERASER_MODES.PIXEL)}
            className={cn(
              "w-10 h-8 rounded-t-lg flex items-center justify-center transition-all text-xs font-medium",
              eraserMode === ERASER_MODES.PIXEL
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
            title="Pixel Eraser (freehand)"
          >
            ✏️
          </button>
          <button
            onClick={() => setEraserMode(ERASER_MODES.ELEMENT)}
            className={cn(
              "w-10 h-8 rounded-b-lg flex items-center justify-center transition-all text-xs font-medium",
              eraserMode === ERASER_MODES.ELEMENT
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
            title="Element Delete (click to remove)"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="w-8 h-px bg-border my-2" />

      {/* Stroke Width */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] text-muted-foreground mb-1">Width</span>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => setStrokeWidth(2)}
            className={cn(
              "w-10 h-7 rounded-lg flex items-center justify-center transition-all text-xs",
              strokeWidth === 2
                ? "bg-primary/20 ring-1 ring-primary"
                : "hover:bg-muted"
            )}
            title="Thin"
          >
            S
          </button>
          <button
            onClick={() => setStrokeWidth(4)}
            className={cn(
              "w-10 h-7 rounded-lg flex items-center justify-center transition-all text-xs",
              strokeWidth === 4
                ? "bg-primary/20 ring-1 ring-primary"
                : "hover:bg-muted"
            )}
            title="Medium"
          >
            M
          </button>
          <button
            onClick={() => setStrokeWidth(8)}
            className={cn(
              "w-10 h-7 rounded-lg flex items-center justify-center transition-all text-xs",
              strokeWidth === 8
                ? "bg-primary/20 ring-1 ring-primary"
                : "hover:bg-muted"
            )}
            title="Thick"
          >
            L
          </button>
          <button
            onClick={() => setStrokeWidth(12)}
            className={cn(
              "w-10 h-7 rounded-lg flex items-center justify-center transition-all text-xs",
              strokeWidth === 12
                ? "bg-primary/20 ring-1 ring-primary"
                : "hover:bg-muted"
            )}
            title="Extra Thick"
          >
            XL
          </button>
        </div>
      </div>

      <div className="w-8 h-px bg-border my-2" />

      {/* Color Selection */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] text-muted-foreground mb-1">Color</span>
        
        {/* Current Color */}
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="w-10 h-10 rounded-lg border-2 border-border hover:border-primary transition-colors flex items-center justify-center"
          title="Color Picker"
        >
          <div 
            className="w-6 h-6 rounded-md"
            style={{ backgroundColor: color }}
          />
        </button>

        {/* Color Palette */}
        {showColorPicker && (
          <div className="absolute left-16 top-1/3 bg-card rounded-lg border border-border shadow-xl p-3 z-50 animate-scale-in">
            <div className="grid grid-cols-4 gap-2 mb-3">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setColor(c)
                    setShowColorPicker(false)
                  }}
                  className={cn(
                    "w-7 h-7 rounded-lg border-2 transition-all hover:scale-110",
                    color === c ? "border-primary ring-2 ring-primary/30" : "border-transparent"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            
            {/* Custom Color Input */}
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <input
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <input
                type="text"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                placeholder="#000000"
                className="flex-1 px-2 py-1 text-xs bg-muted rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={() => {
                  setColor(customColor)
                  setShowColorPicker(false)
                }}
                className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Use
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
