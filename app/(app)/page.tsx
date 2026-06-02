'use client'

import { useMemo, useState } from 'react'
import { useData } from '@/lib/data-context'
import Header from '@/components/layout/Header'
import StatsCards from '@/components/dashboard/StatsCards'
import GanttChart from '@/components/dashboard/GanttChart'
import ScenarioGrid from '@/components/dashboard/ScenarioGrid'
// MilestoneTimeline removed — current phase shown in FocusBar + GanttChart milestones
import PersonDetail from '@/components/team/PersonDetail'
import { Calendar, Clock, AlertTriangle, Target, BarChart3, Cpu, Users, FileBox } from 'lucide-react'
import type { TeamMember, DeliverableStatus } from '@/lib/types'

function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00')
  const db = new Date(b + 'T00:00:00')
  return Math.round((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24))
}

function getWeekEnd(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const dayOfWeek = d.getDay() // 0=Sun
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
  const end = new Date(d.getTime() + daysUntilSunday * 24 * 60 * 60 * 1000)
  const y = end.getFullYear()
  const m = String(end.getMonth() + 1).padStart(2, '0')
  const dd = String(end.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

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

  const [activeTab, setActiveTab] = useState<DashboardTab>('gantt')
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [pipelineFilter, setPipelineFilter] = useState<DeliverableStatus | null>(null)

  // --- Dashboard stats ---
  const stats = useMemo(() => getDashboardStats(), [getDashboardStats])

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
          <div className="grid grid-cols-4 gap-5">
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
        {/* Today Focus Bar */}
        <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">今日聚焦</span>
              </div>
              <div className="flex items-center gap-5 text-sm">
                <div className="flex items-center gap-1.5">
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
                <div className="flex items-center gap-1.5">
                  <AlertTriangle
                    size={14}
                    className={todayFocus.overdueCount > 0 ? 'text-red-500' : 'text-gray-400'}
                  />
                  <span className="text-gray-700">
                    逾期任务{' '}
                    <span
                      className={`font-bold ${
                        todayFocus.overdueCount > 0 ? 'text-red-600' : 'text-gray-700'
                      }`}
                    >
                      {todayFocus.overdueCount}
                    </span>{' '}
                    项
                  </span>
                </div>
                <div className="h-4 w-px bg-blue-200" />
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-blue-500" />
                  <span className="text-gray-700">
                    本周会议{' '}
                    <span className="font-bold text-blue-700">{todayFocus.meetingsThisWeek}</span>{' '}
                    场
                  </span>
                </div>
                <div className="h-4 w-px bg-blue-200" />
                <div className="flex items-center gap-1.5">
                  <AlertTriangle
                    size={14}
                    className={todayFocus.severeIssues > 0 ? 'text-red-500' : 'text-gray-400'}
                  />
                  <span className="text-gray-700">
                    严重问题{' '}
                    <span
                      className={`font-bold ${
                        todayFocus.severeIssues > 0 ? 'text-red-600' : 'text-gray-700'
                      }`}
                    >
                      {todayFocus.severeIssues}
                    </span>{' '}
                    个
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <StatsCards stats={stats} />

        {/* Tab Bar */}
        <div className="bg-gray-100 p-1 rounded-xl inline-flex gap-1">
          {TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
                      <span className="text-xs text-gray-400 truncate">{member.role}</span>
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
              <div className="rounded-xl border border-gray-200 bg-white px-5 py-12 text-center text-sm text-gray-400">
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
                  <span className="ml-2 text-xs font-normal text-gray-400">{pipelineItems.length} 项</span>
                </h3>
              </div>
              <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
                {pipelineItems.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-gray-400">
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
                          <span className="text-xs text-gray-400 w-20 text-right">{item.dueDate}</span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Milestone Timeline — always visible */}
        {/* MilestoneTimeline removed */}
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
