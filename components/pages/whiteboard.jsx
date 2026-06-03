'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { getWhiteboardData, saveWhiteboardData } from '@/lib/storage'
import { WhiteboardToolbar } from '@/components/whiteboard/whiteboard-toolbar'
import { WhiteboardCanvas } from '@/components/whiteboard/whiteboard-canvas'
import { Download, Undo2, Redo2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import html2canvas from 'html2canvas'
import { v4 as uuidv4 } from 'uuid'

const TOOLS = {
  SELECT: 'select',
  PEN: 'pen',
  ERASER: 'eraser',
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  TRIANGLE: 'triangle',
  ARROW: 'arrow',
  LINE: 'line',
  TEXT: 'text',
  STICKY: 'sticky',
}

const ERASER_MODES = {
  PIXEL: 'pixel',
  ELEMENT: 'element',
}

const DEFAULT_COLORS = [
  '#000000', '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
  '#6366f1', '#8b5cf6',
]

const STROKE_WIDTHS = [2, 4, 8, 12]

export function Whiteboard() {
  const [elements, setElements] = useState([])
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 })
  const [tool, setTool] = useState(TOOLS.PEN)
  const [color, setColor] = useState('#000000')
  const [strokeWidth, setStrokeWidth] = useState(4)
  const [selectedElement, setSelectedElement] = useState(null)
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [contextMenu, setContextMenu] = useState(null)
  const [eraserMode, setEraserMode] = useState(ERASER_MODES.PIXEL)
  
  const canvasRef = useRef(null)
  const containerRef = useRef(null)

  // Load saved data
  useEffect(() => {
    const savedData = getWhiteboardData()
    if (savedData.elements?.length) {
      setElements(savedData.elements)
      setHistory([savedData.elements])
      setHistoryIndex(0)
    }
    if (savedData.viewport) {
      setViewport(savedData.viewport)
    }
  }, [])

  // Auto-save
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveWhiteboardData({ elements, viewport })
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [elements, viewport])

  const pushToHistory = useCallback((newElements) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newElements)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }, [history, historyIndex])

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setElements(history[historyIndex - 1])
    }
  }, [history, historyIndex])

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setElements(history[historyIndex + 1])
    }
  }, [history, historyIndex])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault()
          if (e.shiftKey) {
            redo()
          } else {
            undo()
          }
        } else if (e.key === 'y') {
          e.preventDefault()
          redo()
        }
      }
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElement) {
          deleteElement(selectedElement)
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, selectedElement])

  const addElement = useCallback((element) => {
    const newElement = { ...element, id: uuidv4() }
    const newElements = [...elements, newElement]
    setElements(newElements)
    pushToHistory(newElements)
    return newElement
  }, [elements, pushToHistory])

  const updateElement = useCallback((id, updates) => {
    const newElements = elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    )
    setElements(newElements)
    pushToHistory(newElements)
  }, [elements, pushToHistory])

  const deleteElement = useCallback((id) => {
    const newElements = elements.filter(el => el.id !== id)
    setElements(newElements)
    pushToHistory(newElements)
    setSelectedElement(null)
    setContextMenu(null)
  }, [elements, pushToHistory])

  const duplicateElement = useCallback((id) => {
    const element = elements.find(el => el.id === id)
    if (element) {
      const newElement = {
        ...element,
        id: uuidv4(),
        x: element.x + 20,
        y: element.y + 20,
      }
      const newElements = [...elements, newElement]
      setElements(newElements)
      pushToHistory(newElements)
    }
    setContextMenu(null)
  }, [elements, pushToHistory])

  const bringToFront = useCallback((id) => {
    const element = elements.find(el => el.id === id)
    if (element) {
      const newElements = [...elements.filter(el => el.id !== id), element]
      setElements(newElements)
      pushToHistory(newElements)
    }
    setContextMenu(null)
  }, [elements, pushToHistory])

  const sendToBack = useCallback((id) => {
    const element = elements.find(el => el.id === id)
    if (element) {
      const newElements = [element, ...elements.filter(el => el.id !== id)]
      setElements(newElements)
      pushToHistory(newElements)
    }
    setContextMenu(null)
  }, [elements, pushToHistory])

  const handleContextMenu = useCallback((e, elementId) => {
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      elementId,
    })
    setSelectedElement(elementId)
  }, [])

  const exportAsPng = useCallback(async () => {
    if (!containerRef.current) return
    
    try {
      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: '#FFFFFF',
        scale: 2,
      })
      
      const link = document.createElement('a')
      link.download = 'whiteboard.png'
      link.href = canvas.toDataURL()
      link.click()
    } catch (error) {
      console.error('Export failed:', error)
    }
  }, [])

  const handleZoom = useCallback((delta) => {
    setViewport(prev => ({
      ...prev,
      zoom: Math.max(0.1, Math.min(3, prev.zoom + delta)),
    }))
  }, [])

  const resetView = useCallback(() => {
    setViewport({ x: 0, y: 0, zoom: 1 })
  }, [])

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed text-muted-foreground hover:text-foreground transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-5 h-5" />
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed text-muted-foreground hover:text-foreground transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleZoom(-0.1)}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-sm text-muted-foreground w-16 text-center">
            {Math.round(viewport.zoom * 100)}%
          </span>
          <button
            onClick={() => handleZoom(0.1)}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={resetView}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Reset View"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-border mx-2" />
          <button
            onClick={exportAsPng}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export PNG
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar */}
        <WhiteboardToolbar
          tool={tool}
          setTool={setTool}
          color={color}
          setColor={setColor}
          strokeWidth={strokeWidth}
          setStrokeWidth={setStrokeWidth}
          colors={DEFAULT_COLORS}
          strokeWidths={STROKE_WIDTHS}
          tools={TOOLS}
          eraserMode={eraserMode}
          setEraserMode={setEraserMode}
        />

        {/* Canvas Area */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-hidden bg-white relative"
        >
          <WhiteboardCanvas
            ref={canvasRef}
            elements={elements}
            viewport={viewport}
            setViewport={setViewport}
            tool={tool}
            color={color}
            strokeWidth={strokeWidth}
            selectedElement={selectedElement}
            setSelectedElement={setSelectedElement}
            addElement={addElement}
            updateElement={updateElement}
            deleteElement={deleteElement}
            onContextMenu={handleContextMenu}
            tools={TOOLS}
            eraserMode={eraserMode}
          />
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div 
            className="fixed z-50 bg-card rounded-lg border border-border shadow-xl animate-scale-in"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => duplicateElement(contextMenu.elementId)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors rounded-t-lg"
            >
              Duplicate
            </button>
            <button
              onClick={() => bringToFront(contextMenu.elementId)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors"
            >
              Bring to Front
            </button>
            <button
              onClick={() => sendToBack(contextMenu.elementId)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors"
            >
              Send to Back
            </button>
            <button
              onClick={() => deleteElement(contextMenu.elementId)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-destructive/10 text-destructive transition-colors rounded-b-lg"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  )
}
