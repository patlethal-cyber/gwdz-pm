'use client'

import { useMemo } from 'react'
import { useData } from '@/lib/data-context'
import Header from '@/components/layout/Header'
import StatsCards from '@/components/dashboard/StatsCards'
import MilestoneTimeline from '@/components/dashboard/MilestoneTimeline'
import GanttChart from '@/components/dashboard/GanttChart'
import TaskDistribution from '@/components/dashboard/TaskDistribution'
import DepartmentProgress from '@/components/dashboard/DepartmentProgress'
import RiskAlerts from '@/components/dashboard/RiskAlerts'
import ActivityFeed from '@/components/dashboard/ActivityFeed'
import { Calendar, Clock, AlertTriangle, Target } from 'lucide-react'

const TODAY = '2026-05-31'

function daysBetweenStrings(a: string, b: string) {
  const pa = a.split('-').map(Number)
  const pb = b.split('-').map(Number)
  const monthDays = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  function toDayCount(parts: number[]) {
    let total = 0
    for (let m = 1; m < parts[1]; m++) total += monthDays[m]
    total += parts[2]
    total += (parts[0] - 2026) * 365
    return total
  }
  return toDayCount(pb) - toDayCount(pa)
}

export default function DashboardPage() {
  const {
    tasks,
    deliverables,
    meetings,
    issues,
    milestones,
    activities,
    ready,
    getMember,
    getScenario,
    getOverdueTasks,
  } = useData()

  // --- Today focus bar ---
  const todayFocus = useMemo(() => {
    const m4 = milestones.find(m => m.code === 'M4')
    const daysToM4 = m4 ? daysBetweenStrings(TODAY, m4.date) : 0
    const overdueCount = getOverdueTasks().length

    // Meetings this week: 5/31 (Sat) to 6/6 (Fri)
    const weekEnd = '2026-06-06'
    const meetingsThisWeek = meetings.filter(m => {
      return m.date >= TODAY && m.date <= weekEnd && m.status !== '已取消'
    }).length

    const severeIssues = issues.filter(
      i => i.severity === '严重' && i.status !== '已解决' && i.status !== '已关闭'
    ).length

    return { daysToM4, overdueCount, meetingsThisWeek, severeIssues }
  }, [milestones, meetings, issues, getOverdueTasks])

  // --- Risk items ---
  const riskItems = useMemo(() => {
    const overdueTasks = getOverdueTasks()
    const urgentTasks = tasks.filter(
      t => t.priority === '紧急' && t.status !== '已完成'
    )

    const riskMap = new Map<string, {
      id: string
      title: string
      assignee: string
      dueDate: string
      scenario?: string
      type: 'overdue' | 'urgent'
    }>()

    for (const t of overdueTasks) {
      const member = getMember(t.assigneeId)
      const scenario = t.scenarioId ? getScenario(t.scenarioId) : undefined
      riskMap.set(t.id, {
        id: t.id,
        title: t.title,
        assignee: member?.name ?? t.assigneeId,
        dueDate: t.dueDate,
        scenario: scenario?.code,
        type: 'overdue',
      })
    }

    for (const t of urgentTasks) {
      if (!riskMap.has(t.id)) {
        const member = getMember(t.assigneeId)
        const scenario = t.scenarioId ? getScenario(t.scenarioId) : undefined
        riskMap.set(t.id, {
          id: t.id,
          title: t.title,
          assignee: member?.name ?? t.assigneeId,
          dueDate: t.dueDate,
          scenario: scenario?.code,
          type: 'urgent',
        })
      }
    }

    return Array.from(riskMap.values()).sort((a, b) => {
      if (a.type === 'overdue' && b.type !== 'overdue') return -1
      if (a.type !== 'overdue' && b.type === 'overdue') return 1
      return a.dueDate.localeCompare(b.dueDate)
    })
  }, [tasks, getMember, getScenario, getOverdueTasks])

  // --- Activity feed ---
  const activityItems = useMemo(() => {
    const sorted = [...activities].sort((a, b) =>
      b.timestamp.localeCompare(a.timestamp)
    ).slice(0, 8)

    return sorted.map(act => {
      const member = getMember(act.userId)
      return {
        id: act.id,
        type: act.type,
        action: act.action,
        subject: act.subject,
        userName: member?.name ?? act.userId,
        userInitials: member?.initials ?? '??',
        userColor: member?.color ?? '#6b7280',
        timestamp: act.timestamp,
      }
    })
  }, [activities, getMember])

  // --- Loading skeleton ---
  if (!ready) {
    return (
      <>
        <Header title="项目总览" subtitle="国微电子 HIAgent AI 智能体项目" />
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-4 gap-5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
          <div className="h-40 rounded-xl bg-gray-100 animate-pulse" />
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 h-[520px] rounded-xl bg-gray-100 animate-pulse" />
            <div className="col-span-1 h-[300px] rounded-xl bg-gray-100 animate-pulse" />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="h-[300px] rounded-xl bg-gray-100 animate-pulse" />
            <div className="h-[300px] rounded-xl bg-gray-100 animate-pulse" />
          </div>
          <div className="h-60 rounded-xl bg-gray-100 animate-pulse" />
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
                    距 M4 一批UAT <span className="font-bold text-blue-700">{todayFocus.daysToM4}</span> 天
                  </span>
                </div>
                <div className="h-4 w-px bg-blue-200" />
                <div className="flex items-center gap-1.5">
                  <AlertTriangle size={14} className={todayFocus.overdueCount > 0 ? 'text-red-500' : 'text-gray-400'} />
                  <span className="text-gray-700">
                    逾期 <span className={`font-bold ${todayFocus.overdueCount > 0 ? 'text-red-600' : 'text-gray-700'}`}>{todayFocus.overdueCount}</span> 项
                  </span>
                </div>
                <div className="h-4 w-px bg-blue-200" />
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-blue-500" />
                  <span className="text-gray-700">
                    本周会议 <span className="font-bold text-blue-700">{todayFocus.meetingsThisWeek}</span> 场
                  </span>
                </div>
                {todayFocus.severeIssues > 0 && (
                  <>
                    <div className="h-4 w-px bg-blue-200" />
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle size={14} className="text-red-500" />
                      <span className="text-gray-700">
                        严重问题 <span className="font-bold text-red-600">{todayFocus.severeIssues}</span> 个
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Row 1: KPI Cards */}
        <StatsCards />

        {/* Row 2: Milestone Timeline */}
        <MilestoneTimeline />

        {/* Row 3: Gantt Chart + Task Distribution */}
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <GanttChart />
          </div>
          <div className="col-span-1">
            <TaskDistribution />
          </div>
        </div>

        {/* Row 4: Department Progress + Risk Alerts */}
        <div className="grid grid-cols-2 gap-6">
          <DepartmentProgress />
          <RiskAlerts items={riskItems} />
        </div>

        {/* Row 5: Activity Feed */}
        <ActivityFeed items={activityItems} />
      </div>
    </>
  )
}
