import type { Task, Scenario, Deliverable, Meeting, TeamMember, Milestone, Activity } from './types'
import teamData from './data/team.json'
import scenarioData from './data/scenarios.json'
import milestoneData from './data/milestones.json'
import taskData from './data/tasks.json'
import deliverableData from './data/deliverables.json'
import meetingData from './data/meetings.json'

export const team: TeamMember[] = teamData as TeamMember[]
export const scenarios: Scenario[] = scenarioData as Scenario[]
export const milestones: Milestone[] = milestoneData as Milestone[]
export const tasks: Task[] = taskData as Task[]
export const deliverables: Deliverable[] = deliverableData as Deliverable[]
export const meetings: Meeting[] = meetingData as Meeting[]

export function getMember(id: string): TeamMember | undefined {
  return team.find(m => m.id === id)
}

export function getScenario(id: string): Scenario | undefined {
  return scenarios.find(s => s.id === id)
}

export function getTasksByStatus(status: Task['status']): Task[] {
  return tasks.filter(t => t.status === status)
}

export function getDeliverablesByStatus(status: Deliverable['status']): Deliverable[] {
  return deliverables.filter(d => d.status === status)
}

export function getUpcomingMeetings(): Meeting[] {
  return meetings.filter(m => m.status === '即将召开').sort((a, b) => a.date.localeCompare(b.date))
}

export function getPastMeetings(): Meeting[] {
  return meetings.filter(m => m.status === '已结束').sort((a, b) => b.date.localeCompare(a.date))
}

export function getOverdueTasks(): Task[] {
  const today = '2026-05-31'
  return tasks.filter(t => t.status !== '已完成' && t.dueDate < today)
}

export function getTeamByOrg(org: TeamMember['organization']): TeamMember[] {
  return team.filter(m => m.organization === org)
}

export const activities: Activity[] = [
  { id: 'act1', type: 'task', action: '创建了任务', subject: '催客户交付 S06 首批入库清单', userId: 'm01', timestamp: '2026-05-29T10:00:00' },
  { id: 'act2', type: 'deliverable', action: '更新了蓝图', subject: 'S01 质量分析报告生成 v2', userId: 'm01', timestamp: '2026-05-28T21:44:00' },
  { id: 'act3', type: 'task', action: '开始执行', subject: 'S02 数据工程 — 建 B1+B2 库', userId: 'm06', timestamp: '2026-05-25T09:00:00' },
  { id: 'act4', type: 'milestone', action: '已完成', subject: 'M3 环境部署完成', userId: 'm32', timestamp: '2026-05-25T18:00:00' },
  { id: 'act5', type: 'task', action: '开始执行', subject: 'S04 数据工程 — 建 C 履历库', userId: 'm02', timestamp: '2026-05-29T09:00:00' },
  { id: 'act6', type: 'deliverable', action: '更新了蓝图', subject: '测试一部 S37 v2.2', userId: 'm04', timestamp: '2026-05-28T22:26:00' },
  { id: 'act7', type: 'meeting', action: '创建了会议', subject: '项目周会 W02', userId: 'm01', timestamp: '2026-05-31T08:00:00' },
  { id: 'act8', type: 'task', action: '标记为紧急', subject: '申请插件执行服务器', userId: 'm01', timestamp: '2026-05-31T09:00:00' },
]
