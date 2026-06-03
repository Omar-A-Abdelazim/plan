'use client'

import { useState, useEffect } from 'react'
import { ThemeProvider } from '@/context/theme-context'
import { UserProvider } from '@/context/user-context'
import { KanbanProvider } from '@/context/kanban-context'
import { PomodoroProvider } from '@/context/pomodoro-context'
import { Sidebar } from '@/components/layout/sidebar'
import { TopBar } from '@/components/layout/top-bar'
import { Dashboard } from '@/components/pages/dashboard'
import { KanbanBoard } from '@/components/pages/kanban-board'
import { Whiteboard } from '@/components/pages/whiteboard'
import { Notes } from '@/components/pages/notes'
import { Pomodoro } from '@/components/pages/pomodoro'
import { FloatingPomodoroWidget } from '@/components/widgets/floating-pomodoro'

export function PlanFlowApp() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard setCurrentPage={setCurrentPage} />
      case 'kanban':
        return <KanbanBoard />
      case 'whiteboard':
        return <Whiteboard />
      case 'notes':
        return <Notes />
      case 'pomodoro':
        return <Pomodoro />
      default:
        return <Dashboard setCurrentPage={setCurrentPage} />
    }
  }

  return (
    <ThemeProvider>
      <UserProvider>
        <KanbanProvider>
          <PomodoroProvider>
            <div className="flex h-screen bg-background overflow-hidden">
              <Sidebar
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                collapsed={sidebarCollapsed}
                setCollapsed={setSidebarCollapsed}
              />
              
              <div className="flex-1 flex flex-col overflow-hidden">
                <TopBar />
                
                <main className="flex-1 overflow-auto">
                  <div className="animate-fade-in">
                    {renderPage()}
                  </div>
                </main>
              </div>

              {/* Global Floating Widget */}
              <FloatingPomodoroWidget />
            </div>
          </PomodoroProvider>
        </KanbanProvider>
      </UserProvider>
    </ThemeProvider>
  )
}
