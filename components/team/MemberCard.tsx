'use client'

import type { TeamMember } from '@/lib/types'

interface MemberCardProps {
  member: TeamMember
  onClick?: () => void
  taskCount?: number
  issueCount?: number
  scenarioCount?: number
}

export default function MemberCard({ member, onClick, taskCount, issueCount, scenarioCount }: MemberCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 bg-white rounded-lg border border-gray-100 hover:border-gray-300 hover:shadow-sm transition-all text-left group"
    >
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
        style={{ backgroundColor: member.color }}
      >
        {member.initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 truncate">{member.name}</span>
          <span className="text-[11px] text-gray-500 truncate hidden sm:inline">{member.role}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {typeof taskCount === 'number' && taskCount > 0 && (
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-medium bg-blue-50 text-blue-600 rounded">
            {taskCount}任务
          </span>
        )}
        {typeof issueCount === 'number' && issueCount > 0 && (
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-medium bg-amber-50 text-amber-600 rounded">
            {issueCount}问题
          </span>
        )}
        {typeof scenarioCount === 'number' && scenarioCount > 0 && (
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-medium bg-violet-50 text-violet-600 rounded">
            {scenarioCount}场景
          </span>
        )}
      </div>
    </button>
  )
}
