'use client'

import { useState, useEffect, useCallback } from 'react'
import { getNotes, saveNotes, getNotesFolders, saveNotesFolders } from '@/lib/storage'
import { NoteEditor } from '@/components/notes/note-editor'
import { 
  Plus, 
  Search, 
  Folder, 
  FolderPlus, 
  FileText, 
  Download, 
  Trash2,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  Clock,
  Hash
} from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { cn } from '@/lib/utils'

export function Notes() {
  const [notes, setNotes] = useState([])
  const [folders, setFolders] = useState([])
  const [selectedNote, setSelectedNote] = useState(null)
  const [selectedFolder, setSelectedFolder] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFolders, setExpandedFolders] = useState(['all'])
  const [showNewFolderInput, setShowNewFolderInput] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  useEffect(() => {
    const savedNotes = getNotes()
    const savedFolders = getNotesFolders()
    setNotes(savedNotes)
    setFolders(savedFolders)
    
    if (savedNotes.length > 0) {
      setSelectedNote(savedNotes[0])
    }
  }, [])

  const saveAllNotes = useCallback((newNotes) => {
    setNotes(newNotes)
    saveNotes(newNotes)
  }, [])

  const saveAllFolders = useCallback((newFolders) => {
    setFolders(newFolders)
    saveNotesFolders(newFolders)
  }, [])

  const createNote = useCallback(() => {
    const newNote = {
      id: uuidv4(),
      title: 'Untitled Note',
      content: '',
      folderId: selectedFolder === 'all' ? null : selectedFolder,
      subject: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const newNotes = [newNote, ...notes]
    saveAllNotes(newNotes)
    setSelectedNote(newNote)
  }, [notes, selectedFolder, saveAllNotes])

  const updateNote = useCallback((noteId, updates) => {
    const newNotes = notes.map(note => 
      note.id === noteId 
        ? { ...note, ...updates, updatedAt: new Date().toISOString() }
        : note
    )
    saveAllNotes(newNotes)
    
    if (selectedNote?.id === noteId) {
      setSelectedNote({ ...selectedNote, ...updates, updatedAt: new Date().toISOString() })
    }
  }, [notes, selectedNote, saveAllNotes])

  const deleteNote = useCallback((noteId) => {
    const newNotes = notes.filter(n => n.id !== noteId)
    saveAllNotes(newNotes)
    
    if (selectedNote?.id === noteId) {
      setSelectedNote(newNotes[0] || null)
    }
  }, [notes, selectedNote, saveAllNotes])

  const createFolder = useCallback((name) => {
    const newFolder = {
      id: uuidv4(),
      name,
    }
    saveAllFolders([...folders, newFolder])
    setShowNewFolderInput(false)
    setNewFolderName('')
  }, [folders, saveAllFolders])

  const deleteFolder = useCallback((folderId) => {
    // Move notes in this folder to "all"
    const updatedNotes = notes.map(note => 
      note.folderId === folderId ? { ...note, folderId: null } : note
    )
    saveAllNotes(updatedNotes)
    saveAllFolders(folders.filter(f => f.id !== folderId))
    
    if (selectedFolder === folderId) {
      setSelectedFolder('all')
    }
  }, [notes, folders, selectedFolder, saveAllNotes, saveAllFolders])

  const exportNote = useCallback((note) => {
    const content = `${note.title}\n\n${note.content.replace(/<[^>]*>/g, '')}`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${note.title.replace(/[^a-z0-9]/gi, '_')}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }, [])

  // Filter notes
  const filteredNotes = notes.filter(note => {
    // Folder filter
    if (selectedFolder !== 'all' && note.folderId !== selectedFolder) {
      return false
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
        note.subject?.toLowerCase().includes(query)
      )
    }
    
    return true
  }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getWordCount = (html) => {
    const text = html.replace(/<[^>]*>/g, ' ').trim()
    return text ? text.split(/\s+/).length : 0
  }

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 border-r border-border flex flex-col bg-card">
        {/* Search */}
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="w-full pl-9 pr-3 py-2 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Folders */}
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Folders</span>
            <button
              onClick={() => setShowNewFolderInput(true)}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-1">
            {/* All Notes */}
            <button
              onClick={() => setSelectedFolder('all')}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors",
                selectedFolder === 'all' 
                  ? "bg-primary/10 text-primary" 
                  : "text-foreground hover:bg-muted"
              )}
            >
              <Folder className="w-4 h-4" />
              All Notes
              <span className="ml-auto text-xs text-muted-foreground">{notes.length}</span>
            </button>
            
            {/* Custom Folders */}
            {folders.filter(f => f.id !== 'all').map(folder => (
              <div key={folder.id} className="group relative">
                <button
                  onClick={() => setSelectedFolder(folder.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors",
                    selectedFolder === folder.id 
                      ? "bg-primary/10 text-primary" 
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <Folder className="w-4 h-4" />
                  {folder.name}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {notes.filter(n => n.folderId === folder.id).length}
                  </span>
                </button>
                <button
                  onClick={() => deleteFolder(folder.id)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-destructive transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* New Folder Input */}
            {showNewFolderInput && (
              <form 
                onSubmit={(e) => {
                  e.preventDefault()
                  if (newFolderName.trim()) {
                    createFolder(newFolderName.trim())
                  }
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder name..."
                  className="flex-1 px-2 py-1.5 bg-muted rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
              </form>
            )}
          </div>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</span>
              <button
                onClick={createNote}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              {filteredNotes.map(note => (
                <button
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                  className={cn(
                    "w-full text-left p-2 rounded-lg transition-colors",
                    selectedNote?.id === note.id 
                      ? "bg-primary/10" 
                      : "hover:bg-muted"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-medium truncate",
                        selectedNote?.id === note.id ? "text-primary" : "text-foreground"
                      )}>
                        {note.title || 'Untitled'}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(note.updatedAt)}
                        </span>
                        {note.subject && (
                          <span className="text-xs text-primary/70 flex items-center gap-0.5">
                            <Hash className="w-3 h-3" />
                            {note.subject}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}

              {filteredNotes.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? 'No notes found' : 'No notes yet'}
                  </p>
                  <button
                    onClick={createNote}
                    className="mt-2 text-sm text-primary hover:underline"
                  >
                    Create your first note
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedNote ? (
          <>
            {/* Note Header */}
            <div className="px-6 py-3 border-b border-border flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={selectedNote.title}
                  onChange={(e) => updateNote(selectedNote.id, { title: e.target.value })}
                  className="text-xl font-semibold bg-transparent border-none focus:outline-none text-foreground"
                  placeholder="Untitled"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {getWordCount(selectedNote.content)} words
                </span>
                
                <select
                  value={selectedNote.folderId || ''}
                  onChange={(e) => updateNote(selectedNote.id, { folderId: e.target.value || null })}
                  className="px-2 py-1 text-xs bg-muted rounded text-foreground focus:outline-none"
                >
                  <option value="">No folder</option>
                  {folders.filter(f => f.id !== 'all').map(folder => (
                    <option key={folder.id} value={folder.id}>{folder.name}</option>
                  ))}
                </select>

                <input
                  type="text"
                  value={selectedNote.subject || ''}
                  onChange={(e) => updateNote(selectedNote.id, { subject: e.target.value })}
                  placeholder="Subject"
                  className="px-2 py-1 text-xs bg-muted rounded text-foreground placeholder:text-muted-foreground focus:outline-none w-24"
                />
                
                <button
                  onClick={() => exportNote(selectedNote)}
                  className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Export as .txt"
                >
                  <Download className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => deleteNote(selectedNote.id)}
                  className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  title="Delete note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Rich Text Editor */}
            <div className="flex-1 overflow-hidden">
              <NoteEditor
                content={selectedNote.content}
                onChange={(content) => updateNote(selectedNote.id, { content })}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">Select a note or create a new one</p>
              <button
                onClick={createNote}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4 inline-block mr-2" />
                New Note
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
