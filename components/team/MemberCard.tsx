'use client'

import { Mail, Phone } from 'lucide-react'
import type { TeamMember } from '@/lib/types'

interface TaskCount {
  total: number
  inProgress: number
  done: number
}

interface MemberCardProps {
  member: TeamMember
  taskCount?: TaskCount
}

export default function MemberCard({ member, taskCount }: MemberCardProps) {
  const todo = taskCount ? taskCount.total - taskCount.inProgress - taskCount.done : 0

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white text-base font-bold flex-shrink-0"
          style={{ backgroundColor: member.color }}
        >
          {member.initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-gray-900">{member.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{member.role}</p>
          <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-medium text-gray-600 bg-gray-100 rounded-full">
            {member.group}
          </span>
        </div>
      </div>

      {(member.email || member.phone) && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
          {member.email && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Mail size={12} className="flex-shrink-0" />
              <span className="truncate">{member.email}</span>
            </div>
          )}
          {member.phone && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Phone size={12} className="flex-shrink-0" />
              <span>{member.phone}</span>
            </div>
          )}
        </div>
      )}

      {taskCount && taskCount.total > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-gray-400">任务分布</span>
            <span className="text-[10px] text-gray-500 font-medium">共 {taskCount.total} 项</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
            {taskCount.done > 0 && (
              <div
                className="bg-emerald-500 h-full"
                style={{ width: `${(taskCount.done / taskCount.total) * 100}%` }}
              />
            )}
            {taskCount.inProgress > 0 && (
              <div
                className="bg-blue-500 h-full"
                style={{ width: `${(taskCount.inProgress / taskCount.total) * 100}%` }}
              />
            )}
            {todo > 0 && (
              <div
                className="bg-gray-300 h-full"
                style={{ width: `${(todo / taskCount.total) * 100}%` }}
              />
            )}
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1 text-[10px] text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              已完成 {taskCount.done}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              进行中 {taskCount.inProgress}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
              待办 {todo}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
