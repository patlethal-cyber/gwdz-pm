'use client'

import { useState, useMemo } from 'react'
import { Plus, LayoutGrid, List, Filter } from 'lucide-react'
import Header from '@/components/layout/Header'
import KanbanBoard from '@/components/tasks/KanbanBoard'
import TaskList from '@/components/tasks/TaskList'
import TaskModal from '@/components/tasks/TaskModal'
import { useData } from '@/lib/data-context'
import type { Task, TaskStatus, TaskPriority } from '@/lib/types'

type ViewMode = 'kanban' | 'list'
type TaskScope = 'all' | 'mine'

const priorityOptions: TaskPriority[] = ['紧急', '高', '中', '低']
const departmentOptions = ['客户质量部', '测试一部', '测试二部']

export default function TasksPage() {
  const { tasks, issues, team, updateTask, addTask, deleteTask, getMember, getScenario, ready } = useData()

  const [view, setView] = useState<ViewMode>('kanban')
  const [modalOpen, setModalOpen] = useState(false)
  const [editTask, setEditTask] = useState<Task | undefined>(undefined)
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('待办')

  // Filter state
  const [scope, setScope] = useState<TaskScope>('all')
  const [filterAssignee, setFilterAssignee] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterDept, setFilterDept] = useState('')

  const edenTeam = useMemo(() => team.filter(m => m.organization === '乙方'), [team])

  const filteredTasks = useMemo(() => {
    let result = tasks
    if (scope === 'mine') {
      result = result.filter(t => t.assigneeId === 'm01')
    }
    if (filterAssignee) {
      result = result.filter(t => t.assigneeId === filterAssignee)
    }
    if (filterPriority) {
      result = result.filter(t => t.priority === filterPriority)
    }
    if (filterDept) {
      result = result.filter(t => t.department === filterDept)
    }
    return result
  }, [tasks, scope, filterAssignee, filterPriority, filterDept])

  const hasActiveFilters = filterAssignee || filterPriority || filterDept

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

  function handleSave(saved: Task) {
    const existing = tasks.find(t => t.id === saved.id)
    if (existing) {
      updateTask(saved.id, saved)
    } else {
      const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = saved
      addTask(rest)
    }
  }

  function handleStatusChange(taskId: string, newStatus: TaskStatus) {
    updateTask(taskId, { status: newStatus })
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

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="任务管理"
        subtitle={`共 ${filteredTasks.length} 项任务${scope === 'mine' ? '（我的）' : ''}`}
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

      {/* Filter bar */}
      <div className="flex items-center gap-3 px-6 py-3 bg-white border-b border-gray-100">
        {/* Scope toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setScope('all')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              scope === 'all'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            全部任务
          </button>
          <button
            onClick={() => setScope('mine')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              scope === 'mine'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            我的任务
          </button>
        </div>

        <div className="w-px h-5 bg-gray-200" />

        <Filter size={14} className="text-gray-400" />

        <select
          value={filterAssignee}
          onChange={e => setFilterAssignee(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">全部负责人</option>
          {edenTeam.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
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
          {departmentOptions.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        {hasActiveFilters && (
          <button
            onClick={() => { setFilterAssignee(''); setFilterPriority(''); setFilterDept('') }}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            清除筛选
          </button>
        )}
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
        />
      ) : (
        <TaskList
          tasks={filteredTasks}
          onTaskClick={handleTaskClick}
        />
      )}

      <TaskModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditTask(undefined) }}
        task={editTask}
        onSave={handleSave}
        defaultStatus={defaultStatus}
      />
    </div>
  )
}
