export type TaskStatus = '待办' | '进行中' | '审核中' | '已完成'
export type TaskPriority = '紧急' | '高' | '中' | '低'
export type DeliverableStatus = '待编制' | '编制中' | '待审核' | '待签字' | '已归档'
export type MilestoneStatus = '已完成' | '进行中' | '待开始'
export type MeetingStatus = '即将召开' | '已结束' | '已取消'

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assigneeId: string
  dueDate: string
  scenarioId?: string
  department?: string
  tags: string[]
  checklist: ChecklistItem[]
  createdAt: string
  updatedAt: string
}

export interface ChecklistItem {
  id: string
  text: string
  done: boolean
}

export interface Scenario {
  id: string
  code: string
  name: string
  department: string
  type: string
  batch: string
  executionGroup: string
  blueprintVersion: string
  dataReadiness: 'green' | 'amber' | 'red'
  dataNote: string
  owner: string
}

export interface Deliverable {
  id: string
  name: string
  code: string
  scenarioId?: string
  scenarioCode?: string
  status: DeliverableStatus
  version: string
  ownerId: string
  templateType: string
  department: string
  dueDate: string
  updatedAt: string
}

export interface Meeting {
  id: string
  title: string
  date: string
  time: string
  duration: number
  location: string
  attendeeIds: string[]
  agendaItems: AgendaItem[]
  minutes: string
  actionItems: ActionItem[]
  status: MeetingStatus
  type: '周会' | '里程碑评审' | '部门对接' | '日常沟通'
  createdAt: string
}

export interface AgendaItem {
  id: string
  text: string
  duration: number
  presenter: string
}

export interface ActionItem {
  id: string
  text: string
  assigneeId: string
  dueDate: string
  done: boolean
}

export interface TeamMember {
  id: string
  name: string
  role: string
  group: string
  organization: '甲方' | '乙方' | '火山引擎'
  department?: string
  email?: string
  phone?: string
  initials: string
  color: string
}

export interface Milestone {
  id: string
  code: string
  name: string
  date: string
  status: MilestoneStatus
  description: string
}

export interface Activity {
  id: string
  type: 'task' | 'deliverable' | 'meeting' | 'milestone'
  action: string
  subject: string
  userId: string
  timestamp: string
}
