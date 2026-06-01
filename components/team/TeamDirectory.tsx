'use client'

import type { TeamMember } from '@/lib/types'
import { tasks } from '@/lib/store'
import MemberCard from './MemberCard'

interface TeamDirectoryProps {
  members: TeamMember[]
  showWorkload?: boolean
}

function getTaskCountForMember(memberId: string) {
  const memberTasks = tasks.filter(t => t.assigneeId === memberId)
  return {
    total: memberTasks.length,
    inProgress: memberTasks.filter(t => t.status === '进行中' || t.status === '审核中').length,
    done: memberTasks.filter(t => t.status === '已完成').length,
  }
}

export default function TeamDirectory({ members, showWorkload = false }: TeamDirectoryProps) {
  const groups = new Map<string, TeamMember[]>()
  for (const member of members) {
    const list = groups.get(member.group) || []
    list.push(member)
    groups.set(member.group, list)
  }

  return (
    <div className="space-y-8">
      {Array.from(groups.entries()).map(([groupName, groupMembers]) => (
        <section key={groupName}>
          <div className="flex items-center gap-2 pb-2 mb-4 border-b border-gray-200">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {groupName}
            </h2>
            <span className="text-[10px] text-gray-300 font-medium">
              {groupMembers.length} 人
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {groupMembers.map(member => (
              <MemberCard
                key={member.id}
                member={member}
                taskCount={showWorkload ? getTaskCountForMember(member.id) : undefined}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
