'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { Task, Deliverable, Meeting, Issue, TeamMember, Scenario, Milestone, Activity } from './types'
import seedTasks from './data/tasks.json'
import seedDeliverables from './data/deliverables.json'
import seedMeetings from './data/meetings.json'
import seedIssues from './data/issues.json'
import seedTeam from './data/team.json'
import seedScenarios from './data/scenarios.json'
import seedMilestones from './data/milestones.json'

const DATA_VERSION = '3'
const KEYS = {
  tasks: 'gwdz-pm-tasks',
  deliverables: 'gwdz-pm-deliverables',
  meetings: 'gwdz-pm-meetings',
  issues: 'gwdz-pm-issues',
  version: 'gwdz-pm-version',
}

function loadFromStorage<T>(key: string, fallback: T[]): T[] {
  if (typeof window === 'undefined') return fallback
  try {
    const stored = localStorage.getItem(key)
    if (stored) return JSON.parse(stored)
  } catch {}
  return fallback
}

function saveToStorage<T>(key: string, data: T[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {}
}

function genId(prefix: string): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

interface DataContextValue {
  tasks: Task[]
  deliverables: Deliverable[]
  meetings: Meeting[]
  issues: Issue[]
  team: TeamMember[]
  scenarios: Scenario[]
  milestones: Milestone[]

  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void

  addDeliverable: (d: Omit<Deliverable, 'id'>) => void
  updateDeliverable: (id: string, updates: Partial<Deliverable>) => void

  addMeeting: (m: Omit<Meeting, 'id' | 'createdAt'>) => void
  updateMeeting: (id: string, updates: Partial<Meeting>) => void

  addIssue: (issue: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateIssue: (id: string, updates: Partial<Issue>) => void
  deleteIssue: (id: string) => void

  getMember: (id: string) => TeamMember | undefined
  getScenario: (id: string) => Scenario | undefined
  getMyTasks: (userId: string) => Task[]
  getOverdueTasks: () => Task[]
  getTasksByStatus: (status: Task['status']) => Task[]

  activities: Activity[]
  ready: boolean
}

const DataContext = createContext<DataContextValue | null>(null)

export function useData(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}

const TODAY = '2026-05-31'

const staticActivities: Activity[] = [
  { id: 'act1', type: 'task', action: '创建了任务', subject: '催客户交付 S06 首批入库清单', userId: 'm01', timestamp: '2026-05-29T10:00:00' },
  { id: 'act2', type: 'deliverable', action: '更新了蓝图', subject: 'S01 质量分析报告生成 v2', userId: 'm01', timestamp: '2026-05-28T21:44:00' },
  { id: 'act3', type: 'task', action: '开始执行', subject: 'S02 数据工程 — 建 B1+B2 库', userId: 'm06', timestamp: '2026-05-25T09:00:00' },
  { id: 'act4', type: 'milestone', action: '已完成', subject: 'M3 环境部署完成', userId: 'm32', timestamp: '2026-05-25T18:00:00' },
  { id: 'act5', type: 'task', action: '开始执行', subject: 'S04 数据工程 — 建 C 履历库', userId: 'm02', timestamp: '2026-05-29T09:00:00' },
  { id: 'act6', type: 'deliverable', action: '更新了蓝图', subject: '测试一部 S37 v2.2', userId: 'm04', timestamp: '2026-05-28T22:26:00' },
  { id: 'act7', type: 'meeting', action: '创建了会议', subject: '项目周会 W02', userId: 'm01', timestamp: '2026-05-31T08:00:00' },
  { id: 'act8', type: 'task', action: '标记为紧急', subject: '申请插件执行服务器', userId: 'm01', timestamp: '2026-05-31T09:00:00' },
]

export function DataProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [deliverables, setDeliverables] = useState<Deliverable[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [issues, setIssues] = useState<Issue[]>([])

  const team = seedTeam as TeamMember[]
  const scenarios = seedScenarios as Scenario[]
  const milestones = seedMilestones as Milestone[]

  useEffect(() => {
    const storedVersion = localStorage.getItem(KEYS.version)
    if (storedVersion !== DATA_VERSION) {
      localStorage.removeItem(KEYS.tasks)
      localStorage.removeItem(KEYS.deliverables)
      localStorage.removeItem(KEYS.meetings)
      localStorage.removeItem(KEYS.issues)
      localStorage.setItem(KEYS.version, DATA_VERSION)
    }
    setTasks(loadFromStorage<Task>(KEYS.tasks, seedTasks as Task[]))
    setDeliverables(loadFromStorage<Deliverable>(KEYS.deliverables, seedDeliverables as Deliverable[]))
    setMeetings(loadFromStorage<Meeting>(KEYS.meetings, seedMeetings as Meeting[]))
    setIssues(loadFromStorage<Issue>(KEYS.issues, seedIssues as Issue[]))
    setReady(true)
  }, [])

  useEffect(() => { if (ready) saveToStorage(KEYS.tasks, tasks) }, [tasks, ready])
  useEffect(() => { if (ready) saveToStorage(KEYS.deliverables, deliverables) }, [deliverables, ready])
  useEffect(() => { if (ready) saveToStorage(KEYS.meetings, meetings) }, [meetings, ready])
  useEffect(() => { if (ready) saveToStorage(KEYS.issues, issues) }, [issues, ready])

  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = TODAY
    setTasks(prev => [...prev, { ...task, id: genId('t'), createdAt: now, updatedAt: now }])
  }, [])

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates, updatedAt: TODAY } : t))
  }, [])

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
  }, [])

  const addDeliverable = useCallback((d: Omit<Deliverable, 'id'>) => {
    setDeliverables(prev => [...prev, { ...d, id: genId('d') }])
  }, [])

  const updateDeliverable = useCallback((id: string, updates: Partial<Deliverable>) => {
    setDeliverables(prev => prev.map(d => d.id === id ? { ...d, ...updates, updatedAt: TODAY } : d))
  }, [])

  const addMeeting = useCallback((m: Omit<Meeting, 'id' | 'createdAt'>) => {
    setMeetings(prev => [...prev, { ...m, id: genId('mt'), createdAt: TODAY }])
  }, [])

  const updateMeeting = useCallback((id: string, updates: Partial<Meeting>) => {
    setMeetings(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m))
  }, [])

  const addIssue = useCallback((issue: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>) => {
    setIssues(prev => [...prev, { ...issue, id: genId('iss'), createdAt: TODAY, updatedAt: TODAY }])
  }, [])

  const updateIssue = useCallback((id: string, updates: Partial<Issue>) => {
    setIssues(prev => prev.map(i => i.id === id ? { ...i, ...updates, updatedAt: TODAY } : i))
  }, [])

  const deleteIssue = useCallback((id: string) => {
    setIssues(prev => prev.filter(i => i.id !== id))
  }, [])

  const getMember = useCallback((id: string) => team.find(m => m.id === id), [team])
  const getScenario = useCallback((id: string) => scenarios.find(s => s.id === id), [scenarios])
  const getMyTasks = useCallback((userId: string) => tasks.filter(t => t.assigneeId === userId), [tasks])
  const getOverdueTasks = useCallback(() => tasks.filter(t => t.status !== '已完成' && t.dueDate < TODAY), [tasks])
  const getTasksByStatus = useCallback((status: Task['status']) => tasks.filter(t => t.status === status), [tasks])

  return (
    <DataContext.Provider value={{
      tasks, deliverables, meetings, issues,
      team, scenarios, milestones,
      addTask, updateTask, deleteTask,
      addDeliverable, updateDeliverable,
      addMeeting, updateMeeting,
      addIssue, updateIssue, deleteIssue,
      getMember, getScenario, getMyTasks, getOverdueTasks, getTasksByStatus,
      activities: staticActivities,
      ready,
    }}>
      {children}
    </DataContext.Provider>
  )
}
