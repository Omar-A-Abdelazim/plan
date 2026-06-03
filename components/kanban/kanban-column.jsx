'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useKanban } from '@/context/kanban-context'
import { KanbanCard } from './kanban-card'
import { CardModal } from './card-modal'
import { Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function KanbanColumn({ column, cards }) {
  const { updateColumn, deleteColumn, addCard } = useKanban()
  const [showMenu, setShowMenu] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(column.title)
  const [showAddCard, setShowAddCard] = useState(false)
  const [showCardModal, setShowCardModal] = useState(false)
  
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  })

  const handleSaveTitle = () => {
    if (editTitle.trim()) {
      updateColumn(column.id, editTitle.trim())
    }
    setIsEditing(false)
  }

  const handleAddCard = (cardData) => {
    addCard(column.id, cardData)
    setShowCardModal(false)
  }

  const isDoneColumn = column.title.toLowerCase().includes('done')

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "w-72 flex-shrink-0 flex flex-col bg-card rounded-xl border border-border transition-all duration-200",
        isOver && "ring-2 ring-primary/50 bg-primary/5"
      )}
    >
      {/* Column Header */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
              className="flex-1 px-2 py-1 bg-muted rounded text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />
          ) : (
            <h3 className="font-semibold text-foreground">{column.title}</h3>
          )}
          <span className="px-2 py-0.5 bg-muted rounded-full text-xs font-medium text-muted-foreground">
            {cards.length}
          </span>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-popover rounded-lg border border-border shadow-xl z-50 animate-scale-in">
              <button
                onClick={() => {
                  setIsEditing(true)
                  setShowMenu(false)
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2 rounded-t-lg"
              >
                <Pencil className="w-3.5 h-3.5" />
                Rename
              </button>
              <button
                onClick={() => {
                  deleteColumn(column.id)
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

      {/* Cards List */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px]">
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map(card => (
            <KanbanCard key={card.id} card={card} columnId={column.id} isDone={isDoneColumn} />
          ))}
        </SortableContext>
      </div>

      {/* Add Card Button */}
      <div className="p-2 border-t border-border">
        <button
          onClick={() => setShowCardModal(true)}
          className="w-full py-2 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Card
        </button>
      </div>

      {/* Add Card Modal */}
      {showCardModal && (
        <CardModal
          onSave={handleAddCard}
          onClose={() => setShowCardModal(false)}
        />
      )}
    </div>
  )
}
