'use client'

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react'
import type {
  Task, Deliverable, DeliverableVersion, Meeting, Issue,
  TeamMember, ExternalContact, Scenario, Milestone, ActivityLog,
  DashboardStats, PersonAggregation, TaskStatus, DeliverableStatus, IssueStatus,
} from './types'
import { SCENARIOS, EXTERNAL_CONTACTS, generateDeliverables } from './seed-generator'
import seedTasks from './data/tasks.json'
import seedTeam from './data/team.json'
import seedMilestones from './data/milestones.json'
import seedMeetings from './data/meetings.json'
import seedIssues from './data/issues.json'

const DATA_VERSION = '4'
const KEYS = {
  tasks: 'gwdz-v4-tasks',
  deliverables: 'gwdz-v4-deliverables',
  meetings: 'gwdz-v4-meetings',
  issues: 'gwdz-v4-issues',
  activities: 'gwdz-v4-activities',
  versions: 'gwdz-v4-del-versions',
  version: 'gwdz-v4-version',
}

function load<T>(key: string, fallback: T[]): T[] {
  if (typeof window === 'undefined') return fallback
  try {
    const stored = localStorage.getItem(key)
    if (stored) return JSON.parse(stored)
  } catch { /* ignore */ }
  return fallback
}

function save<T>(key: string, data: T[]) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(key, JSON.stringify(data)) } catch { /* ignore */ }
}

let idCounter = 0
function genId(prefix: string): string {
  idCounter++
  return `${prefix}_${idCounter.toString(36)}_${(typeof performance !== 'undefined' ? Math.floor(performance.now()) : 0).toString(36)}`
}

function now(): string {
  return typeof window !== 'undefined'
    ? (() => { const d = new window.Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })()
    : '2026-06-01'
}

// ===== Context Interface =====

interface DataContextValue {
  // 数据
  tasks: Task[]
  deliverables: Deliverable[]
  meetings: Meeting[]
  issues: Issue[]
  team: TeamMember[]
  scenarios: Scenario[]
  milestones: Milestone[]
  externalContacts: ExternalContact[]
  activities: ActivityLog[]
  deliverableVersions: DeliverableVersion[]

  // Task CRUD
  addTask: (t: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateTask: (id: string, u: Partial<Task>) => void
  deleteTask: (id: string) => void

  // Deliverable CRUD
  addDeliverable: (d: Omit<Deliverable, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateDeliverable: (id: string, u: Partial<Deliverable>) => void
  deleteDeliverable: (id: string) => void
  addDeliverableVersion: (v: Omit<DeliverableVersion, 'id' | 'uploadedAt'>) => void

  // Meeting CRUD
  addMeeting: (m: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateMeeting: (id: string, u: Partial<Meeting>) => void
  deleteMeeting: (id: string) => void

  // Issue CRUD
  addIssue: (i: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateIssue: (id: string, u: Partial<Issue>) => void
  deleteIssue: (id: string) => void

  // 查询
  getMember: (id: string) => TeamMember | undefined
  getScenario: (id: string) => Scenario | undefined
  getExtContact: (id: string) => ExternalContact | undefined
  getTasksByScenario: (scenarioId: string) => Task[]
  getIssuesByScenario: (scenarioId: string) => Issue[]
  getDeliverablesByScenario: (scenarioId: string) => Deliverable[]
  getDeliverablesByCategory: () => Record<string, Deliverable[]>
  getOverdueTasks: () => Task[]
  getPersonAggregation: (memberId: string) => PersonAggregation

  // Dashboard
  getDashboardStats: () => DashboardStats
  today: string

  ready: boolean
}

const DataContext = createContext<DataContextValue | null>(null)

export function useData(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}

// ===== Provider =====

export function DataProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [deliverables, setDeliverables] = useState<Deliverable[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [deliverableVersions, setDeliverableVersions] = useState<DeliverableVersion[]>([])

  const team = useMemo(() => seedTeam as TeamMember[], [])
  const scenarios = useMemo(() => SCENARIOS, [])
  const milestones = useMemo(() => seedMilestones as Milestone[], [])
  const externalContacts = useMemo(() => EXTERNAL_CONTACTS, [])
  const todayStr = useMemo(() => now(), [])

  // 初始化
  useEffect(() => {
    const storedVer = localStorage.getItem(KEYS.version)
    if (storedVer !== DATA_VERSION) {
      Object.values(KEYS).forEach(k => localStorage.removeItem(k))
      localStorage.setItem(KEYS.version, DATA_VERSION)
    }
    // 增强种子任务：添加 category 字段
    const rawTasks = seedTasks as Record<string, unknown>[]
    const enhancedTasks: Task[] = rawTasks.map(t => ({
      id: t.id as string,
      title: t.title as string,
      description: (t.description as string) || '',
      status: t.status as Task['status'],
      priority: t.priority as Task['priority'],
      category: (t.scenarioId ? 'scenario' : 'project') as Task['category'],
      assigneeId: t.assigneeId as string,
      scenarioId: t.scenarioId as string | undefined,
      dueDate: t.dueDate as string,
      tags: (t.tags as string[]) || [],
      createdAt: t.createdAt as string,
      updatedAt: t.updatedAt as string,
    }))
    // 增强种子 issues：添加 category + linkedTaskIds
    const rawIssues = seedIssues as Record<string, unknown>[]
    const enhancedIssues: Issue[] = rawIssues.map(i => ({
      id: i.id as string,
      title: i.title as string,
      description: (i.description as string) || '',
      status: i.status as Issue['status'],
      severity: i.severity as Issue['severity'],
      source: i.source as Issue['source'],
      category: (i.scenarioId ? 'scenario' : 'project') as Issue['category'],
      reporterId: i.reporterId as string,
      assigneeId: i.assigneeId as string,
      scenarioId: i.scenarioId as string | undefined,
      dueDate: i.dueDate as string | undefined,
      linkedTaskIds: i.linkedTaskId ? [i.linkedTaskId as string] : (i.linkedTaskIds as string[] || []),
      resolution: i.resolution as string | undefined,
      createdAt: i.createdAt as string,
      updatedAt: i.updatedAt as string,
      resolvedAt: i.resolvedAt as string | undefined,
    }))
    setTasks(load<Task>(KEYS.tasks, enhancedTasks))
    setDeliverables(load<Deliverable>(KEYS.deliverables, generateDeliverables()))
    setMeetings(load<Meeting>(KEYS.meetings, seedMeetings as unknown as Meeting[]))
    setIssues(load<Issue>(KEYS.issues, enhancedIssues))
    setActivities(load<ActivityLog>(KEYS.activities, []))
    setDeliverableVersions(load<DeliverableVersion>(KEYS.versions, []))
    setReady(true)
  }, [])

  // 持久化
  useEffect(() => { if (ready) save(KEYS.tasks, tasks) }, [tasks, ready])
  useEffect(() => { if (ready) save(KEYS.deliverables, deliverables) }, [deliverables, ready])
  useEffect(() => { if (ready) save(KEYS.meetings, meetings) }, [meetings, ready])
  useEffect(() => { if (ready) save(KEYS.issues, issues) }, [issues, ready])
  useEffect(() => { if (ready) save(KEYS.activities, activities) }, [activities, ready])
  useEffect(() => { if (ready) save(KEYS.versions, deliverableVersions) }, [deliverableVersions, ready])

  // 日志记录
  const logActivity = useCallback((entityType: ActivityLog['entityType'], entityId: string, action: ActivityLog['action'], details?: Record<string, unknown>) => {
    setActivities(prev => [{
      id: genId('log'),
      entityType,
      entityId,
      action,
      details,
      timestamp: typeof window !== 'undefined' ? new window.Date().toISOString() : '',
    }, ...prev].slice(0, 200)) // 保留最近 200 条
  }, [])

  // ===== Task CRUD =====
  const addTask = useCallback((t: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = genId('t')
    const n = now()
    setTasks(prev => [...prev, { ...t, id, createdAt: n, updatedAt: n }])
    logActivity('task', id, 'created', { title: t.title })
    return id
  }, [logActivity])

  const updateTask = useCallback((id: string, u: Partial<Task>) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t
      const details: Record<string, unknown> = {}
      if (u.status && u.status !== t.status) details.statusChange = { from: t.status, to: u.status }
      logActivity('task', id, u.status !== t.status ? 'status_changed' : 'updated', details)
      return { ...t, ...u, updatedAt: now() }
    }))
  }, [logActivity])

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    logActivity('task', id, 'deleted')
  }, [logActivity])

  // ===== Deliverable CRUD =====
  const addDeliverable = useCallback((d: Omit<Deliverable, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = genId('d')
    const n = now()
    setDeliverables(prev => [...prev, { ...d, id, createdAt: n, updatedAt: n }])
    logActivity('deliverable', id, 'created', { name: d.name })
    return id
  }, [logActivity])

  const updateDeliverable = useCallback((id: string, u: Partial<Deliverable>) => {
    setDeliverables(prev => prev.map(d => {
      if (d.id !== id) return d
      if (u.status && u.status !== d.status) {
        logActivity('deliverable', id, 'status_changed', { from: d.status, to: u.status })
      } else {
        logActivity('deliverable', id, 'updated')
      }
      return { ...d, ...u, updatedAt: now() }
    }))
  }, [logActivity])

  const deleteDeliverable = useCallback((id: string) => {
    setDeliverables(prev => prev.filter(d => d.id !== id))
    logActivity('deliverable', id, 'deleted')
  }, [logActivity])

  const addDeliverableVersion = useCallback((v: Omit<DeliverableVersion, 'id' | 'uploadedAt'>) => {
    const id = genId('dv')
    setDeliverableVersions(prev => [...prev, { ...v, id, uploadedAt: now() }])
    // 同步更新交付物的当前版本号
    setDeliverables(prev => prev.map(d =>
      d.id === v.deliverableId ? { ...d, currentVersion: v.versionNumber, updatedAt: now() } : d
    ))
    logActivity('deliverable', v.deliverableId, 'updated', { newVersion: v.versionNumber })
  }, [logActivity])

  // ===== Meeting CRUD =====
  const addMeeting = useCallback((m: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = genId('mt')
    const n = now()
    setMeetings(prev => [...prev, { ...m, id, createdAt: n, updatedAt: n }])
    logActivity('meeting', id, 'created', { title: m.title })
    return id
  }, [logActivity])

  const updateMeeting = useCallback((id: string, u: Partial<Meeting>) => {
    setMeetings(prev => prev.map(m => m.id === id ? { ...m, ...u, updatedAt: now() } : m))
    logActivity('meeting', id, 'updated')
  }, [logActivity])

  const deleteMeeting = useCallback((id: string) => {
    setMeetings(prev => prev.filter(m => m.id !== id))
    logActivity('meeting', id, 'deleted')
  }, [logActivity])

  // ===== Issue CRUD =====
  const addIssue = useCallback((i: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = genId('iss')
    const n = now()
    setIssues(prev => [...prev, { ...i, id, createdAt: n, updatedAt: n }])
    logActivity('issue', id, 'created', { title: i.title, severity: i.severity })
    return id
  }, [logActivity])

  const updateIssue = useCallback((id: string, u: Partial<Issue>) => {
    setIssues(prev => prev.map(i => {
      if (i.id !== id) return i
      if (u.status && u.status !== i.status) {
        logActivity('issue', id, 'status_changed', { from: i.status, to: u.status })
      }
      return { ...i, ...u, updatedAt: now(), resolvedAt: u.status === '已解决' ? now() : i.resolvedAt }
    }))
  }, [logActivity])

  const deleteIssue = useCallback((id: string) => {
    setIssues(prev => prev.filter(i => i.id !== id))
    logActivity('issue', id, 'deleted')
  }, [logActivity])

  // ===== 查询 =====
  const getMember = useCallback((id: string) => team.find(m => m.id === id), [team])
  const getScenario = useCallback((id: string) => scenarios.find(s => s.id === id), [scenarios])
  const getExtContact = useCallback((id: string) => externalContacts.find(c => c.id === id), [externalContacts])

  const getTasksByScenario = useCallback((sid: string) => tasks.filter(t => t.scenarioId === sid), [tasks])
  const getIssuesByScenario = useCallback((sid: string) => issues.filter(i => i.scenarioId === sid), [issues])
  const getDeliverablesByScenario = useCallback((sid: string) => deliverables.filter(d => d.scenarioId === sid), [deliverables])

  const getDeliverablesByCategory = useCallback(() => {
    const cats: Record<string, Deliverable[]> = {}
    for (const d of deliverables) {
      if (!cats[d.category]) cats[d.category] = []
      cats[d.category].push(d)
    }
    return cats
  }, [deliverables])

  const getOverdueTasks = useCallback(() => {
    const t = todayStr
    return tasks.filter(tk => tk.status !== '已完成' && tk.dueDate < t)
  }, [tasks, todayStr])

  const getPersonAggregation = useCallback((memberId: string): PersonAggregation => {
    return {
      memberId,
      tasks: tasks.filter(t => t.assigneeId === memberId),
      deliverables: deliverables.filter(d => d.ownerId === memberId),
      issues: issues.filter(i => i.assigneeId === memberId || i.reporterId === memberId),
      scenarios: scenarios.filter(s => s.ownerId === memberId),
    }
  }, [tasks, deliverables, issues, scenarios])

  // ===== Dashboard Stats =====
  const getDashboardStats = useCallback((): DashboardStats => {
    const t = todayStr
    const tasksOverdue = tasks.filter(tk => tk.status !== '已完成' && tk.dueDate < t).length
    const tasksInProgress = tasks.filter(tk => tk.status === '进行中').length
    const issuesSevere = issues.filter(i => i.severity === '严重' && i.status !== '已解决' && i.status !== '已关闭').length

    // 项目进度 = 交付物加权完成率
    const statusWeights: Record<string, number> = { '待编制': 0, '编制中': 0.25, '待审核': 0.5, '待签字': 0.75, '已归档': 1 }
    const totalWeight = deliverables.reduce((sum, d) => sum + (statusWeights[d.status] ?? 0), 0)
    const projectProgress = deliverables.length > 0 ? Math.round((totalWeight / deliverables.length) * 100) : 0

    const tasksByStatus: Record<TaskStatus, number> = { '待办': 0, '进行中': 0, '审核中': 0, '已完成': 0 }
    tasks.forEach(tk => { tasksByStatus[tk.status] = (tasksByStatus[tk.status] || 0) + 1 })

    const deliverablesByStatus: Record<DeliverableStatus, number> = { '待编制': 0, '编制中': 0, '待审核': 0, '待签字': 0, '已归档': 0 }
    deliverables.forEach(d => { deliverablesByStatus[d.status] = (deliverablesByStatus[d.status] || 0) + 1 })

    const issuesByStatus: Record<IssueStatus, number> = { '待处理': 0, '处理中': 0, '已解决': 0, '已关闭': 0, '已驳回': 0 }
    issues.forEach(i => { issuesByStatus[i.status] = (issuesByStatus[i.status] || 0) + 1 })

    return {
      tasksInProgress, tasksOverdue, issuesSevere, projectProgress,
      totalTasks: tasks.length, totalDeliverables: deliverables.length, totalIssues: issues.length,
      tasksByStatus, deliverablesByStatus, issuesByStatus,
    }
  }, [tasks, deliverables, issues, todayStr])

  return (
    <DataContext.Provider value={{
      tasks, deliverables, meetings, issues, team, scenarios, milestones,
      externalContacts, activities, deliverableVersions,
      addTask, updateTask, deleteTask,
      addDeliverable, updateDeliverable, deleteDeliverable, addDeliverableVersion,
      addMeeting, updateMeeting, deleteMeeting,
      addIssue, updateIssue, deleteIssue,
      getMember, getScenario, getExtContact,
      getTasksByScenario, getIssuesByScenario, getDeliverablesByScenario,
      getDeliverablesByCategory, getOverdueTasks, getPersonAggregation,
      getDashboardStats,
      today: todayStr,
      ready,
    }}>
      {children}
    </DataContext.Provider>
  )
}
