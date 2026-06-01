'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useData } from '@/lib/data-context'
import Header from '@/components/layout/Header'
import StatsCards from '@/components/dashboard/StatsCards'
import GanttChart from '@/components/dashboard/GanttChart'
import ScenarioGrid from '@/components/dashboard/ScenarioGrid'
import { Calendar, Clock, AlertTriangle, Target, ArrowRight } from 'lucide-react'

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

export default function DashboardPage() {
  const {
    tasks,
    meetings,
    issues,
    milestones,
    ready,
    getMember,
    getScenario,
    getOverdueTasks,
    getDashboardStats,
    today,
  } = useData()

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

  // --- Risk items: overdue tasks + severe issues ---
  const riskItems = useMemo(() => {
    const overdueTasks = getOverdueTasks()
    const urgentTasks = tasks.filter(
      t => t.priority === '紧急' && t.status !== '已完成'
    )

    const taskRisks: Array<{
      id: string
      title: string
      assignee: string
      dueDate: string
      scenario?: string
      type: 'overdue' | 'urgent'
      entityType: 'task'
    }> = []

    const seen = new Set<string>()
    for (const t of overdueTasks) {
      const member = getMember(t.assigneeId)
      const scenario = t.scenarioId ? getScenario(t.scenarioId) : undefined
      seen.add(t.id)
      taskRisks.push({
        id: t.id,
        title: t.title,
        assignee: member?.name ?? t.assigneeId,
        dueDate: t.dueDate,
        scenario: scenario?.code,
        type: 'overdue',
        entityType: 'task',
      })
    }
    for (const t of urgentTasks) {
      if (seen.has(t.id)) continue
      const member = getMember(t.assigneeId)
      const scenario = t.scenarioId ? getScenario(t.scenarioId) : undefined
      taskRisks.push({
        id: t.id,
        title: t.title,
        assignee: member?.name ?? t.assigneeId,
        dueDate: t.dueDate,
        scenario: scenario?.code,
        type: 'urgent',
        entityType: 'task',
      })
    }

    const issueRisks = issues
      .filter(i => i.severity === '严重' && i.status !== '已解决' && i.status !== '已关闭')
      .map(i => {
        const member = getMember(i.assigneeId)
        const scenario = i.scenarioId ? getScenario(i.scenarioId) : undefined
        return {
          id: i.id,
          title: i.title,
          assignee: member?.name ?? i.assigneeId,
          dueDate: i.dueDate ?? i.createdAt,
          scenario: scenario?.code,
          type: 'severe' as const,
          entityType: 'issue' as const,
        }
      })

    return { taskRisks: taskRisks.sort((a, b) => a.dueDate.localeCompare(b.dueDate)), issueRisks }
  }, [tasks, issues, getMember, getScenario, getOverdueTasks])

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
          <div className="h-[400px] rounded-xl bg-gray-100 animate-pulse" />
          <div className="h-[300px] rounded-xl bg-gray-100 animate-pulse" />
          <div className="grid grid-cols-2 gap-6">
            <div className="h-[300px] rounded-xl bg-gray-100 animate-pulse" />
            <div className="h-[300px] rounded-xl bg-gray-100 animate-pulse" />
          </div>
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

        {/* Gantt Chart */}
        <GanttChart />

        {/* Scenario Progress Grid */}
        <ScenarioGrid />

        {/* Risk Alerts (inline) */}
        <div className="grid grid-cols-2 gap-6">
          {/* Overdue / Urgent Tasks */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h3 className="text-sm font-semibold text-gray-900">风险任务</h3>
              <Link
                href="/tasks?status=overdue"
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                查看全部 <ArrowRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {riskItems.taskRisks.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-gray-400">
                  暂无风险任务
                </div>
              ) : (
                riskItems.taskRisks.slice(0, 6).map(item => (
                  <Link
                    key={item.id}
                    href="/tasks"
                    className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            item.type === 'overdue'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {item.type === 'overdue' ? '逾期' : '紧急'}
                        </span>
                        {item.scenario && (
                          <span className="text-[10px] text-gray-400">{item.scenario}</span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-900 truncate">{item.title}</p>
                    </div>
                    <div className="ml-4 text-right shrink-0">
                      <p className="text-xs text-gray-500">{item.assignee}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{item.dueDate}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Severe Issues */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h3 className="text-sm font-semibold text-gray-900">严重问题</h3>
              <Link
                href="/issues?severity=严重"
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                查看全部 <ArrowRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {riskItems.issueRisks.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-gray-400">
                  暂无严重问题
                </div>
              ) : (
                riskItems.issueRisks.slice(0, 6).map(item => (
                  <Link
                    key={item.id}
                    href="/issues"
                    className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-red-100 text-red-700">
                          严重
                        </span>
                        {item.scenario && (
                          <span className="text-[10px] text-gray-400">{item.scenario}</span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-900 truncate">{item.title}</p>
                    </div>
                    <div className="ml-4 text-right shrink-0">
                      <p className="text-xs text-gray-500">{item.assignee}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{item.dueDate}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
