'use client'

// Legacy component — team page now uses MemberCard directly.
// Kept for backward compatibility if referenced elsewhere.

import type { TeamMember } from '@/lib/types'
import MemberCard from './MemberCard'

interface TeamDirectoryProps {
  members: TeamMember[]
  showWorkload?: boolean
}

export default function TeamDirectory({ members }: TeamDirectoryProps) {
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
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
