'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { Task, TaskStatus, Issue, TeamMember, Scenario } from '@/lib/types'
import TaskCard from './TaskCard'

const columns: { status: TaskStatus; label: string; headerColor: string; countColor: string }[] = [
  { status: '待办', label: '待办', headerColor: 'bg-gray-100 text-gray-600', countColor: 'bg-gray-200 text-gray-600' },
  { status: '进行中', label: '进行中', headerColor: 'bg-blue-50 text-blue-700', countColor: 'bg-blue-100 text-blue-700' },
  { status: '审核中', label: '审核中', headerColor: 'bg-amber-50 text-amber-700', countColor: 'bg-amber-100 text-amber-700' },
  { status: '已完成', label: '已完成', headerColor: 'bg-green-50 text-green-700', countColor: 'bg-green-100 text-green-700' },
]

const dotColors: Record<TaskStatus, string> = {
  '待办': 'bg-gray-400',
  '进行中': 'bg-blue-500',
  '审核中': 'bg-amber-500',
  '已完成': 'bg-green-500',
}

interface KanbanBoardProps {
  tasks: Task[]
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void
  onTaskClick: (task: Task) => void
  onAddTask: (status: TaskStatus) => void
  issues?: Issue[]
  getMember?: (id: string) => TeamMember | undefined
  getScenario?: (id: string) => Scenario | undefined
  today: string
}

export default function KanbanBoard({ tasks, onStatusChange, onTaskClick, onAddTask, issues = [], getMember, getScenario, today }: KanbanBoardProps) {
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  function handleDragStart(e: React.DragEvent<HTMLDivElement>, task: Task) {
    e.dataTransfer.setData('text/plain', task.id)
    e.dataTransfer.effectAllowed = 'move'
    setDraggingId(task.id)
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>, status: TaskStatus) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverCol(status)
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    const related = e.relatedTarget as HTMLElement | null
    if (!related || !e.currentTarget.contains(related)) {
      setDragOverCol(null)
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>, status: TaskStatus) {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('text/plain')
    if (taskId) {
      onStatusChange(taskId, status)
    }
    setDragOverCol(null)
    setDraggingId(null)
  }

  function handleDragEnd() {
    setDragOverCol(null)
    setDraggingId(null)
  }

  return (
    <div className="flex gap-5 p-6 flex-1 overflow-x-auto">
      {columns.map(col => {
        const colTasks = tasks.filter(t => t.status === col.status)
        const isOver = dragOverCol === col.status

        return (
          <div
            key={col.status}
            className={`flex-1 min-w-[280px] max-w-[360px] flex flex-col rounded-xl transition-all duration-150 ${
              isOver ? 'ring-2 ring-blue-400 ring-dashed bg-blue-50/30' : ''
            }`}
            onDragOver={e => handleDragOver(e, col.status)}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, col.status)}
          >
            {/* Column header */}
            <div className={`flex items-center justify-between px-3 py-2.5 rounded-lg mb-3 ${col.headerColor}`}>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${dotColors[col.status]}`} />
                <span className="text-sm font-semibold">{col.label}</span>
              </div>
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${col.countColor}`}>
                {colTasks.length}
              </span>
            </div>

            {/* Card list */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 pb-2">
              {colTasks.map(task => (
                <div
                  key={task.id}
                  onDragEnd={handleDragEnd}
                  className={`transition-opacity duration-150 ${draggingId === task.id ? 'opacity-50' : 'opacity-100'}`}
                >
                  <TaskCard
                    task={task}
                    onClick={onTaskClick}
                    onDragStart={handleDragStart}
                    issues={issues}
                    getMember={getMember}
                    getScenario={getScenario}
                    today={today}
                  />
                </div>
              ))}
            </div>

            {/* Add button */}
            <button
              onClick={() => onAddTask(col.status)}
              className="mt-2 flex items-center justify-center gap-1.5 w-full py-2 text-sm text-gray-500 hover:text-blue-600 hover:bg-blue-50 border border-dashed border-gray-200 hover:border-blue-300 rounded-lg transition-all"
            >
              <Plus size={14} />
              <span>添加任务</span>
            </button>
          </div>
        )
      })}
    </div>
  )
}
