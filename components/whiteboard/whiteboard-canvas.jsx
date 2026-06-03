'use client'

import { forwardRef, useState, useRef, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'

const STICKY_COLORS = ['#fef08a', '#bbf7d0', '#bfdbfe', '#f9a8d4', '#fecaca']

const ERASER_MODES = {
  PIXEL: 'pixel',      // Freehand eraser
  ELEMENT: 'element',  // Click to delete entire element
}

export const WhiteboardCanvas = forwardRef(function WhiteboardCanvas({
  elements,
  viewport,
  setViewport,
  tool,
  color,
  strokeWidth,
  selectedElement,
  setSelectedElement,
  addElement,
  updateElement,
  deleteElement,
  onContextMenu,
  tools,
  eraserMode,
}, ref) {
  const canvasRef = useRef(null)
  const [isPanning, setIsPanning] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState([])
  const [startPoint, setStartPoint] = useState(null)
  const [editingText, setEditingText] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const panStart = useRef({ x: 0, y: 0 })

  const getCanvasPoint = useCallback((e) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    
    return {
      x: (e.clientX - rect.left - viewport.x) / viewport.zoom,
      y: (e.clientY - rect.top - viewport.y) / viewport.zoom,
    }
  }, [viewport])

  // Wheel zoom
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleWheel = (e) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setViewport(prev => ({
        ...prev,
        zoom: Math.max(0.1, Math.min(3, prev.zoom + delta)),
      }))
    }

    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [setViewport])

  const handleMouseDown = useCallback((e) => {
    const point = getCanvasPoint(e)
    
    // Middle click or space+click for panning
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true)
      panStart.current = { x: e.clientX - viewport.x, y: e.clientY - viewport.y }
      return
    }

    if (tool === tools.SELECT) {
      // Check if clicking on an element
      const clickedElement = [...elements].reverse().find(el => {
        if (el.type === 'path') return false
        const bounds = getElementBounds(el)
        return point.x >= bounds.x && point.x <= bounds.x + bounds.width &&
               point.y >= bounds.y && point.y <= bounds.y + bounds.height
      })
      
      if (clickedElement) {
        setSelectedElement(clickedElement.id)
        setDragOffset({ x: point.x - clickedElement.x, y: point.y - clickedElement.y })
        setIsDrawing(true)
      } else {
        setSelectedElement(null)
      }
      return
    }

    // Element eraser mode: click on element to delete
    if (tool === tools.ERASER && eraserMode === ERASER_MODES.ELEMENT) {
      const clickedElement = [...elements].reverse().find(el => {
        const bounds = getElementBounds(el)
        return point.x >= bounds.x && point.x <= bounds.x + bounds.width &&
               point.y >= bounds.y && point.y <= bounds.y + bounds.height
      })
      
      if (clickedElement) {
        deleteElement(clickedElement.id)
      }
      return
    }

    if (tool === tools.PEN || tool === tools.ERASER) {
      setIsDrawing(true)
      setCurrentPath([point])
      return
    }

    if (tool === tools.TEXT) {
      const newElement = addElement({
        type: 'text',
        x: point.x,
        y: point.y,
        text: 'Type here...',
        color,
        fontSize: 16,
      })
      setEditingText(newElement.id)
      return
    }

    if (tool === tools.STICKY) {
      addElement({
        type: 'sticky',
        x: point.x,
        y: point.y,
        width: 200,
        height: 150,
        text: '',
        color: STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)],
      })
      return
    }

    // Shapes
    if ([tools.RECTANGLE, tools.CIRCLE, tools.ARROW, tools.LINE, tools.TRIANGLE].includes(tool)) {
      setIsDrawing(true)
      setStartPoint(point)
    }
  }, [tool, tools, viewport, elements, addElement, deleteElement, color, eraserMode, getCanvasPoint, setSelectedElement])

  const handleMouseMove = useCallback((e) => {
    if (isPanning) {
      setViewport(prev => ({
        ...prev,
        x: e.clientX - panStart.current.x,
        y: e.clientY - panStart.current.y,
      }))
      return
    }

    if (!isDrawing) return

    const point = getCanvasPoint(e)

    if (tool === tools.SELECT && selectedElement) {
      updateElement(selectedElement, {
        x: point.x - dragOffset.x,
        y: point.y - dragOffset.y,
      })
      return
    }

    if (tool === tools.PEN || tool === tools.ERASER) {
      setCurrentPath(prev => [...prev, point])
      return
    }
  }, [isPanning, isDrawing, tool, tools, selectedElement, dragOffset, getCanvasPoint, updateElement, setViewport])

  const handleMouseUp = useCallback((e) => {
    if (isPanning) {
      setIsPanning(false)
      return
    }

    if (!isDrawing) return
    setIsDrawing(false)

    const point = getCanvasPoint(e)

    if (tool === tools.PEN && currentPath.length > 1) {
      addElement({
        type: 'path',
        points: currentPath,
        color,
        strokeWidth,
      })
      setCurrentPath([])
      return
    }

    if (tool === tools.ERASER && eraserMode === ERASER_MODES.PIXEL && currentPath.length > 1) {
      // Pixel eraser: draw white strokes on top
      addElement({
        type: 'path',
        points: currentPath,
        color: '#FFFFFF',
        strokeWidth: strokeWidth * 3,
      })
      setCurrentPath([])
      return
    }

    if (startPoint) {
      const width = Math.abs(point.x - startPoint.x)
      const height = Math.abs(point.y - startPoint.y)
      const minX = Math.min(point.x, startPoint.x)
      const minY = Math.min(point.y, startPoint.y)

      if (tool === tools.RECTANGLE) {
        addElement({
          type: 'rectangle',
          x: minX,
          y: minY,
          width: width || 100,
          height: height || 60,
          color,
          strokeWidth,
        })
      } else if (tool === tools.CIRCLE) {
        const radius = Math.max(width, height) / 2 || 40
        addElement({
          type: 'circle',
          x: startPoint.x,
          y: startPoint.y,
          radius,
          color,
          strokeWidth,
        })
      } else if (tool === tools.TRIANGLE) {
        addElement({
          type: 'triangle',
          x: minX,
          y: minY,
          width: width || 100,
          height: height || 80,
          color,
          strokeWidth,
        })
      } else if (tool === tools.LINE) {
        addElement({
          type: 'line',
          x1: startPoint.x,
          y1: startPoint.y,
          x2: point.x,
          y2: point.y,
          color,
          strokeWidth,
        })
      } else if (tool === tools.ARROW) {
        addElement({
          type: 'arrow',
          x1: startPoint.x,
          y1: startPoint.y,
          x2: point.x,
          y2: point.y,
          color,
          strokeWidth,
        })
      }

      setStartPoint(null)
    }
  }, [isPanning, isDrawing, tool, tools, currentPath, startPoint, color, strokeWidth, eraserMode, addElement, getCanvasPoint])

  const handleDoubleClick = useCallback((e) => {
    const point = getCanvasPoint(e)
    
    // Double click to add sticky note
    if (tool !== tools.SELECT) {
      addElement({
        type: 'sticky',
        x: point.x - 100,
        y: point.y - 75,
        width: 200,
        height: 150,
        text: '',
        color: STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)],
      })
    }
  }, [tool, tools, addElement, getCanvasPoint])

  const getElementBounds = (el) => {
    switch (el.type) {
      case 'rectangle':
      case 'sticky':
      case 'triangle':
        return { x: el.x, y: el.y, width: el.width, height: el.height }
      case 'circle':
        return { x: el.x - el.radius, y: el.y - el.radius, width: el.radius * 2, height: el.radius * 2 }
      case 'text':
        return { x: el.x, y: el.y, width: 200, height: 30 }
      case 'line':
      case 'arrow':
        return {
          x: Math.min(el.x1, el.x2),
          y: Math.min(el.y1, el.y2),
          width: Math.abs(el.x2 - el.x1) || 10,
          height: Math.abs(el.y2 - el.y1) || 10,
        }
      default:
        return { x: 0, y: 0, width: 0, height: 0 }
    }
  }

  const renderElement = (el) => {
    const isSelected = selectedElement === el.id
    const selectProps = {
      onContextMenu: (e) => onContextMenu(e, el.id),
      style: { cursor: tool === tools.SELECT ? 'move' : (tool === tools.ERASER && eraserMode === ERASER_MODES.ELEMENT ? 'pointer' : 'default') },
    }

    switch (el.type) {
      case 'path':
        if (el.points.length < 2) return null
        const pathD = el.points.reduce((acc, point, i) => {
          return acc + (i === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`)
        }, '')
        return (
          <path
            key={el.id}
            d={pathD}
            stroke={el.color}
            strokeWidth={el.strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )

      case 'rectangle':
        return (
          <g key={el.id} {...selectProps}>
            <rect
              x={el.x}
              y={el.y}
              width={el.width}
              height={el.height}
              stroke={el.color}
              strokeWidth={el.strokeWidth}
              fill="none"
              rx={4}
            />
            {isSelected && (
              <rect
                x={el.x - 4}
                y={el.y - 4}
                width={el.width + 8}
                height={el.height + 8}
                stroke="#4361EE"
                strokeWidth={2}
                fill="none"
                strokeDasharray="4 4"
              />
            )}
          </g>
        )

      case 'circle':
        return (
          <g key={el.id} {...selectProps}>
            <circle
              cx={el.x}
              cy={el.y}
              r={el.radius}
              stroke={el.color}
              strokeWidth={el.strokeWidth}
              fill="none"
            />
            {isSelected && (
              <rect
                x={el.x - el.radius - 4}
                y={el.y - el.radius - 4}
                width={el.radius * 2 + 8}
                height={el.radius * 2 + 8}
                stroke="#4361EE"
                strokeWidth={2}
                fill="none"
                strokeDasharray="4 4"
              />
            )}
          </g>
        )

      case 'triangle':
        const points = `${el.x + el.width / 2},${el.y} ${el.x},${el.y + el.height} ${el.x + el.width},${el.y + el.height}`
        return (
          <g key={el.id} {...selectProps}>
            <polygon
              points={points}
              stroke={el.color}
              strokeWidth={el.strokeWidth}
              fill="none"
            />
            {isSelected && (
              <rect
                x={el.x - 4}
                y={el.y - 4}
                width={el.width + 8}
                height={el.height + 8}
                stroke="#4361EE"
                strokeWidth={2}
                fill="none"
                strokeDasharray="4 4"
              />
            )}
          </g>
        )

      case 'line':
        return (
          <g key={el.id} {...selectProps}>
            <line
              x1={el.x1}
              y1={el.y1}
              x2={el.x2}
              y2={el.y2}
              stroke={el.color}
              strokeWidth={el.strokeWidth}
              strokeLinecap="round"
            />
          </g>
        )

      case 'arrow':
        const angle = Math.atan2(el.y2 - el.y1, el.x2 - el.x1)
        const arrowLength = 15
        return (
          <g key={el.id} {...selectProps}>
            <line
              x1={el.x1}
              y1={el.y1}
              x2={el.x2}
              y2={el.y2}
              stroke={el.color}
              strokeWidth={el.strokeWidth}
              strokeLinecap="round"
            />
            <path
              d={`M ${el.x2} ${el.y2} L ${el.x2 - arrowLength * Math.cos(angle - Math.PI / 6)} ${el.y2 - arrowLength * Math.sin(angle - Math.PI / 6)} M ${el.x2} ${el.y2} L ${el.x2 - arrowLength * Math.cos(angle + Math.PI / 6)} ${el.y2 - arrowLength * Math.sin(angle + Math.PI / 6)}`}
              stroke={el.color}
              strokeWidth={el.strokeWidth}
              fill="none"
              strokeLinecap="round"
            />
          </g>
        )

      case 'text':
        return (
          <g key={el.id} {...selectProps}>
            {editingText === el.id ? (
              <foreignObject x={el.x} y={el.y - 20} width={300} height={40}>
                <input
                  type="text"
                  defaultValue={el.text}
                  autoFocus
                  className="bg-transparent border-none outline-none text-black"
                  style={{ fontSize: el.fontSize, color: el.color }}
                  onBlur={(e) => {
                    updateElement(el.id, { text: e.target.value })
                    setEditingText(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      updateElement(el.id, { text: e.target.value })
                      setEditingText(null)
                    }
                  }}
                />
              </foreignObject>
            ) : (
              <text
                x={el.x}
                y={el.y}
                fill={el.color}
                fontSize={el.fontSize}
                onClick={() => tool === tools.SELECT && setEditingText(el.id)}
              >
                {el.text}
              </text>
            )}
            {isSelected && (
              <rect
                x={el.x - 4}
                y={el.y - 24}
                width={el.text.length * 10 + 8}
                height={30}
                stroke="#4361EE"
                strokeWidth={2}
                fill="none"
                strokeDasharray="4 4"
              />
            )}
          </g>
        )

      case 'sticky':
        return (
          <g key={el.id} {...selectProps}>
            <rect
              x={el.x}
              y={el.y}
              width={el.width}
              height={el.height}
              fill={el.color}
              rx={4}
              filter="drop-shadow(2px 2px 4px rgba(0,0,0,0.3))"
            />
            <foreignObject x={el.x + 10} y={el.y + 10} width={el.width - 20} height={el.height - 20}>
              <textarea
                defaultValue={el.text}
                placeholder="Type here..."
                className="w-full h-full bg-transparent border-none outline-none resize-none text-gray-800 text-sm"
                onBlur={(e) => updateElement(el.id, { text: e.target.value })}
              />
            </foreignObject>
            {isSelected && (
              <rect
                x={el.x - 4}
                y={el.y - 4}
                width={el.width + 8}
                height={el.height + 8}
                stroke="#4361EE"
                strokeWidth={2}
                fill="none"
                strokeDasharray="4 4"
              />
            )}
          </g>
        )

      default:
        return null
    }
  }

  // Render current drawing path
  const renderCurrentPath = () => {
    if (currentPath.length < 2) return null
    const pathD = currentPath.reduce((acc, point, i) => {
      return acc + (i === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`)
    }, '')
    return (
      <path
        d={pathD}
        stroke={tool === tools.ERASER ? '#FFFFFF' : color}
        strokeWidth={tool === tools.ERASER ? strokeWidth * 3 : strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )
  }

  return (
    <div
      ref={canvasRef}
      className={`w-full h-full ${isPanning ? 'cursor-grabbing' : tool === tools.SELECT ? 'cursor-default' : 'cursor-crosshair'}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
    >
      <svg
        width="100%"
        height="100%"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
          backgroundColor: '#FFFFFF',
        }}
      >
        {/* Elements */}
        {elements.map(renderElement)}
        
        {/* Current drawing */}
        {renderCurrentPath()}
      </svg>
    </div>
  )
})
