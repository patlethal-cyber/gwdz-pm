'use client'

import { useState, useMemo } from 'react'
import { Users, Building2, Globe } from 'lucide-react'
import Header from '@/components/layout/Header'
import MemberCard from '@/components/team/MemberCard'
import PersonDetail from '@/components/team/PersonDetail'
import { useData } from '@/lib/data-context'
import type { TeamMember } from '@/lib/types'

const EDEN_GROUPS = new Set(['项目管理', '第二执行组', '第一执行组', '专项支持', '领导委员会'])
const GROUP_ORDER = ['项目管理', '第二执行组', '第一执行组', '专项支持', '领导委员会']

export default function TeamPage() {
  const { team, externalContacts, tasks, issues, scenarios, ready } = useData()
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)

  // Filter Eden members (those in known Eden groups)
  const edenMembers = useMemo(() => team.filter(m => EDEN_GROUPS.has(m.group)), [team])

  // Count helpers
  const memberTaskCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const t of tasks) {
      if (t.assigneeId) map[t.assigneeId] = (map[t.assigneeId] || 0) + 1
    }
    return map
  }, [tasks])

  const memberIssueCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const i of issues) {
      if (i.assigneeId) map[i.assigneeId] = (map[i.assigneeId] || 0) + 1
    }
    return map
  }, [issues])

  const memberScenarioCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const s of scenarios) {
      if (s.ownerId) map[s.ownerId] = (map[s.ownerId] || 0) + 1
    }
    return map
  }, [scenarios])

  // Group Eden members by group
  const edenGroups = useMemo(() => {
    const groups = new Map<string, TeamMember[]>()
    for (const m of edenMembers) {
      const list = groups.get(m.group) || []
      list.push(m)
      groups.set(m.group, list)
    }
    // Sort by predefined order
    const sorted: [string, TeamMember[]][] = []
    for (const g of GROUP_ORDER) {
      const members = groups.get(g)
      if (members) sorted.push([g, members])
    }
    // Add any remaining groups not in ORDER
    for (const [g, members] of groups) {
      if (!GROUP_ORDER.includes(g)) sorted.push([g, members])
    }
    return sorted
  }, [edenMembers])

  // Group external contacts by organization then department
  const extGrouped = useMemo(() => {
    const orgs: Record<string, Record<string, typeof externalContacts>> = {}
    for (const c of externalContacts) {
      const org = c.organization
      const dept = c.department || '其他'
      if (!orgs[org]) orgs[org] = {}
      if (!orgs[org][dept]) orgs[org][dept] = []
      orgs[org][dept].push(c)
    }
    return orgs
  }, [externalContacts])

  if (!ready) {
    return (
      <>
        <Header title="团队" subtitle="加载中..." />
        <div className="p-6 space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-3">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                {[1, 2, 3].map(j => (
                  <div key={j} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </>
    )
  }

  return (
    <>
      <Header
        title="团队"
        subtitle={`共 ${edenMembers.length + externalContacts.length} 名项目成员`}
      />

      <div className="flex-1 overflow-y-auto bg-gray-50 p-6 space-y-8">

        {/* Eden Team */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 text-blue-600">
              <Building2 size={15} />
            </span>
            <h2 className="text-base font-semibold text-gray-900">伊登团队</h2>
            <span className="text-xs text-gray-400 ml-1">{edenMembers.length} 人</span>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-5">
            {edenGroups.map(([groupName, members]) => (
              <div key={groupName}>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {groupName}
                  </h3>
                  <span className="text-[10px] text-gray-300">{members.length}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                  {members.map(member => (
                    <MemberCard
                      key={member.id}
                      member={member}
                      onClick={() => setSelectedMember(member)}
                      taskCount={memberTaskCounts[member.id] || 0}
                      issueCount={memberIssueCounts[member.id] || 0}
                      scenarioCount={memberScenarioCounts[member.id] || 0}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* External Contacts */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600">
              <Globe size={15} />
            </span>
            <h2 className="text-base font-semibold text-gray-900">外部团队</h2>
            <span className="text-xs text-gray-400 ml-1">{externalContacts.length} 人</span>
          </div>

          <div className="space-y-4">
            {Object.entries(extGrouped).map(([org, depts]) => (
              <div key={org} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    org === '甲方'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-orange-50 text-orange-700'
                  }`}>
                    {org === '甲方' ? '甲方 - 国微电子' : '火山引擎'}
                  </span>
                </div>

                <div className="space-y-4">
                  {Object.entries(depts).map(([dept, contacts]) => (
                    <div key={dept}>
                      <h4 className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">
                        {dept}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                        {contacts.map(contact => (
                          <div
                            key={contact.id}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                          >
                            <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500 flex-shrink-0">
                              {contact.name.slice(0, 1)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900">{contact.name}</span>
                                <span className="text-[11px] text-gray-400 truncate">{contact.role}</span>
                              </div>
                              {contact.contactFor && (
                                <p className="text-[11px] text-gray-400 truncate mt-0.5">{contact.contactFor}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Person Detail Slide-over */}
      {selectedMember && (
        <PersonDetail
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </>
  )
}
