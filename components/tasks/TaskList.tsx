'use client'

import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, Bug, Calendar } from 'lucide-react'
import type { Task, TaskStatus, TaskPriority, Issue, TeamMember, Scenario } from '@/lib/types'

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

type SortKey = 'title' | 'status' | 'priority' | 'dueDate'
type SortDir = 'asc' | 'desc'

const priorityOrder: Record<TaskPriority, number> = { '紧急': 0, '高': 1, '中': 2, '低': 3 }
const statusOrder: Record<TaskStatus, number> = { '待办': 0, '进行中': 1, '审核中': 2, '已完成': 3 }

interface TaskListProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
  issues: Issue[]
  getMember: (id: string) => TeamMember | undefined
  getScenario: (id: string) => Scenario | undefined
  today: string
}

export default function TaskList({ tasks, onTaskClick, issues, getMember, getScenario, today }: TaskListProps) {
  const [sortKey, setSortKey] = useState<SortKey>('priority')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  // Build a map from taskId -> issue count
  const issueCountByTask = useMemo(() => {
    const map = new Map<string, number>()
    for (const iss of issues) {
      if (iss.linkedTaskIds) {
        for (const tid of iss.linkedTaskIds) {
          map.set(tid, (map.get(tid) || 0) + 1)
        }
      }
    }
    return map
  }, [issues])

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

  const sorted = useMemo(() => {
    return [...tasks].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'title': cmp = a.title.localeCompare(b.title, 'zh-CN'); break
        case 'status': cmp = statusOrder[a.status] - statusOrder[b.status]; break
        case 'priority': cmp = priorityOrder[a.priority] - priorityOrder[b.priority]; break
        case 'dueDate': cmp = a.dueDate.localeCompare(b.dueDate); break
      }
      return sortDir === 'desc' ? -cmp : cmp
    })
  }, [tasks, sortKey, sortDir])

  return (
    <div className="p-6 flex-1 overflow-y-auto">
      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {([
                ['title', '任务名'],
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
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">场景/项目</th>
              {([
                ['priority', '优先级'],
                ['status', '状态'],
                ['dueDate', '截止日期'],
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
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">关联问题</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(task => {
              const member = getMember(task.assigneeId)
              const scenario = task.scenarioId ? getScenario(task.scenarioId) : undefined
              const isOverdue = task.status !== '已完成' && task.dueDate < today
              const prio = priorityStyle[task.priority]
              const issueCount = issueCountByTask.get(task.id) || 0

              return (
                <tr
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 max-w-[300px]">
                    <span className="text-sm font-medium text-gray-900 line-clamp-1">{task.title}</span>
                  </td>
                  <td className="px-4 py-3">
                    {member ? (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                          style={{ backgroundColor: member.color }}
                        >
                          {member.initials}
                        </div>
                        <span className="text-sm text-gray-700">{member.name}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {scenario ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 text-xs font-medium">
                        {scenario.code}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-xs font-medium">
                        项目
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${prio.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${prio.dot}`} />
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle[task.status]}`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-sm ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-600'}`}>
                      <Calendar size={12} className={isOverdue ? 'text-red-500' : 'text-gray-400'} />
                      {task.dueDate}
                      {isOverdue && <span className="text-[10px] ml-0.5">逾期</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {issueCount > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs text-red-500 font-medium">
                        <Bug size={12} />
                        {issueCount}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">-</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {sorted.length === 0 && (
          <div className="py-16 text-center text-sm text-gray-400">
            没有匹配的任务
          </div>
        )}
      </div>
    </div>
  )
}
