// ===== 枚举类型 =====
export type TaskStatus = '待办' | '进行中' | '审核中' | '已完成'
export type TaskPriority = '紧急' | '高' | '中' | '低'
export type TaskCategory = 'scenario' | 'project' | 'support'
export type DeliverableStatus = '待编制' | '编制中' | '待审核' | '待签字' | '已归档'
export type MilestoneStatus = '已完成' | '进行中' | '待开始'
export type MeetingType = '周会' | '里程碑评审' | '部门对接' | '日常沟通'
export type IssueStatus = '待处理' | '处理中' | '已解决' | '已关闭' | '已驳回'
export type IssueSeverity = '严重' | '一般' | '轻微' | '建议'
export type IssueSource = '甲方反馈' | 'UAT测试' | '内部发现' | '平台问题'
export type IssueCategory = 'scenario' | 'project'
export type FileCategory = '合同与商务' | '需求与方案' | '项目计划' | '交付物模板'
  | '内部管理' | '财务预算' | '方案蓝图' | '样本数据' | '会议纪要' | '其他'

// ===== 核心实体 =====

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
  ownerId: string
  startDate: string
  endDate: string
}

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  category: TaskCategory
  assigneeId: string
  contactId?: string
  scenarioId?: string
  dueDate: string
  tags: string[]
  createdAt: string
  updatedAt: string
  linkedIssueCount?: number
}

export interface Deliverable {
  id: string
  name: string
  code: string
  category: string
  scenarioId?: string
  scenarioCode?: string
  status: DeliverableStatus
  currentVersion?: string
  ownerId: string
  department: string
  dueDate: string
  createdAt: string
  updatedAt: string
  versions?: DeliverableVersion[]
  linkedTaskCount?: number
  linkedIssueCount?: number
}

export interface DeliverableVersion {
  id: string
  deliverableId: string
  versionNumber: string
  fileName: string
  fileUrl: string
  fileSize: number
  fileType: string
  notes?: string
  uploadedAt: string
}

export interface Issue {
  id: string
  title: string
  description: string
  status: IssueStatus
  severity: IssueSeverity
  source: IssueSource
  category: IssueCategory
  reporterId: string
  assigneeId: string
  contactId?: string
  scenarioId?: string
  dueDate?: string
  linkedTaskIds: string[]
  resolution?: string
  createdAt: string
  updatedAt: string
  resolvedAt?: string
}

export interface Meeting {
  id: string
  title: string
  date: string
  time: string
  duration: number
  location: string
  type: MeetingType
  scenarioId?: string
  attendeeIds: string[]
  minutes: string
  fileUrl?: string
  actionItems: MeetingActionItem[]
  createdAt: string
  updatedAt: string
}

export interface MeetingActionItem {
  id: string
  text: string
  assigneeId: string
  taskId?: string
  dueDate?: string
  done: boolean
}

export interface TeamMember {
  id: string
  name: string
  role: string
  group: string
  organization?: '乙方' | '甲方' | '火山引擎'
  department?: string
  contactFor?: string
  email?: string
  phone?: string
  initials: string
  color: string
}

export interface ProjectFile {
  id: string
  name: string
  originalName: string
  path: string
  category: FileCategory
  fileUrl: string
  fileSize: number
  fileType: string
  uploadedAt: string
  uploadedBy: string
  linkedDeliverableIds: string[]
  linkedTaskIds: string[]
  linkedIssueIds: string[]
  linkedMeetingId?: string
  scenarioId?: string
  tags: string[]
  notes?: string
}

export interface Milestone {
  id: string
  code: string
  name: string
  date: string
  status: MilestoneStatus
  description: string
}

export interface ActivityLog {
  id: string
  entityType: 'task' | 'deliverable' | 'issue' | 'meeting' | 'milestone' | 'file'
  entityId: string
  action: 'created' | 'updated' | 'deleted' | 'status_changed' | 'uploaded'
  details?: Record<string, unknown>
  timestamp: string
}

// ===== 聚合统计 =====

export interface DashboardStats {
  tasksInProgress: number
  tasksOverdue: number
  issuesSevere: number
  projectProgress: number
  totalTasks: number
  totalDeliverables: number
  totalIssues: number
  totalFiles: number
  deliverablesByStatus: Record<DeliverableStatus, number>
  tasksByStatus: Record<TaskStatus, number>
  issuesByStatus: Record<IssueStatus, number>
}

export interface PersonAggregation {
  memberId: string
  tasks: Task[]
  deliverables: Deliverable[]
  issues: Issue[]
  scenarios: Scenario[]
  files: ProjectFile[]
}
