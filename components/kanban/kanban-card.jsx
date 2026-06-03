'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useKanban } from '@/context/kanban-context'
import { CardModal } from './card-modal'
import { Calendar, Tag, MoreHorizontal, Pencil, Trash2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const PRIORITY_STYLES = {
  high: 'bg-destructive/20 text-destructive border-destructive/30',
  medium: 'bg-accent/20 text-accent border-accent/30',
  low: 'bg-secondary/20 text-secondary border-secondary/30',
}

export function KanbanCard({ card, columnId, isDone, isDragging }) {
  const { updateCard, deleteCard } = useKanban()
  const [showMenu, setShowMenu] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleSave = (updates) => {
    updateCard(columnId, card.id, updates)
    setShowEditModal(false)
  }

  const formatDate = (dateString) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const isOverdue = card.dueDate && new Date(card.dueDate) < new Date() && !isDone

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={cn(
          "bg-background rounded-lg border border-border p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all duration-200 animate-slide-in",
          isDone && "opacity-70",
          (isDragging || isSortableDragging) && "opacity-50 shadow-xl scale-105"
        )}
      >
        {/* Priority & Subject Tags */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={cn(
            "px-2 py-0.5 text-xs font-medium rounded-full border",
            PRIORITY_STYLES[card.priority] || PRIORITY_STYLES.medium
          )}>
            {card.priority?.charAt(0).toUpperCase() + card.priority?.slice(1) || 'Medium'}
          </span>
          
          {card.subject && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
              {card.subject}
            </span>
          )}
        </div>

        {/* Title */}
        <h4 className={cn(
          "font-medium text-foreground mb-2",
          isDone && "line-through text-muted-foreground"
        )}>
          {isDone && (
            <Check className="w-4 h-4 inline-block mr-1 text-primary animate-check-pop" />
          )}
          {card.title}
        </h4>

        {/* Description */}
        {card.description && (
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
            {card.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {card.dueDate && (
              <span className={cn(
                "flex items-center gap-1 text-xs",
                isOverdue ? "text-destructive" : "text-muted-foreground"
              )}>
                <Calendar className="w-3 h-3" />
                {formatDate(card.dueDate)}
              </span>
            )}
          </div>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            
            {showMenu && (
              <div 
                className="absolute right-0 bottom-full mb-1 w-32 bg-popover rounded-lg border border-border shadow-xl z-50 animate-scale-in"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    setShowEditModal(true)
                    setShowMenu(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2 rounded-t-lg"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    deleteCard(columnId, card.id)
                    setShowMenu(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-destructive/10 text-destructive transition-colors flex items-center gap-2 rounded-b-lg"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <CardModal
          card={card}
          onSave={handleSave}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </>
  )
}
