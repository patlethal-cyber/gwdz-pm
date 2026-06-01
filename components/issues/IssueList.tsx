'use client'

import Link from 'next/link'
import type { Issue, IssueStatus, IssueSeverity, IssueCategory, Task } from '@/lib/types'
import type { TeamMember, Scenario } from '@/lib/types'

const severityStyle: Record<IssueSeverity, string> = {
  '严重': 'bg-red-100 text-red-700',
  '一般': 'bg-amber-100 text-amber-700',
  '轻微': 'bg-blue-100 text-blue-700',
  '建议': 'bg-gray-100 text-gray-600',
}

const statusStyle: Record<IssueStatus, string> = {
  '待处理': 'bg-red-100 text-red-700 border border-red-200',
  '处理中': 'bg-blue-100 text-blue-700 border border-blue-200',
  '已解决': 'bg-green-100 text-green-700 border border-green-200',
  '已关闭': 'bg-gray-100 text-gray-600 border border-gray-200',
  '已驳回': 'bg-amber-100 text-amber-700 border border-amber-200',
}

const categoryLabel: Record<IssueCategory, string> = {
  'scenario': '场景',
  'project': '项目',
}

const categoryStyle: Record<IssueCategory, string> = {
  'scenario': 'bg-violet-50 text-violet-700',
  'project': 'bg-slate-50 text-slate-700',
}

const severityOrder: Record<IssueSeverity, number> = { '严重': 0, '一般': 1, '轻微': 2, '建议': 3 }

interface IssueListProps {
  issues: Issue[]
  onEdit: (issue: Issue) => void
  team: TeamMember[]
  scenarios: Scenario[]
  tasks: Task[]
  today: string
}

export default function IssueList({ issues, onEdit, team, scenarios, tasks, today }: IssueListProps) {
  const sorted = [...issues].sort((a, b) => {
    const sevCmp = severityOrder[a.severity] - severityOrder[b.severity]
    if (sevCmp !== 0) return sevCmp
    return b.createdAt.localeCompare(a.createdAt)
  })

  const getMember = (id: string) => team.find(m => m.id === id)
  const getScenario = (id: string) => scenarios.find(s => s.id === id)
  const getTask = (id: string) => tasks.find(t => t.id === id)

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false
    return dueDate < today
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 w-16">ID</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 min-w-[180px]">标题</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 w-16">分类</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 w-20">严重度</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 w-20">状态</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 w-24">关联场景</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 w-36">关联任务</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 w-28">负责人</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 w-24">报告日期</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 w-28">计划解决</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(issue => {
              const member = getMember(issue.assigneeId)
              const scenario = issue.scenarioId ? getScenario(issue.scenarioId) : undefined
              const linkedTasks = (issue.linkedTaskIds || []).map(id => getTask(id)).filter(Boolean) as Task[]
              const dueDateOverdue = issue.status !== '已解决' && issue.status !== '已关闭' && isOverdue(issue.dueDate)

              return (
                <tr
                  key={issue.id}
                  onClick={() => onEdit(issue)}
                  className="border-b border-gray-50 hover:bg-gray-50/80 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-gray-400">{issue.id.slice(0, 8).toUpperCase()}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-gray-900 line-clamp-1">{issue.title}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-medium ${categoryStyle[issue.category]}`}>
                      {categoryLabel[issue.category]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${severityStyle[issue.severity]}`}>
                      {issue.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${statusStyle[issue.status]}`}>
                      {issue.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {scenario ? (
                      <Link
                        href={`/scenarios/${scenario.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-violet-600 hover:text-violet-800 hover:underline font-medium"
                      >
                        {scenario.code}
                      </Link>
                    ) : (
                      <span className="text-xs text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {linkedTasks.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {linkedTasks.slice(0, 2).map(t => (
                          <Link
                            key={t.id}
                            href="/tasks"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-block max-w-[120px] truncate text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium bg-blue-50 px-1.5 py-0.5 rounded"
                            title={t.title}
                          >
                            {t.title}
                          </Link>
                        ))}
                        {linkedTasks.length > 2 && (
                          <span className="text-[10px] text-gray-400 self-center">+{linkedTasks.length - 2}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">-</span>
                    )}
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
                    <span className="text-sm text-gray-600">{issue.createdAt}</span>
                  </td>
                  <td className="px-4 py-3">
                    {issue.dueDate ? (
                      <span className={`text-sm font-medium ${dueDateOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                        {issue.dueDate}
                        {dueDateOverdue && (
                          <span className="ml-1 text-[10px] text-red-500 font-semibold">逾期</span>
                        )}
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
      </div>

      {sorted.length === 0 && (
        <div className="py-16 text-center text-sm text-gray-400">
          没有匹配的问题
        </div>
      )}
    </div>
  )
}
