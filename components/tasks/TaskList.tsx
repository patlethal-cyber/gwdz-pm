'use client'

import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import type { Task, TaskStatus, TaskPriority } from '@/lib/types'
import { getMember, getScenario } from '@/lib/store'

const statusStyle: Record<TaskStatus, string> = {
  '待办': 'bg-gray-100 text-gray-600',
  '进行中': 'bg-blue-50 text-blue-700',
  '审核中': 'bg-amber-50 text-amber-700',
  '已完成': 'bg-green-50 text-green-700',
}

const priorityStyle: Record<TaskPriority, { badge: string; dot: string }> = {
  '紧急': { badge: 'text-red-700', dot: 'bg-red-500' },
  '高': { badge: 'text-orange-700', dot: 'bg-orange-500' },
  '中': { badge: 'text-blue-700', dot: 'bg-blue-500' },
  '低': { badge: 'text-gray-500', dot: 'bg-gray-400' },
}

const statusOptions: TaskStatus[] = ['待办', '进行中', '审核中', '已完成']
const priorityOptions: TaskPriority[] = ['紧急', '高', '中', '低']
const departmentOptions = ['客户质量部', '测试一部', '测试二部']

type SortKey = 'title' | 'status' | 'priority' | 'dueDate'
type SortDir = 'asc' | 'desc'

const priorityOrder: Record<TaskPriority, number> = { '紧急': 0, '高': 1, '中': 2, '低': 3 }
const statusOrder: Record<TaskStatus, number> = { '待办': 0, '进行中': 1, '审核中': 2, '已完成': 3 }

interface TaskListProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
}

export default function TaskList({ tasks, onTaskClick }: TaskListProps) {
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterPriority, setFilterPriority] = useState<string>('')
  const [filterDept, setFilterDept] = useState<string>('')
  const [sortKey, setSortKey] = useState<SortKey>('priority')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const today = '2026-05-31'

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronsUpDown size={13} className="text-gray-300" />
    return sortDir === 'asc'
      ? <ChevronUp size={13} className="text-blue-500" />
      : <ChevronDown size={13} className="text-blue-500" />
  }

  const filtered = useMemo(() => {
    let result = tasks
    if (filterStatus) result = result.filter(t => t.status === filterStatus)
    if (filterPriority) result = result.filter(t => t.priority === filterPriority)
    if (filterDept) result = result.filter(t => t.department === filterDept)

    result = [...result].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'title': cmp = a.title.localeCompare(b.title, 'zh-CN'); break
        case 'status': cmp = statusOrder[a.status] - statusOrder[b.status]; break
        case 'priority': cmp = priorityOrder[a.priority] - priorityOrder[b.priority]; break
        case 'dueDate': cmp = a.dueDate.localeCompare(b.dueDate); break
      }
      return sortDir === 'desc' ? -cmp : cmp
    })
    return result
  }, [tasks, filterStatus, filterPriority, filterDept, sortKey, sortDir])

  return (
    <div className="p-6 h-[calc(100vh-64px)] overflow-y-auto">
      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm text-gray-500 font-medium">筛选：</span>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">全部状态</option>
          {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value)}
          className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">全部优先级</option>
          {priorityOptions.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select
          value={filterDept}
          onChange={e => setFilterDept(e.target.value)}
          className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">全部部门</option>
          {departmentOptions.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        {(filterStatus || filterPriority || filterDept) && (
          <button
            onClick={() => { setFilterStatus(''); setFilterPriority(''); setFilterDept('') }}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            清除筛选
          </button>
        )}
        <span className="ml-auto text-xs text-gray-400">{filtered.length} 项任务</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {([
                ['title', '标题'],
                ['status', '状态'],
                ['priority', '优先级'],
              ] as [SortKey, string][]).map(([key, label]) => (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 cursor-pointer hover:bg-gray-50 select-none"
                >
                  <span className="inline-flex items-center gap-1">
                    {label}
                    <SortIcon col={key} />
                  </span>
                </th>
              ))}
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">负责人</th>
              <th
                onClick={() => handleSort('dueDate')}
                className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 cursor-pointer hover:bg-gray-50 select-none"
              >
                <span className="inline-flex items-center gap-1">
                  截止日期
                  <SortIcon col="dueDate" />
                </span>
              </th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">场景</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">部门</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(task => {
              const member = getMember(task.assigneeId)
              const scenario = task.scenarioId ? getScenario(task.scenarioId) : undefined
              const isOverdue = task.status !== '已完成' && task.dueDate < today
              const prio = priorityStyle[task.priority]

              return (
                <tr
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-gray-900">{task.title}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle[task.status]}`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${prio.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${prio.dot}`} />
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {member && (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                          style={{ backgroundColor: member.color }}
                        >
                          {member.initials}
                        </div>
                        <span className="text-sm text-gray-700">{member.name}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-600'}`}>
                      {task.dueDate}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {scenario ? (
                      <span className="text-xs text-violet-600 font-medium">{scenario.code}</span>
                    ) : (
                      <span className="text-xs text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500">{task.department || '-'}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-sm text-gray-400">
            没有匹配的任务
          </div>
        )}
      </div>
    </div>
  )
}
