import Header from '@/components/layout/Header'
import StatsCards from '@/components/dashboard/StatsCards'
import MilestoneTimeline from '@/components/dashboard/MilestoneTimeline'
import GanttChart from '@/components/dashboard/GanttChart'
import TaskDistribution from '@/components/dashboard/TaskDistribution'
import DepartmentProgress from '@/components/dashboard/DepartmentProgress'
import RiskAlerts from '@/components/dashboard/RiskAlerts'
import ActivityFeed from '@/components/dashboard/ActivityFeed'
import {
  tasks,
  milestones,
  deliverables,
  activities,
  getTasksByStatus,
  getOverdueTasks,
  getMember,
  getScenario,
} from '@/lib/store'

export default function DashboardPage() {
  // --- Stats ---
  const totalTasks = tasks.length
  const inProgress = getTasksByStatus('进行中').length
  const overdueTasks = getOverdueTasks()
  const overdueCount = overdueTasks.length

  const archivedCount = deliverables.filter(
    (d) => d.status === '已归档'
  ).length
  const deliverableRate = Math.round(
    (archivedCount / deliverables.length) * 100
  )

  // --- Risk items ---
  const urgentTasks = tasks.filter(
    (t) => t.priority === '紧急' && t.status !== '已完成'
  )

  const riskMap = new Map<
    string,
    {
      id: string
      title: string
      assignee: string
      dueDate: string
      scenario?: string
      type: 'overdue' | 'urgent'
    }
  >()

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

  const riskItems = Array.from(riskMap.values()).sort((a, b) => {
    if (a.type === 'overdue' && b.type !== 'overdue') return -1
    if (a.type !== 'overdue' && b.type === 'overdue') return 1
    return a.dueDate.localeCompare(b.dueDate)
  })

  // --- Activity feed ---
  const sortedActivities = [...activities]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 8)

  const activityItems = sortedActivities.map((act) => {
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

  return (
    <>
      <Header title="项目总览" subtitle="国微电子 HIAgent AI 智能体项目" />

      <div className="p-6 space-y-6">
        {/* Row 1: KPI Cards */}
        <StatsCards
          totalTasks={totalTasks}
          inProgress={inProgress}
          overdue={overdueCount}
          deliverableRate={deliverableRate}
        />

        {/* Row 2: Milestone Timeline */}
        <MilestoneTimeline milestones={milestones} />

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
