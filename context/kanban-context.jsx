'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getKanbanBoards, saveKanbanBoards } from '@/lib/storage'
import { v4 as uuidv4 } from 'uuid'
import confetti from 'canvas-confetti'

const KanbanContext = createContext(undefined)

export function KanbanProvider({ children }) {
  const [boards, setBoards] = useState([])
  const [currentBoardId, setCurrentBoardId] = useState('default')

  useEffect(() => {
    const savedBoards = getKanbanBoards()
    setBoards(savedBoards)
    if (savedBoards.length > 0) {
      setCurrentBoardId(savedBoards[0].id)
    }
  }, [])

  const saveBoards = useCallback((newBoards) => {
    setBoards(newBoards)
    saveKanbanBoards(newBoards)
  }, [])

  const currentBoard = boards.find(b => b.id === currentBoardId) || boards[0]

  // Get all tasks from all boards for Pomodoro task panel
  const getAllTasks = useCallback(() => {
    const tasks = []
    boards.forEach(board => {
      board.columns.forEach(column => {
        column.cards.forEach(card => {
          tasks.push({
            ...card,
            boardId: board.id,
            columnId: column.id,
            isDone: column.title.toLowerCase().includes('done'),
          })
        })
      })
    })
    return tasks
  }, [boards])

  // Board operations
  const addBoard = useCallback((name) => {
    const newBoard = {
      id: uuidv4(),
      name,
      columns: [
        { id: uuidv4(), title: 'To Do', cards: [] },
        { id: uuidv4(), title: 'In Progress', cards: [] },
        { id: uuidv4(), title: 'Done', cards: [] },
      ],
    }
    saveBoards([...boards, newBoard])
    setCurrentBoardId(newBoard.id)
  }, [boards, saveBoards])

  const deleteBoard = useCallback((boardId) => {
    const newBoards = boards.filter(b => b.id !== boardId)
    if (newBoards.length === 0) {
      // Create default board if all deleted
      newBoards.push({
        id: 'default',
        name: 'My Board',
        columns: [
          { id: uuidv4(), title: 'To Do', cards: [] },
          { id: uuidv4(), title: 'In Progress', cards: [] },
          { id: uuidv4(), title: 'Done', cards: [] },
        ],
      })
    }
    saveBoards(newBoards)
    if (currentBoardId === boardId) {
      setCurrentBoardId(newBoards[0].id)
    }
  }, [boards, currentBoardId, saveBoards])

  // Column operations
  const addColumn = useCallback((title) => {
    const newBoards = boards.map(board => {
      if (board.id === currentBoardId) {
        return {
          ...board,
          columns: [...board.columns, { id: uuidv4(), title, cards: [] }],
        }
      }
      return board
    })
    saveBoards(newBoards)
  }, [boards, currentBoardId, saveBoards])

  const updateColumn = useCallback((columnId, title) => {
    const newBoards = boards.map(board => {
      if (board.id === currentBoardId) {
        return {
          ...board,
          columns: board.columns.map(col =>
            col.id === columnId ? { ...col, title } : col
          ),
        }
      }
      return board
    })
    saveBoards(newBoards)
  }, [boards, currentBoardId, saveBoards])

  const deleteColumn = useCallback((columnId) => {
    const newBoards = boards.map(board => {
      if (board.id === currentBoardId) {
        return {
          ...board,
          columns: board.columns.filter(col => col.id !== columnId),
        }
      }
      return board
    })
    saveBoards(newBoards)
  }, [boards, currentBoardId, saveBoards])

  // Card operations
  const addCard = useCallback((columnId, card) => {
    const newCard = {
      id: uuidv4(),
      title: card.title || 'Untitled',
      description: card.description || '',
      priority: card.priority || 'medium',
      dueDate: card.dueDate || null,
      subject: card.subject || '',
      createdAt: new Date().toISOString(),
    }
    
    const newBoards = boards.map(board => {
      if (board.id === currentBoardId) {
        return {
          ...board,
          columns: board.columns.map(col =>
            col.id === columnId
              ? { ...col, cards: [...col.cards, newCard] }
              : col
          ),
        }
      }
      return board
    })
    saveBoards(newBoards)
    return newCard
  }, [boards, currentBoardId, saveBoards])

  const updateCard = useCallback((columnId, cardId, updates) => {
    const newBoards = boards.map(board => {
      if (board.id === currentBoardId) {
        return {
          ...board,
          columns: board.columns.map(col =>
            col.id === columnId
              ? {
                  ...col,
                  cards: col.cards.map(card =>
                    card.id === cardId ? { ...card, ...updates } : card
                  ),
                }
              : col
          ),
        }
      }
      return board
    })
    saveBoards(newBoards)
  }, [boards, currentBoardId, saveBoards])

  const deleteCard = useCallback((columnId, cardId) => {
    const newBoards = boards.map(board => {
      if (board.id === currentBoardId) {
        return {
          ...board,
          columns: board.columns.map(col =>
            col.id === columnId
              ? { ...col, cards: col.cards.filter(card => card.id !== cardId) }
              : col
          ),
        }
      }
      return board
    })
    saveBoards(newBoards)
  }, [boards, currentBoardId, saveBoards])

  const moveCard = useCallback((cardId, fromColumnId, toColumnId, onTaskComplete) => {
    const newBoards = boards.map(board => {
      if (board.id === currentBoardId) {
        const fromColumn = board.columns.find(col => col.id === fromColumnId)
        const card = fromColumn?.cards.find(c => c.id === cardId)
        
        if (!card) return board
        
        const toColumn = board.columns.find(col => col.id === toColumnId)
        const isMovingToDone = toColumn?.title.toLowerCase().includes('done')
        const wasNotDone = !fromColumn?.title.toLowerCase().includes('done')
        
        // Trigger confetti when moving to Done
        if (isMovingToDone && wasNotDone) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#7B2FBE', '#4361EE', '#F77F00'],
          })
          if (onTaskComplete) {
            onTaskComplete()
          }
        }
        
        return {
          ...board,
          columns: board.columns.map(col => {
            if (col.id === fromColumnId) {
              return { ...col, cards: col.cards.filter(c => c.id !== cardId) }
            }
            if (col.id === toColumnId) {
              return { ...col, cards: [...col.cards, card] }
            }
            return col
          }),
        }
      }
      return board
    })
    saveBoards(newBoards)
  }, [boards, currentBoardId, saveBoards])

  const reorderCards = useCallback((columnId, startIndex, endIndex) => {
    const newBoards = boards.map(board => {
      if (board.id === currentBoardId) {
        return {
          ...board,
          columns: board.columns.map(col => {
            if (col.id === columnId) {
              const newCards = [...col.cards]
              const [removed] = newCards.splice(startIndex, 1)
              newCards.splice(endIndex, 0, removed)
              return { ...col, cards: newCards }
            }
            return col
          }),
        }
      }
      return board
    })
    saveBoards(newBoards)
  }, [boards, currentBoardId, saveBoards])

  const markTaskAsDone = useCallback((cardId, onTaskComplete) => {
    // Find the card and move it to Done column
    let found = false
    boards.forEach(board => {
      board.columns.forEach(column => {
        const card = column.cards.find(c => c.id === cardId)
        if (card && !column.title.toLowerCase().includes('done')) {
          const doneColumn = board.columns.find(col => col.title.toLowerCase().includes('done'))
          if (doneColumn) {
            moveCard(cardId, column.id, doneColumn.id, onTaskComplete)
            found = true
          }
        }
      })
    })
    return found
  }, [boards, moveCard])

  return (
    <KanbanContext.Provider value={{
      boards,
      currentBoard,
      currentBoardId,
      setCurrentBoardId,
      addBoard,
      deleteBoard,
      addColumn,
      updateColumn,
      deleteColumn,
      addCard,
      updateCard,
      deleteCard,
      moveCard,
      reorderCards,
      getAllTasks,
      markTaskAsDone,
    }}>
      {children}
    </KanbanContext.Provider>
  )
}

export function useKanban() {
  const context = useContext(KanbanContext)
  if (context === undefined) {
    throw new Error('useKanban must be used within a KanbanProvider')
  }
  return context
}
