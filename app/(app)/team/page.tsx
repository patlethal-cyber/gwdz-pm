'use client'

import { useState } from 'react'
import Header from '@/components/layout/Header'
import TeamDirectory from '@/components/team/TeamDirectory'
import { team, getTeamByOrg } from '@/lib/store'
import type { TeamMember } from '@/lib/types'

const tabs: { label: string; org: TeamMember['organization'] }[] = [
  { label: '甲方团队', org: '甲方' },
  { label: '乙方团队', org: '乙方' },
  { label: '火山引擎', org: '火山引擎' },
]

export default function TeamPage() {
  const [activeOrg, setActiveOrg] = useState<TeamMember['organization']>('乙方')
  const members = getTeamByOrg(activeOrg)

  return (
    <>
      <Header
        title="团队"
        subtitle={`共 ${team.length} 名项目成员`}
      />
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.org}
              onClick={() => setActiveOrg(tab.org)}
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                activeOrg === tab.org
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-xs ${activeOrg === tab.org ? 'text-blue-200' : 'text-gray-400'}`}>
                {getTeamByOrg(tab.org).length}
              </span>
            </button>
          ))}
        </div>
        <TeamDirectory
          members={members}
          showWorkload={activeOrg === '乙方'}
        />
      </div>
    </>
  )
}
