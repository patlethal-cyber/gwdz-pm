'use client'

import { Plus } from 'lucide-react'
import type { Task, TaskStatus } from '@/lib/types'
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
  onTaskClick: (task: Task) => void
  onAddTask: (status: TaskStatus) => void
}

export default function KanbanBoard({ tasks, onTaskClick, onAddTask }: KanbanBoardProps) {
  return (
    <div className="flex gap-5 p-6 h-[calc(100vh-64px)] overflow-x-auto">
      {columns.map(col => {
        const colTasks = tasks.filter(t => t.status === col.status)
        return (
          <div key={col.status} className="flex-1 min-w-[280px] max-w-[360px] flex flex-col">
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
                <TaskCard key={task.id} task={task} onClick={onTaskClick} />
              ))}
            </div>

            {/* Add button */}
            <button
              onClick={() => onAddTask(col.status)}
              className="mt-2 flex items-center justify-center gap-1.5 w-full py-2 text-sm text-gray-400 hover:text-blue-600 hover:bg-blue-50 border border-dashed border-gray-200 hover:border-blue-300 rounded-lg transition-all"
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
