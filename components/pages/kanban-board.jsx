'use client'

import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useKanban } from '@/context/kanban-context'
import { useUser } from '@/context/user-context'
import { KanbanColumn } from '@/components/kanban/kanban-column'
import { KanbanCard } from '@/components/kanban/kanban-card'
import { Plus, MoreHorizontal, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const PRIORITIES = ['high', 'medium', 'low']
const PRIORITY_COLORS = {
  high: 'bg-destructive/20 text-destructive border-destructive/30',
  medium: 'bg-accent/20 text-accent border-accent/30',
  low: 'bg-secondary/20 text-secondary border-secondary/30',
}

export function KanbanBoard() {
  const { 
    boards, 
    currentBoard, 
    currentBoardId, 
    setCurrentBoardId,
    addBoard,
    addColumn,
    moveCard,
    reorderCards,
  } = useKanban()
  const { completeTask } = useUser()
  
  const [activeCard, setActiveCard] = useState(null)
  const [showBoardMenu, setShowBoardMenu] = useState(false)
  const [newBoardName, setNewBoardName] = useState('')
  const [showNewBoardInput, setShowNewBoardInput] = useState(false)
  const [newColumnName, setNewColumnName] = useState('')
  const [showNewColumnInput, setShowNewColumnInput] = useState(false)
  const [filterPriority, setFilterPriority] = useState(null)
  const [filterSubject, setFilterSubject] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Get all unique subjects
  const allSubjects = [...new Set(
    currentBoard?.columns
      .flatMap(col => col.cards)
      .map(card => card.subject)
      .filter(Boolean)
  )]

  const handleDragStart = (event) => {
    const { active } = event
    const card = findCard(active.id)
    setActiveCard(card)
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveCard(null)

    if (!over) return

    const activeId = active.id
    const overId = over.id

    // Find source and destination columns
    const sourceColumn = currentBoard?.columns.find(col => 
      col.cards.some(card => card.id === activeId)
    )
    
    let destColumn = currentBoard?.columns.find(col => col.id === overId)
    if (!destColumn) {
      destColumn = currentBoard?.columns.find(col =>
        col.cards.some(card => card.id === overId)
      )
    }

    if (!sourceColumn || !destColumn) return

    if (sourceColumn.id === destColumn.id) {
      // Reorder within same column
      const oldIndex = sourceColumn.cards.findIndex(card => card.id === activeId)
      const newIndex = sourceColumn.cards.findIndex(card => card.id === overId)
      if (oldIndex !== newIndex && newIndex !== -1) {
        reorderCards(sourceColumn.id, oldIndex, newIndex)
      }
    } else {
      // Move to different column
      moveCard(activeId, sourceColumn.id, destColumn.id, completeTask)
    }
  }

  const findCard = (cardId) => {
    for (const column of currentBoard?.columns || []) {
      const card = column.cards.find(c => c.id === cardId)
      if (card) return { ...card, columnId: column.id }
    }
    return null
  }

  const handleAddBoard = (e) => {
    e.preventDefault()
    if (!newBoardName.trim()) return
    addBoard(newBoardName.trim())
    setNewBoardName('')
    setShowNewBoardInput(false)
  }

  const handleAddColumn = (e) => {
    e.preventDefault()
    if (!newColumnName.trim()) return
    addColumn(newColumnName.trim())
    setNewColumnName('')
    setShowNewColumnInput(false)
  }

  // Filter cards
  const getFilteredCards = (cards) => {
    return cards.filter(card => {
      if (filterPriority && card.priority !== filterPriority) return false
      if (filterSubject && card.subject !== filterSubject) return false
      return true
    })
  }

  if (!currentBoard) {
    return <div className="p-6 text-center text-muted-foreground">Loading...</div>
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          {/* Board Selector */}
          <div className="relative">
            <button
              onClick={() => setShowBoardMenu(!showBoardMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-card rounded-lg border border-border hover:bg-muted transition-colors"
            >
              <span className="font-semibold text-foreground">{currentBoard.name}</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
            
            {showBoardMenu && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-card rounded-lg border border-border shadow-xl z-50 animate-scale-in">
                {boards.map(board => (
                  <button
                    key={board.id}
                    onClick={() => {
                      setCurrentBoardId(board.id)
                      setShowBoardMenu(false)
                    }}
                    className={cn(
                      "w-full px-4 py-2 text-left hover:bg-muted transition-colors first:rounded-t-lg",
                      board.id === currentBoardId && "bg-primary/10 text-primary"
                    )}
                  >
                    {board.name}
                  </button>
                ))}
                <div className="border-t border-border">
                  {showNewBoardInput ? (
                    <form onSubmit={handleAddBoard} className="p-2">
                      <input
                        type="text"
                        value={newBoardName}
                        onChange={(e) => setNewBoardName(e.target.value)}
                        placeholder="Board name..."
                        className="w-full px-3 py-1.5 text-sm bg-muted rounded border-none focus:outline-none focus:ring-1 focus:ring-primary"
                        autoFocus
                      />
                    </form>
                  ) : (
                    <button
                      onClick={() => setShowNewBoardInput(true)}
                      className="w-full px-4 py-2 text-left text-primary hover:bg-muted transition-colors rounded-b-lg flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      New Board
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <select
              value={filterPriority || ''}
              onChange={(e) => setFilterPriority(e.target.value || null)}
              className="px-3 py-1.5 text-sm bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Priorities</option>
              {PRIORITIES.map(p => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
            
            {allSubjects.length > 0 && (
              <select
                value={filterSubject || ''}
                onChange={(e) => setFilterSubject(e.target.value || null)}
                className="px-3 py-1.5 text-sm bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All Subjects</option>
                {allSubjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Add Column Button */}
        {showNewColumnInput ? (
          <form onSubmit={handleAddColumn} className="flex items-center gap-2">
            <input
              type="text"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              placeholder="Column name..."
              className="px-3 py-1.5 text-sm bg-muted rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowNewColumnInput(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </form>
        ) : (
          <button
            onClick={() => setShowNewColumnInput(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Column
          </button>
        )}
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 h-full">
            {currentBoard.columns.map(column => (
              <KanbanColumn
                key={column.id}
                column={column}
                cards={getFilteredCards(column.cards)}
              />
            ))}
          </div>

          <DragOverlay>
            {activeCard && (
              <div className="rotate-3 opacity-90">
                <KanbanCard card={activeCard} isDragging />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}
