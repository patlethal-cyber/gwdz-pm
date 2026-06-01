'use client'

import { Calendar, Tag } from 'lucide-react'
import type { Task } from '@/lib/types'
import { getMember, getScenario } from '@/lib/store'

const priorityConfig: Record<Task['priority'], { color: string; dot: string }> = {
  '紧急': { color: 'text-red-700 bg-red-50', dot: 'bg-red-500' },
  '高': { color: 'text-orange-700 bg-orange-50', dot: 'bg-orange-500' },
  '中': { color: 'text-blue-700 bg-blue-50', dot: 'bg-blue-500' },
  '低': { color: 'text-gray-600 bg-gray-100', dot: 'bg-gray-400' },
}

interface TaskCardProps {
  task: Task
  onClick: (task: Task) => void
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const member = getMember(task.assigneeId)
  const scenario = task.scenarioId ? getScenario(task.scenarioId) : undefined
  const prio = priorityConfig[task.priority]
  const today = '2026-05-31'
  const isOverdue = task.status !== '已完成' && task.dueDate < today

  const completedChecklist = task.checklist.filter(c => c.done).length
  const totalChecklist = task.checklist.length

  return (
    <div
      onClick={() => onClick(task)}
      className="bg-white rounded-lg border border-gray-200 p-3.5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
          {task.title}
        </h4>
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium flex-shrink-0 ${prio.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${prio.dot}`} />
          {task.priority}
        </span>
      </div>

      {scenario && (
        <div className="mb-2">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 text-[11px] font-medium">
            <Tag size={10} />
            {scenario.code} {scenario.name}
          </span>
        </div>
      )}

      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {task.tags.map(tag => (
            <span key={tag} className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-[11px]">
              {tag}
            </span>
          ))}
        </div>
      )}

      {totalChecklist > 0 && (
        <div className="mb-2.5">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${(completedChecklist / totalChecklist) * 100}%` }}
              />
            </div>
            <span className="text-[11px] text-gray-400">{completedChecklist}/{totalChecklist}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-1 text-[11px] ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
          <Calendar size={11} />
          <span>{isOverdue && '已逾期 '}{task.dueDate}</span>
        </div>
        {member && (
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
            style={{ backgroundColor: member.color }}
            title={member.name}
          >
            {member.initials}
          </div>
        )}
      </div>
    </div>
  )
}
