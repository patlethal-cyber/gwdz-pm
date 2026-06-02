'use client'

import { useState, useMemo, useEffect } from 'react'
import { Plus, LayoutGrid, List, Filter } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import KanbanBoard from '@/components/tasks/KanbanBoard'
import TaskList from '@/components/tasks/TaskList'
import TaskModal from '@/components/tasks/TaskModal'
import { useData } from '@/lib/data-context'
import type { Task, TaskStatus, TaskPriority } from '@/lib/types'

type ViewMode = 'kanban' | 'list'

const priorityOptions: TaskPriority[] = ['紧急', '高', '中', '低']
const statusOptions: TaskStatus[] = ['待办', '进行中', '审核中', '已完成']
const departmentOptions = ['客户质量部', '测试一部', '测试二部']

function getWeekEnd(dateStr: string): string {
  const d = new Date(dateStr)
  const day = d.getDay()
  const diff = 7 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

export default function TasksPage() {
  const { tasks, issues, team, scenarios, updateTask, addTask, deleteTask, bulkUpdateTasks, getMember, getScenario, today, ready } = useData()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [view, setView] = useState<ViewMode>('kanban')
  const [modalOpen, setModalOpen] = useState(false)
  const [editTask, setEditTask] = useState<Task | undefined>(undefined)
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('待办')

  // Filter state
  const [filterAssignee, setFilterAssignee] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterDept, setFilterDept] = useState('')

  // Summary pill filter (status or "dueThisWeek")
  const [summaryFilter, setSummaryFilter] = useState<string>('')

  // Read URL params for dashboard drill-down
  useEffect(() => {
    const urlStatus = searchParams.get('status')
    const urlSeverity = searchParams.get('severity')
    if (urlStatus === 'overdue') {
      setSummaryFilter('overdue')
    } else if (urlStatus && statusOptions.includes(urlStatus as TaskStatus)) {
      setSummaryFilter(urlStatus)
    }
    if (urlSeverity && priorityOptions.includes(urlSeverity as TaskPriority)) {
      setFilterPriority(urlSeverity)
    }
  }, [searchParams])

  // Handle ?open=taskId from global search
  useEffect(() => {
    if (!ready) return
    const openId = searchParams.get('open')
    if (!openId) return
    const target = tasks.find(t => t.id === openId)
    if (target) {
      setEditTask(target)
      setDefaultStatus(target.status)
      setModalOpen(true)
    }
    router.replace('/tasks', { scroll: false })
  }, [searchParams, ready, tasks, router])

  // Summary stats
  const stats = useMemo(() => {
    const weekEnd = getWeekEnd(today)
    return {
      total: tasks.length,
      '待办': tasks.filter(t => t.status === '待办').length,
      '进行中': tasks.filter(t => t.status === '进行中').length,
      '审核中': tasks.filter(t => t.status === '审核中').length,
      '已完成': tasks.filter(t => t.status === '已完成').length,
      dueThisWeek: tasks.filter(t => t.status !== '已完成' && t.dueDate >= today && t.dueDate <= weekEnd).length,
      overdue: tasks.filter(t => t.dueDate && t.dueDate < today && t.status !== '已完成').length,
    }
  }, [tasks, today])

  // Unique assignees from tasks
  const assigneeList = useMemo(() => {
    const ids = new Set(tasks.map(t => t.assigneeId).filter(Boolean))
    return Array.from(ids).map(id => getMember(id)).filter(Boolean) as { id: string; name: string }[]
  }, [tasks, getMember])

  // Department list from scenarios
  const scenarioDepts = useMemo(() => {
    const depts = new Set(scenarios.map(s => s.department))
    return Array.from(depts)
  }, [scenarios])

  const filteredTasks = useMemo(() => {
    let result = tasks

    // Summary pill filter
    if (summaryFilter) {
      if (summaryFilter === 'overdue') {
        result = result.filter(t => t.dueDate && t.dueDate < today && t.status !== '已完成')
      } else if (summaryFilter === 'dueThisWeek') {
        const weekEnd = getWeekEnd(today)
        result = result.filter(t => t.status !== '已完成' && t.dueDate >= today && t.dueDate <= weekEnd)
      } else if (statusOptions.includes(summaryFilter as TaskStatus)) {
        result = result.filter(t => t.status === summaryFilter)
      }
    }

    if (filterAssignee) {
      result = result.filter(t => t.assigneeId === filterAssignee)
    }
    if (filterPriority) {
      result = result.filter(t => t.priority === filterPriority)
    }
    if (filterDept) {
      result = result.filter(t => {
        if (!t.scenarioId) return false
        const sc = getScenario(t.scenarioId)
        return sc?.department === filterDept
      })
    }
    return result
  }, [tasks, summaryFilter, filterAssignee, filterPriority, filterDept, today, getScenario])

  const hasActiveFilters = filterAssignee || filterPriority || filterDept || summaryFilter

  function handleSummaryClick(key: string) {
    setSummaryFilter(prev => prev === key ? '' : key)
  }

  function handleTaskClick(task: Task) {
    setEditTask(task)
    setDefaultStatus(task.status)
    setModalOpen(true)
  }

  function handleAddTask(status: TaskStatus = '待办') {
    setEditTask(undefined)
    setDefaultStatus(status)
    setModalOpen(true)
  }

  function handleSave(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) {
    if (data.id) {
      updateTask(data.id, data)
    } else {
      const { id: _id, ...rest } = data as Task
      addTask(rest)
    }
  }

  function handleStatusChange(taskId: string, newStatus: TaskStatus) {
    updateTask(taskId, { status: newStatus })
  }

  function clearAllFilters() {
    setFilterAssignee('')
    setFilterPriority('')
    setFilterDept('')
    setSummaryFilter('')
  }

  if (!ready) {
    return (
      <div className="flex flex-col h-screen">
        <Header title="任务管理" subtitle="加载中..." />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  const summaryPills: { key: string; label: string; count: number; activeColor: string; inactiveColor: string }[] = [
    { key: '待办', label: '待办', count: stats['待办'], activeColor: 'bg-gray-700 text-white', inactiveColor: 'bg-gray-100 text-gray-600 hover:bg-gray-200' },
    { key: '进行中', label: '进行中', count: stats['进行中'], activeColor: 'bg-blue-600 text-white', inactiveColor: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
    { key: '审核中', label: '审核中', count: stats['审核中'], activeColor: 'bg-amber-500 text-white', inactiveColor: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
    { key: '已完成', label: '已完成', count: stats['已完成'], activeColor: 'bg-green-600 text-white', inactiveColor: 'bg-green-50 text-green-700 hover:bg-green-100' },
    { key: 'overdue', label: '逾期', count: stats.overdue, activeColor: 'bg-red-700 text-white', inactiveColor: 'bg-red-100 text-red-700 hover:bg-red-200' },
    { key: 'dueThisWeek', label: '本周到期', count: stats.dueThisWeek, activeColor: 'bg-orange-600 text-white', inactiveColor: 'bg-orange-50 text-orange-600 hover:bg-orange-100' },
  ]

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="任务管理"
        subtitle={`共 ${filteredTasks.length} 项任务`}
        actions={
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setView('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  view === 'kanban'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <LayoutGrid size={14} />
                看板
              </button>
              <button
                onClick={() => setView('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  view === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <List size={14} />
                列表
              </button>
            </div>

            {/* New task button */}
            <button
              onClick={() => handleAddTask()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              <Plus size={15} />
              新建任务
            </button>
          </div>
        }
      />

      {/* Summary bar */}
      <div className="flex items-center gap-2 px-6 py-3 bg-white border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-700 mr-1">
          共 {stats.total} 项
        </span>
        <div className="w-px h-5 bg-gray-200" />
        {summaryPills.map(pill => (
          <button
            key={pill.key}
            onClick={() => handleSummaryClick(pill.key)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
              summaryFilter === pill.key ? pill.activeColor : pill.inactiveColor
            }`}
          >
            {pill.label}
            <span className={`font-bold ${summaryFilter === pill.key ? 'opacity-90' : ''}`}>
              {pill.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 px-6 py-2.5 bg-gray-50/50 border-b border-gray-100">
        <Filter size={14} className="text-gray-500" />

        <select
          value={filterAssignee}
          onChange={e => setFilterAssignee(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">全部负责人</option>
          {assigneeList.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>

        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">全部优先级</option>
          {priorityOptions.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <select
          value={filterDept}
          onChange={e => setFilterDept(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">全部部门</option>
          {scenarioDepts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            清除筛选
          </button>
        )}

        <span className="ml-auto text-xs text-gray-500">
          {filteredTasks.length !== tasks.length && `已筛选 ${filteredTasks.length} / ${tasks.length}`}
        </span>
      </div>

      {view === 'kanban' ? (
        <KanbanBoard
          tasks={filteredTasks}
          onStatusChange={handleStatusChange}
          onTaskClick={handleTaskClick}
          onAddTask={handleAddTask}
          issues={issues}
          getMember={getMember}
          getScenario={getScenario}
          today={today}
        />
      ) : (
        <TaskList
          tasks={filteredTasks}
          onTaskClick={handleTaskClick}
          issues={issues}
          getMember={getMember}
          getScenario={getScenario}
          today={today}
          team={team}
          onBulkUpdate={bulkUpdateTasks}
        />
      )}

      <TaskModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditTask(undefined) }}
        task={editTask}
        onSave={handleSave}
        onDelete={deleteTask}
        defaultStatus={defaultStatus}
      />
    </div>
  )
}
