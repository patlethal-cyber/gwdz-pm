'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useData } from '@/lib/data-context'
import { useCurrentMember } from '@/components/layout/current-member-context'
import Header from '@/components/layout/Header'
import StatsCards from '@/components/dashboard/StatsCards'
import GanttChart from '@/components/dashboard/GanttChart'
import ScenarioGrid from '@/components/dashboard/ScenarioGrid'
import PersonDetail from '@/components/team/PersonDetail'
import { Calendar, Clock, Target, BarChart3, Cpu, Users, FileBox, AlertTriangle, Loader2, CalendarClock, ChevronsUpDown } from 'lucide-react'
import type { TeamMember, DeliverableStatus } from '@/lib/types'
import { daysBetween, getWeekEnd } from '@/lib/date'

type DashboardTab = 'gantt' | 'scenarios' | 'team' | 'pipeline'

const TABS: { key: DashboardTab; label: string; icon: typeof BarChart3 }[] = [
  { key: 'gantt', label: '甘特图', icon: BarChart3 },
  { key: 'scenarios', label: '场景进度', icon: Cpu },
  { key: 'team', label: '团队负载', icon: Users },
  { key: 'pipeline', label: '交付物管线', icon: FileBox },
]

const scenarioColors: Record<string, string> = {
  S01: 'bg-blue-100 text-blue-700',
  S02: 'bg-indigo-100 text-indigo-700',
  S04: 'bg-violet-100 text-violet-700',
  S06: 'bg-purple-100 text-purple-700',
  S98: 'bg-pink-100 text-pink-700',
  S100: 'bg-rose-100 text-rose-700',
  S101: 'bg-orange-100 text-orange-700',
  S37: 'bg-teal-100 text-teal-700',
  S38: 'bg-cyan-100 text-cyan-700',
  S53: 'bg-emerald-100 text-emerald-700',
  S95: 'bg-lime-100 text-lime-700',
  S99: 'bg-amber-100 text-amber-700',
}

const pipelineStatuses: DeliverableStatus[] = ['待编制', '编制中', '待审核', '待签字', '已归档']
const pipelineColors: Record<string, { bg: string; bar: string; text: string }> = {
  '待编制': { bg: 'bg-gray-50', bar: 'bg-gray-400', text: 'text-gray-700' },
  '编制中': { bg: 'bg-blue-50', bar: 'bg-blue-500', text: 'text-blue-700' },
  '待审核': { bg: 'bg-amber-50', bar: 'bg-amber-500', text: 'text-amber-700' },
  '待签字': { bg: 'bg-purple-50', bar: 'bg-purple-500', text: 'text-purple-700' },
  '已归档': { bg: 'bg-green-50', bar: 'bg-green-500', text: 'text-green-700' },
}

export default function DashboardPage() {
  const {
    tasks,
    meetings,
    issues,
    milestones,
    team,
    scenarios,
    deliverables,
    ready,
    getMember,
    getScenario,
    getOverdueTasks,
    getDashboardStats,
    getPersonAggregation,
    today,
  } = useData()

  const router = useRouter()
  const { memberId, hydrated, openPicker } = useCurrentMember()

  const [activeTab, setActiveTab] = useState<DashboardTab>('gantt')
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [pipelineFilter, setPipelineFilter] = useState<DeliverableStatus | null>(null)

  // --- Dashboard stats ---
  const stats = useMemo(() => getDashboardStats(), [getDashboardStats])

  // --- 我的工作台（选了具体成员视角时显示）---
  const me = memberId ? (getMember(memberId) as TeamMember | undefined) : undefined
  const myWork = useMemo(() => {
    if (!memberId) return null
    const weekEnd = getWeekEnd(today)
    const myTasks = tasks.filter(t => t.assigneeId === memberId)
    return {
      inProgress: myTasks.filter(t => t.status === '进行中').length,
      overdue: myTasks.filter(t => t.status !== '已完成' && t.dueDate && t.dueDate < today).length,
      dueThisWeek: myTasks.filter(t => t.status !== '已完成' && t.dueDate >= today && t.dueDate <= weekEnd).length,
      scenarioCount: scenarios.filter(s => s.ownerId === memberId).length,
      pendingDelivs: deliverables.filter(d => d.ownerId === memberId && d.status !== '已归档').length,
    }
  }, [memberId, tasks, scenarios, deliverables, today])

  // --- Today focus bar ---
  const todayFocus = useMemo(() => {
    const m4 = milestones.find(m => m.code === 'M4')
    const daysToM4 = m4 ? daysBetween(today, m4.date) : 0
    const overdueCount = getOverdueTasks().length

    const weekEnd = getWeekEnd(today)
    const meetingsThisWeek = meetings.filter(m => m.date >= today && m.date <= weekEnd).length

    const severeIssues = issues.filter(
      i => i.severity === '严重' && i.status !== '已解决' && i.status !== '已关闭'
    ).length

    return { daysToM4, overdueCount, meetingsThisWeek, severeIssues }
  }, [milestones, meetings, issues, getOverdueTasks, today])

  // --- Team Workload data ---
  const teamWorkloadData = useMemo(() => {
    const internalMembers = team.filter(m => m.organization === '乙方')
    return internalMembers
      .map(member => {
        const memberTasks = tasks.filter(t => t.assigneeId === member.id)
        const taskCount = memberTasks.length
        const overdueCount = memberTasks.filter(
          t => t.status !== '已完成' && t.dueDate < today
        ).length
        const assignedScenarios = scenarios.filter(s => s.ownerId === member.id)
        return { member, taskCount, overdueCount, assignedScenarios }
      })
      .filter(d => d.taskCount > 0 || d.assignedScenarios.length > 0)
  }, [team, tasks, scenarios, today])

  // --- Pipeline data ---
  const pipelineCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const s of pipelineStatuses) {
      counts[s] = deliverables.filter(d => d.status === s).length
    }
    return counts
  }, [deliverables])

  const activePipelineStatus = useMemo(() => {
    if (pipelineFilter) return pipelineFilter
    // Default: most actionable
    if (pipelineCounts['编制中'] > 0) return '编制中' as DeliverableStatus
    if (pipelineCounts['待审核'] > 0) return '待审核' as DeliverableStatus
    return '待编制' as DeliverableStatus
  }, [pipelineFilter, pipelineCounts])

  const pipelineItems = useMemo(() => {
    return deliverables.filter(d => d.status === activePipelineStatus)
  }, [deliverables, activePipelineStatus])

  const pipelineTotal = useMemo(() => {
    return Object.values(pipelineCounts).reduce((a, b) => a + b, 0)
  }, [pipelineCounts])

  // --- Loading skeleton ---
  if (!ready) {
    return (
      <>
        <Header title="项目总览" subtitle="国微电子 HIAgent AI 智能体项目" />
        <div className="p-6 space-y-6">
          <div className="h-14 rounded-xl bg-gray-100 animate-pulse" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
          <div className="h-12 rounded-xl bg-gray-100 animate-pulse" />
          <div className="h-[400px] rounded-xl bg-gray-100 animate-pulse" />
          <div className="h-[300px] rounded-xl bg-gray-100 animate-pulse" />
        </div>
      </>
    )
  }

  return (
    <>
      <Header title="项目总览" subtitle="国微电子 HIAgent AI 智能体项目" />

      <div className="p-6 space-y-6">
        {/* 我的工作台 — 选了具体成员视角时第一眼看到自己的活 */}
        {hydrated && memberId && me && myWork && (
          <div
            className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm border-l-4"
            style={{ borderLeftColor: me.color }}
          >
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: me.color }}
              >
                {me.initials}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-gray-900 truncate">{me.name} 的工作台</h2>
                <p className="text-[11px] text-gray-500">{me.role}</p>
              </div>
              <button
                onClick={openPicker}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors"
                title="切换视角"
              >
                <ChevronsUpDown size={13} />
                <span className="hidden sm:inline">切换</span>
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                onClick={() => router.push(`/tasks?assignee=${memberId}&status=进行中`)}
                className="flex flex-col items-start rounded-lg border border-gray-100 bg-gray-50/60 p-3 hover:border-blue-200 hover:bg-blue-50/50 transition-all text-left"
              >
                <div className="flex items-center gap-1.5 text-[11px] text-gray-500"><Loader2 size={12} /> 我的进行中</div>
                <span className="mt-1 text-2xl font-bold text-blue-600">{myWork.inProgress}</span>
              </button>
              <button
                onClick={() => router.push(`/tasks?assignee=${memberId}&status=overdue`)}
                className={`flex flex-col items-start rounded-lg border p-3 transition-all text-left ${
                  myWork.overdue > 0 ? 'border-red-200 bg-red-50/60 hover:bg-red-50' : 'border-gray-100 bg-gray-50/60 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-1.5 text-[11px] text-gray-500"><AlertTriangle size={12} /> 我的逾期</div>
                <span className={`mt-1 text-2xl font-bold ${myWork.overdue > 0 ? 'text-red-600' : 'text-gray-400'}`}>{myWork.overdue}</span>
              </button>
              <button
                onClick={() => router.push(`/tasks?assignee=${memberId}&status=dueThisWeek`)}
                className="flex flex-col items-start rounded-lg border border-gray-100 bg-gray-50/60 p-3 hover:border-orange-200 hover:bg-orange-50/50 transition-all text-left"
              >
                <div className="flex items-center gap-1.5 text-[11px] text-gray-500"><CalendarClock size={12} /> 本周到期</div>
                <span className="mt-1 text-2xl font-bold text-orange-600">{myWork.dueThisWeek}</span>
              </button>
              <button
                onClick={() => router.push('/scenarios?mine=1')}
                className="flex flex-col items-start rounded-lg border border-gray-100 bg-gray-50/60 p-3 hover:border-violet-200 hover:bg-violet-50/50 transition-all text-left"
              >
                <div className="flex items-center gap-1.5 text-[11px] text-gray-500"><Cpu size={12} /> 我的场景</div>
                <span className="mt-1 text-2xl font-bold text-violet-600">{myWork.scenarioCount}</span>
                {myWork.pendingDelivs > 0 && (
                  <span className="text-[10px] text-gray-500 mt-0.5">{myWork.pendingDelivs} 项交付物待完成</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Today Focus Bar — 只保留独有指标（逾期/严重已在下方 StatsCards，去重）*/}
        <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-3 sm:py-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">今日聚焦</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Clock size={14} className="text-blue-500" />
              <span className="text-gray-700">
                距 M4{' '}
                <span className={`font-bold ${todayFocus.daysToM4 <= 7 ? 'text-red-600' : 'text-blue-700'}`}>
                  {todayFocus.daysToM4}
                </span>{' '}
                天
              </span>
            </div>
            <div className="h-4 w-px bg-blue-200" />
            <div className="flex items-center gap-1.5 text-sm">
              <Calendar size={14} className="text-blue-500" />
              <span className="text-gray-700">
                本周会议{' '}
                <span className="font-bold text-blue-700">{todayFocus.meetingsThisWeek}</span>{' '}
                场
              </span>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <StatsCards stats={stats} />

        {/* Tab Bar */}
        <div className="bg-gray-100 p-1 rounded-xl flex flex-wrap gap-1">
          {TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex flex-shrink-0 items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'gantt' && <GanttChart />}
        {activeTab === 'scenarios' && <ScenarioGrid />}

        {activeTab === 'team' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {teamWorkloadData.map(({ member, taskCount, overdueCount, assignedScenarios }) => (
                <button
                  key={member.id}
                  onClick={() => setSelectedMember(member)}
                  className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-blue-200 hover:shadow-md transition-all text-left"
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 truncate">{member.name}</span>
                      <span className="text-xs text-gray-500 truncate">{member.role}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                        {taskCount} 任务
                      </span>
                      {overdueCount > 0 && (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700">
                          {overdueCount} 逾期
                        </span>
                      )}
                    </div>
                    {assignedScenarios.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {assignedScenarios.map(s => (
                          <span
                            key={s.id}
                            className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                              scenarioColors[s.code] ?? 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {s.code}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
            {teamWorkloadData.length === 0 && (
              <div className="rounded-xl border border-gray-200 bg-white px-5 py-12 text-center text-sm text-gray-500">
                暂无团队成员数据
              </div>
            )}
          </div>
        )}

        {activeTab === 'pipeline' && (
          <div className="space-y-4">
            {/* Status bar chart */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-1 h-12 rounded-lg overflow-hidden">
                {pipelineStatuses.map(status => {
                  const count = pipelineCounts[status] || 0
                  const pct = pipelineTotal > 0 ? Math.max((count / pipelineTotal) * 100, 8) : 20
                  const colors = pipelineColors[status]
                  const isSelected = activePipelineStatus === status
                  return (
                    <button
                      key={status}
                      onClick={() => setPipelineFilter(status)}
                      className={`relative h-full flex flex-col items-center justify-center rounded-lg transition-all ${
                        colors.bar
                      } ${
                        isSelected
                          ? 'ring-2 ring-offset-1 ring-blue-500 opacity-100'
                          : 'opacity-70 hover:opacity-90'
                      }`}
                      style={{ width: `${pct}%`, minWidth: '60px' }}
                    >
                      <span className="text-white text-xs font-bold">{count}</span>
                      <span className="text-white/80 text-[10px]">{status}</span>
                    </button>
                  )
                })}
              </div>
              <div className="flex items-center gap-3 mt-3">
                {pipelineStatuses.map((status, i) => (
                  <div key={status} className="flex items-center gap-1">
                    {i > 0 && <span className="text-gray-300 text-xs mr-1">&rarr;</span>}
                    <span className={`w-2 h-2 rounded-full ${pipelineColors[status].bar}`} />
                    <span className="text-[11px] text-gray-500">{status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Items list */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  {activePipelineStatus}
                  <span className="ml-2 text-xs font-normal text-gray-500">{pipelineItems.length} 项</span>
                </h3>
              </div>
              <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
                {pipelineItems.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-gray-500">
                    暂无交付物
                  </div>
                ) : (
                  pipelineItems.map(item => {
                    const owner = getMember(item.ownerId)
                    const scenario = item.scenarioId ? getScenario(item.scenarioId) : undefined
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-mono font-medium ${pipelineColors[item.status]?.bg ?? 'bg-gray-50'} ${pipelineColors[item.status]?.text ?? 'text-gray-600'}`}>
                            {item.code}
                          </span>
                          <span className="text-sm text-gray-900 truncate">{item.name}</span>
                          {scenario && (
                            <span className={`shrink-0 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${scenarioColors[scenario.code] ?? 'bg-gray-100 text-gray-600'}`}>
                              {scenario.code}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 ml-4 shrink-0">
                          {owner && (
                            <div
                              className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                              style={{ backgroundColor: owner.color }}
                              title={owner.name}
                            >
                              {owner.initials}
                            </div>
                          )}
                          <span className="text-xs text-gray-500 w-20 text-right">{item.dueDate}</span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PersonDetail slide-over */}
      {selectedMember && (
        <PersonDetail
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </>
  )
}
