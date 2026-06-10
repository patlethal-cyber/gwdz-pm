'use client'

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode, type SetStateAction } from 'react'
import type {
  Task, Deliverable, DeliverableVersion, Meeting, Issue,
  TeamMember, Scenario, Milestone, ActivityLog, ProjectFile,
  DashboardStats, PersonAggregation, TaskStatus, DeliverableStatus, IssueStatus,
} from './types'
import { SCENARIOS, generateDeliverables } from './seed-generator'
import { generateFileMetadata } from './data/files-seed'
import { generateVersions } from './data/versions-seed'
import seedTasks from './data/tasks.json'
import seedTeam from './data/team.json'
import seedMilestones from './data/milestones.json'
import seedMeetings from './data/meetings.json'
import seedIssues from './data/issues.json'

// ===== Server-side persistence via Vercel Blob =====
// Primary: /api/data/[collection] — shared across all users

const COLLECTIONS = ['tasks', 'deliverables', 'meetings', 'issues', 'activities', 'versions', 'files'] as const
type CollectionName = typeof COLLECTIONS[number]

async function serverLoad<T>(collection: CollectionName): Promise<{ data: T[] | null; version: string }> {
  try {
    const res = await fetch(`/api/data/${collection}`, { cache: 'no-store' })
    if (res.ok) {
      const version = res.headers.get('x-data-version') ?? ''
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) return { data: data as T[], version }
      return { data: null, version }
    }
  } catch { /* server unreachable */ }
  return { data: null, version: '' }
}

type SaveStatus = 'idle' | 'saving' | 'error' | 'conflict'

async function serverSave<T>(
  collection: CollectionName,
  data: T[],
  expectedVersion: string,
  setSaveStatus: (s: SaveStatus) => void,
): Promise<{ ok: boolean; version?: string; conflict?: boolean }> {
  setSaveStatus('saving')
  try {
    const res = await fetch(`/api/data/${collection}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Expected-Version': expectedVersion },
      body: JSON.stringify(data),
    })
    if (res.status === 409) {
      console.warn(`[serverSave] ${collection} 冲突 — 数据已被他人更新`)
      setSaveStatus('conflict')
      return { ok: false, conflict: true }
    }
    if (!res.ok) {
      console.error(`[serverSave] ${collection} failed: HTTP ${res.status}`)
      setSaveStatus('error')
      return { ok: false }
    }
    const body = await res.json().catch(() => ({} as { version?: string }))
    setSaveStatus('idle')
    return { ok: true, version: body.version }
  } catch (err) {
    console.error(`[serverSave] ${collection} network error:`, err)
    setSaveStatus('error')
    return { ok: false }
  }
}

// ===== usePersistedCollection (A3) =====
// 收敛单个集合的：state + 版本号(X-Data-Version 乐观并发) + dirty + debounced 持久化。
// 7 个集合各调一次，共享同一个全局 setSaveStatus（Header 指示器依赖单一 saveStatus）。
// 返回的 setItems/load/forceSave 均为稳定引用（useCallback），可安全放进其他 hook 的 deps。
function usePersistedCollection<T>(
  name: CollectionName,
  ready: boolean,
  setSaveStatus: (s: SaveStatus) => void,
) {
  const [items, setItemsRaw] = useState<T[]>([])
  const dirtyRef = useRef(false)             // 仅 CRUD/导入会置脏 → 仅这些触发保存
  const versionRef = useRef('')              // 服务器持有的版本号
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 初始化加载：set + 捕获版本号，不置脏（init 调用，不触发保存）
  const load = useCallback(async () => {
    const { data, version } = await serverLoad<T>(name)
    versionRef.current = version
    setItemsRaw(data || [])
  }, [name])

  // CRUD/导入用：置脏 + setState（→ 触发下方 debounced 保存）
  const setItems = useCallback((updater: SetStateAction<T[]>) => {
    dirtyRef.current = true
    setItemsRaw(updater)
  }, [])

  // 种子初始化：强制覆写（'*' 跳过版本比对），不走 dirty/debounce，避免二次写
  const forceSave = useCallback(async (data: T[]) => {
    setItemsRaw(data)
    dirtyRef.current = false
    const result = await serverSave(name, data, '*', setSaveStatus)
    if (result.ok && result.version) versionRef.current = result.version
  }, [name, setSaveStatus])

  // debounced 持久化（500ms）：仅 ready 且 dirty 时
  useEffect(() => {
    if (!ready || !dirtyRef.current) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      dirtyRef.current = false
      const result = await serverSave(name, items, versionRef.current ?? '', setSaveStatus)
      if (result.ok && result.version) versionRef.current = result.version
    }, 500)
  }, [items, ready, name, setSaveStatus])

  return { items, setItems, load, forceSave }
}

function genId(prefix: string): string {
  const rand = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().slice(0, 8)
    : Math.floor((performance.now() * 1e6 + Math.random() * 1e9) >>> 0).toString(36).padStart(8, '0').slice(0, 8)
  return `${prefix}_${rand}`
}

function now(): string {
  if (typeof window === 'undefined') return '2026-06-01'
  const d = new window.Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function nowISO(): string {
  return typeof window !== 'undefined' ? new window.Date().toISOString() : ''
}

// ===== Seed defaults (only for first-time initialization) =====

function buildDefaultTasks(): Task[] {
  return (seedTasks as Record<string, unknown>[]).map(t => ({
    id: t.id as string, title: t.title as string, description: (t.description as string) || '',
    status: t.status as Task['status'], priority: t.priority as Task['priority'],
    category: (t.scenarioId ? 'scenario' : 'project') as Task['category'],
    assigneeId: t.assigneeId as string, contactId: t.contactId as string | undefined,
    scenarioId: t.scenarioId as string | undefined, dueDate: t.dueDate as string,
    tags: (t.tags as string[]) || [], createdAt: t.createdAt as string, updatedAt: t.updatedAt as string,
  }))
}

function buildDefaultIssues(): Issue[] {
  return (seedIssues as Record<string, unknown>[]).map(i => ({
    id: i.id as string, title: i.title as string, description: (i.description as string) || '',
    status: i.status as Issue['status'], severity: i.severity as Issue['severity'],
    source: i.source as Issue['source'],
    category: (i.scenarioId ? 'scenario' : 'project') as Issue['category'],
    reporterId: i.reporterId as string, assigneeId: i.assigneeId as string,
    contactId: i.contactId as string | undefined, scenarioId: i.scenarioId as string | undefined,
    dueDate: i.dueDate as string | undefined,
    linkedTaskIds: i.linkedTaskIds ? (i.linkedTaskIds as string[]) : i.linkedTaskId ? [i.linkedTaskId as string] : [],
    resolution: i.resolution as string | undefined,
    createdAt: i.createdAt as string, updatedAt: i.updatedAt as string,
    resolvedAt: i.resolvedAt as string | undefined,
  }))
}

// ===== Context Interface =====

interface DataContextValue {
  tasks: Task[]
  deliverables: Deliverable[]
  meetings: Meeting[]
  issues: Issue[]
  team: TeamMember[]
  scenarios: Scenario[]
  milestones: Milestone[]
  activities: ActivityLog[]
  deliverableVersions: DeliverableVersion[]
  files: ProjectFile[]

  addTask: (t: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateTask: (id: string, u: Partial<Task>) => void
  deleteTask: (id: string) => void
  bulkUpdateTasks: (ids: string[], patch: Partial<Task>) => void

  addDeliverable: (d: Omit<Deliverable, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateDeliverable: (id: string, u: Partial<Deliverable>) => void
  deleteDeliverable: (id: string) => void
  addDeliverableVersion: (v: Omit<DeliverableVersion, 'id' | 'uploadedAt'>) => void

  addMeeting: (m: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateMeeting: (id: string, u: Partial<Meeting>) => void
  deleteMeeting: (id: string) => void

  addIssue: (i: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateIssue: (id: string, u: Partial<Issue>) => void
  deleteIssue: (id: string) => void

  addFile: (f: Omit<ProjectFile, 'id' | 'uploadedAt'>) => string
  updateFile: (id: string, u: Partial<ProjectFile>) => void
  deleteFile: (id: string) => void

  getMember: (id: string) => TeamMember | undefined
  getScenario: (id: string) => Scenario | undefined
  getExternalMembers: () => TeamMember[]
  getTasksByScenario: (scenarioId: string) => Task[]
  getIssuesByScenario: (scenarioId: string) => Issue[]
  getDeliverablesByScenario: (scenarioId: string) => Deliverable[]
  getTasksByDeliverable: (deliverableId: string) => Task[]
  getDeliverablesByCategory: () => Record<string, Deliverable[]>
  getOverdueTasks: () => Task[]
  getPersonAggregation: (memberId: string) => PersonAggregation
  getFilesByEntity: (entityType: 'deliverable' | 'task' | 'issue' | 'meeting', entityId: string) => ProjectFile[]
  getFilesByCategory: () => Record<string, ProjectFile[]>

  getDashboardStats: () => DashboardStats
  importData: (json: string) => boolean
  initializeSeedData: () => Promise<void>
  saveStatus: SaveStatus
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
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  // 7 个集合各自持久化（共享单一 saveStatus）。items 用于读，set/load/forceSave 稳定。
  const { items: tasks, setItems: setTasks, load: loadTasks, forceSave: forceSaveTasks } =
    usePersistedCollection<Task>('tasks', ready, setSaveStatus)
  const { items: deliverables, setItems: setDeliverables, load: loadDeliverables, forceSave: forceSaveDeliverables } =
    usePersistedCollection<Deliverable>('deliverables', ready, setSaveStatus)
  const { items: meetings, setItems: setMeetings, load: loadMeetings, forceSave: forceSaveMeetings } =
    usePersistedCollection<Meeting>('meetings', ready, setSaveStatus)
  const { items: issues, setItems: setIssues, load: loadIssues, forceSave: forceSaveIssues } =
    usePersistedCollection<Issue>('issues', ready, setSaveStatus)
  const { items: activities, setItems: setActivities, load: loadActivities, forceSave: forceSaveActivities } =
    usePersistedCollection<ActivityLog>('activities', ready, setSaveStatus)
  const { items: deliverableVersions, setItems: setDeliverableVersions, load: loadVersions, forceSave: forceSaveVersions } =
    usePersistedCollection<DeliverableVersion>('versions', ready, setSaveStatus)
  const { items: files, setItems: setFiles, load: loadFiles, forceSave: forceSaveFiles } =
    usePersistedCollection<ProjectFile>('files', ready, setSaveStatus)

  const team = useMemo(() => seedTeam as TeamMember[], [])
  const scenarios = useMemo(() => SCENARIOS, [])
  const milestones = useMemo(() => seedMilestones as Milestone[], [])
  const todayStr = useMemo(() => now(), [])

  // Warn user about unsaved changes on tab close
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      // error = 上次保存失败、改动仍滞留在内存里，关页同样会丢
      if (saveStatus === 'saving' || saveStatus === 'error') {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [saveStatus])

  // ===== Initialization: 服务器加载全部集合，加载完置 ready =====
  // 绝不自动推送种子数据 — 种子初始化通过设置页面手动触发
  useEffect(() => {
    async function init() {
      await Promise.all([
        loadTasks(), loadDeliverables(), loadMeetings(), loadIssues(),
        loadActivities(), loadVersions(), loadFiles(),
      ])
      setReady(true)
    }
    init()
  }, [loadTasks, loadDeliverables, loadMeetings, loadIssues, loadActivities, loadVersions, loadFiles])

  const logActivity = useCallback((entityType: ActivityLog['entityType'], entityId: string, action: ActivityLog['action'], details?: Record<string, unknown>) => {
    setActivities(prev => [{
      id: genId('log'),
      entityType,
      entityId,
      action,
      details,
      timestamp: nowISO(),
    }, ...prev].slice(0, 200))
  }, [setActivities])

  // ===== Task CRUD =====
  const addTask = useCallback((t: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = genId('t')
    const n = now()
    setTasks(prev => [...prev, { ...t, id, createdAt: n, updatedAt: n }])
    logActivity('task', id, 'created', { title: t.title })
    return id
  }, [setTasks, logActivity])

  const updateTask = useCallback((id: string, u: Partial<Task>) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t
      const details: Record<string, unknown> = {}
      if (u.status && u.status !== t.status) details.statusChange = { from: t.status, to: u.status }
      logActivity('task', id, u.status !== t.status ? 'status_changed' : 'updated', details)
      return { ...t, ...u, updatedAt: now() }
    }))
  }, [setTasks, logActivity])

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    logActivity('task', id, 'deleted')
  }, [setTasks, logActivity])

  // F3: 批量更新任务（多选 → 批量改状态/重分配）。一次 setState + 一条聚合日志
  const bulkUpdateTasks = useCallback((ids: string[], patch: Partial<Task>) => {
    if (ids.length === 0) return
    const idSet = new Set(ids)
    setTasks(prev => prev.map(t => idSet.has(t.id) ? { ...t, ...patch, updatedAt: now() } : t))
    logActivity('task', ids[0], 'updated', { bulk: ids.length, ...patch })
  }, [setTasks, logActivity])

  // ===== Deliverable CRUD =====
  const addDeliverable = useCallback((d: Omit<Deliverable, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = genId('d')
    const n = now()
    setDeliverables(prev => [...prev, { ...d, id, createdAt: n, updatedAt: n }])
    logActivity('deliverable', id, 'created', { name: d.name })
    return id
  }, [setDeliverables, logActivity])

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
  }, [setDeliverables, logActivity])

  const deleteDeliverable = useCallback((id: string) => {
    setDeliverables(prev => prev.filter(d => d.id !== id))
    logActivity('deliverable', id, 'deleted')
  }, [setDeliverables, logActivity])

  const addDeliverableVersion = useCallback((v: Omit<DeliverableVersion, 'id' | 'uploadedAt'>) => {
    const id = genId('dv')
    setDeliverableVersions(prev => [...prev, { ...v, id, uploadedAt: now() }])
    setDeliverables(prev => prev.map(d =>
      d.id === v.deliverableId ? { ...d, currentVersion: v.versionNumber, updatedAt: now() } : d
    ))
    logActivity('deliverable', v.deliverableId, 'updated', { newVersion: v.versionNumber })
  }, [setDeliverableVersions, setDeliverables, logActivity])

  // ===== Meeting CRUD =====
  const addMeeting = useCallback((m: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = genId('mt')
    const n = now()
    setMeetings(prev => [...prev, { ...m, id, createdAt: n, updatedAt: n }])
    logActivity('meeting', id, 'created', { title: m.title })
    return id
  }, [setMeetings, logActivity])

  const updateMeeting = useCallback((id: string, u: Partial<Meeting>) => {
    setMeetings(prev => prev.map(m => m.id === id ? { ...m, ...u, updatedAt: now() } : m))
    logActivity('meeting', id, 'updated')
  }, [setMeetings, logActivity])

  const deleteMeeting = useCallback((id: string) => {
    setMeetings(prev => prev.filter(m => m.id !== id))
    logActivity('meeting', id, 'deleted')
  }, [setMeetings, logActivity])

  // ===== Issue CRUD =====
  const addIssue = useCallback((i: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = genId('iss')
    const n = now()
    setIssues(prev => [...prev, { ...i, id, createdAt: n, updatedAt: n }])
    logActivity('issue', id, 'created', { title: i.title, severity: i.severity })
    return id
  }, [setIssues, logActivity])

  const updateIssue = useCallback((id: string, u: Partial<Issue>) => {
    setIssues(prev => prev.map(i => {
      if (i.id !== id) return i
      if (u.status && u.status !== i.status) {
        logActivity('issue', id, 'status_changed', { from: i.status, to: u.status })
      }
      return { ...i, ...u, updatedAt: now(), resolvedAt: u.status === '已解决' ? now() : i.resolvedAt }
    }))
  }, [setIssues, logActivity])

  const deleteIssue = useCallback((id: string) => {
    setIssues(prev => prev.filter(i => i.id !== id))
    logActivity('issue', id, 'deleted')
  }, [setIssues, logActivity])

  // ===== File CRUD =====
  const addFile = useCallback((f: Omit<ProjectFile, 'id' | 'uploadedAt'>) => {
    const id = genId('f')
    setFiles(prev => [...prev, { ...f, id, uploadedAt: now() }])
    logActivity('file', id, 'uploaded', { name: f.name })
    return id
  }, [setFiles, logActivity])

  const updateFile = useCallback((id: string, u: Partial<ProjectFile>) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...u } : f))
    logActivity('file', id, 'updated')
  }, [setFiles, logActivity])

  const deleteFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
    logActivity('file', id, 'deleted')
  }, [setFiles, logActivity])

  // ===== 查询 =====
  const getMember = useCallback((id: string) => team.find(m => m.id === id), [team])
  const getScenario = useCallback((id: string) => scenarios.find(s => s.id === id), [scenarios])
  const getExternalMembers = useCallback(() => team.filter(m => (m as TeamMember).organization !== '乙方' && (m as TeamMember).organization), [team])

  const getTasksByScenario = useCallback((sid: string) => tasks.filter(t => t.scenarioId === sid), [tasks])
  const getIssuesByScenario = useCallback((sid: string) => issues.filter(i => i.scenarioId === sid), [issues])
  const getDeliverablesByScenario = useCallback((sid: string) => deliverables.filter(d => d.scenarioId === sid), [deliverables])
  const getTasksByDeliverable = useCallback((did: string) => tasks.filter(t => t.deliverableId === did), [tasks])

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
      tasks: tasks.filter(t => t.assigneeId === memberId || t.contactId === memberId),
      deliverables: deliverables.filter(d => d.ownerId === memberId),
      issues: issues.filter(i => i.assigneeId === memberId || i.reporterId === memberId || i.contactId === memberId),
      scenarios: scenarios.filter(s => s.ownerId === memberId),
      files: files.filter(f => f.uploadedBy === memberId),
    }
  }, [tasks, deliverables, issues, scenarios, files])

  const getFilesByEntity = useCallback((entityType: 'deliverable' | 'task' | 'issue' | 'meeting', entityId: string): ProjectFile[] => {
    return files.filter(f => {
      switch (entityType) {
        case 'deliverable': return f.linkedDeliverableIds.includes(entityId)
        case 'task': return f.linkedTaskIds.includes(entityId)
        case 'issue': return f.linkedIssueIds.includes(entityId)
        case 'meeting': return f.linkedMeetingId === entityId
      }
    })
  }, [files])

  const getFilesByCategory = useCallback(() => {
    const cats: Record<string, ProjectFile[]> = {}
    for (const f of files) {
      if (!cats[f.category]) cats[f.category] = []
      cats[f.category].push(f)
    }
    return cats
  }, [files])

  // ===== Dashboard Stats =====
  const getDashboardStats = useCallback((): DashboardStats => {
    const t = todayStr
    const tasksOverdue = tasks.filter(tk => tk.status !== '已完成' && tk.dueDate < t).length
    const tasksInProgress = tasks.filter(tk => tk.status === '进行中').length
    const issuesSevere = issues.filter(i => i.severity === '严重' && i.status !== '已解决' && i.status !== '已关闭').length

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
      totalTasks: tasks.length, totalDeliverables: deliverables.length,
      totalIssues: issues.length, totalFiles: files.length,
      tasksByStatus, deliverablesByStatus, issuesByStatus,
    }
  }, [tasks, deliverables, issues, files, todayStr])

  // ===== Initialize seed data (manual admin action only) =====
  // 各集合 forceSave('*' 强制覆写)：set state + 显式写一次，不走 dirty/debounce
  const initializeSeedData = useCallback(async () => {
    await Promise.all([
      forceSaveTasks(buildDefaultTasks()),
      forceSaveDeliverables(generateDeliverables() as Deliverable[]),
      forceSaveMeetings(seedMeetings as unknown as Meeting[]),
      forceSaveIssues(buildDefaultIssues()),
      forceSaveActivities([]),
      forceSaveVersions(generateVersions() as DeliverableVersion[]),
      forceSaveFiles(generateFileMetadata() as ProjectFile[]),
    ])
  }, [forceSaveTasks, forceSaveDeliverables, forceSaveMeetings, forceSaveIssues, forceSaveActivities, forceSaveVersions, forceSaveFiles])

  // ===== Data Import =====
  // setItems 内部置脏 → 经 debounced 保存持久化（行为同原 dirty.add + setState）
  const importData = useCallback((json: string): boolean => {
    try {
      const data = JSON.parse(json)
      if (data.tasks) setTasks(data.tasks)
      if (data.deliverables) setDeliverables(data.deliverables)
      if (data.meetings) setMeetings(data.meetings)
      if (data.issues) setIssues(data.issues)
      if (data.activities) setActivities(data.activities)
      if (data.deliverableVersions) setDeliverableVersions(data.deliverableVersions)
      if (data.files) setFiles(data.files)
      return true
    } catch {
      return false
    }
  }, [setTasks, setDeliverables, setMeetings, setIssues, setActivities, setDeliverableVersions, setFiles])

  return (
    <DataContext.Provider value={{
      tasks, deliverables, meetings, issues, team, scenarios, milestones,
      activities, deliverableVersions, files,
      addTask, updateTask, deleteTask, bulkUpdateTasks,
      addDeliverable, updateDeliverable, deleteDeliverable, addDeliverableVersion,
      addMeeting, updateMeeting, deleteMeeting,
      addIssue, updateIssue, deleteIssue,
      addFile, updateFile, deleteFile,
      getMember, getScenario, getExternalMembers,
      getTasksByScenario, getIssuesByScenario, getDeliverablesByScenario, getTasksByDeliverable,
      getDeliverablesByCategory, getOverdueTasks, getPersonAggregation,
      getFilesByEntity, getFilesByCategory,
      getDashboardStats, importData, initializeSeedData,
      saveStatus,
      today: todayStr,
      ready,
    }}>
      {children}
    </DataContext.Provider>
  )
}
