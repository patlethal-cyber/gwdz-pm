'use client'

import { useState } from 'react'
import { Plus, LayoutGrid, List } from 'lucide-react'
import Header from '@/components/layout/Header'
import KanbanBoard from '@/components/tasks/KanbanBoard'
import TaskList from '@/components/tasks/TaskList'
import TaskModal from '@/components/tasks/TaskModal'
import { tasks as storeTasks } from '@/lib/store'
import type { Task, TaskStatus } from '@/lib/types'

type ViewMode = 'kanban' | 'list'

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(storeTasks)
  const [view, setView] = useState<ViewMode>('kanban')
  const [modalOpen, setModalOpen] = useState(false)
  const [editTask, setEditTask] = useState<Task | undefined>(undefined)
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('待办')

  function handleTaskClick(task: Task) {
    setEditTask(task)
    setDefaultStatus(task.status)
    setModalOpen(true)
  }

  function handleAddTask(status: TaskStatus = '待办') {
    setEditTask(undefined)
    setDefaultStatus(status)
    setModalOpen(true)
  }

  function handleSave(saved: Task) {
    setTasks(prev => {
      const idx = prev.findIndex(t => t.id === saved.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [...prev, saved]
    })
  }

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="任务管理"
        subtitle={`共 ${tasks.length} 项任务`}
        actions={
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setView('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  view === 'kanban'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <LayoutGrid size={14} />
                看板
              </button>
              <button
                onClick={() => setView('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  view === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <List size={14} />
                列表
              </button>
            </div>

            {/* New task button */}
            <button
              onClick={() => handleAddTask()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              <Plus size={15} />
              新建任务
            </button>
          </div>
        }
      />

      {view === 'kanban' ? (
        <KanbanBoard
          tasks={tasks}
          onTaskClick={handleTaskClick}
          onAddTask={handleAddTask}
        />
      ) : (
        <TaskList
          tasks={tasks}
          onTaskClick={handleTaskClick}
        />
      )}

      <TaskModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditTask(undefined) }}
        task={editTask}
        onSave={handleSave}
        defaultStatus={defaultStatus}
      />
    </div>
  )
}
