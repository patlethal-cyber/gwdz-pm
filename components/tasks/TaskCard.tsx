'use client'

import { Calendar, Bug } from 'lucide-react'
import type { Task, Issue, TeamMember, Scenario } from '@/lib/types'

const priorityConfig: Record<Task['priority'], { color: string; dot: string; label: string }> = {
  '紧急': { color: 'text-red-700', dot: 'bg-red-500', label: '紧急' },
  '高': { color: 'text-orange-700', dot: 'bg-orange-500', label: '高' },
  '中': { color: 'text-blue-700', dot: 'bg-blue-500', label: '中' },
  '低': { color: 'text-gray-500', dot: 'bg-gray-400', label: '低' },
}

interface TaskCardProps {
  task: Task
  onClick: (task: Task) => void
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, task: Task) => void
  issues: Issue[]
  getMember?: (id: string) => TeamMember | undefined
  getScenario?: (id: string) => Scenario | undefined
  today: string
}

export default function TaskCard({ task, onClick, onDragStart, issues, getMember, getScenario, today }: TaskCardProps) {
  const member = getMember?.(task.assigneeId)
  const scenario = task.scenarioId ? getScenario?.(task.scenarioId) : undefined
  const prio = priorityConfig[task.priority]

  // Count linked issues: issues whose linkedTaskIds array contains this task's id
  const linkedIssueCount = issues.filter(iss =>
    iss.linkedTaskIds && iss.linkedTaskIds.includes(task.id)
  ).length

  const isOverdue = task.status !== '已完成' && task.dueDate < today

  return (
    <div
      draggable="true"
      onDragStart={e => onDragStart?.(e, task)}
      onClick={() => onClick(task)}
      className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group active:cursor-grabbing"
    >
      {/* Top row: assignee (left) | scenario badge (right) */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {member && (
            <>
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                style={{ backgroundColor: member.color }}
                title={member.name}
              >
                {member.initials}
              </div>
              <span className="text-xs text-gray-500 truncate">{member.name}</span>
            </>
          )}
        </div>
        <div className="flex-shrink-0">
          {scenario ? (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 text-[10px] font-medium">
              {scenario.code}
            </span>
          ) : (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-[10px] font-medium">
              项目
            </span>
          )}
        </div>
      </div>

      {/* Middle: task title */}
      <h4 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
        {task.title}
      </h4>

      {/* Bottom row: priority (left) | due date + issue count (right) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${prio.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${prio.dot}`} />
            {prio.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {linkedIssueCount > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[11px] text-red-500 font-medium">
              <Bug size={11} />
              {linkedIssueCount}
            </span>
          )}
          <span className={`inline-flex items-center gap-1 text-[11px] ${isOverdue ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
            <Calendar size={11} />
            {task.dueDate.slice(5)}
            {isOverdue && ' 逾期'}
          </span>
        </div>
      </div>
    </div>
  )
}
