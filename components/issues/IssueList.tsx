'use client'

import Link from 'next/link'
import type { Issue, IssueStatus, IssueSeverity, Task } from '@/lib/types'
import type { TeamMember, Scenario } from '@/lib/types'

const severityStyle: Record<IssueSeverity, string> = {
  '严重': 'bg-red-100 text-red-700',
  '一般': 'bg-amber-100 text-amber-700',
  '轻微': 'bg-blue-100 text-blue-700',
  '建议': 'bg-gray-100 text-gray-600',
}

const statusStyle: Record<IssueStatus, string> = {
  '待处理': 'bg-red-50 text-red-700',
  '处理中': 'bg-blue-50 text-blue-700',
  '已解决': 'bg-green-50 text-green-700',
  '已关闭': 'bg-gray-100 text-gray-600',
  '已驳回': 'bg-amber-50 text-amber-700',
}

const severityOrder: Record<IssueSeverity, number> = { '严重': 0, '一般': 1, '轻微': 2, '建议': 3 }

interface IssueListProps {
  issues: Issue[]
  onEdit: (issue: Issue) => void
  team: TeamMember[]
  scenarios: Scenario[]
  tasks?: Task[]
}

function getMemberById(team: TeamMember[], id: string) {
  return team.find(m => m.id === id)
}

function getScenarioById(scenarios: Scenario[], id: string) {
  return scenarios.find(s => s.id === id)
}

function getTaskById(tasks: Task[], id: string) {
  return tasks.find(t => t.id === id)
}

export default function IssueList({ issues, onEdit, team, scenarios, tasks = [] }: IssueListProps) {
  const sorted = [...issues].sort((a, b) => {
    const sevCmp = severityOrder[a.severity] - severityOrder[b.severity]
    if (sevCmp !== 0) return sevCmp
    return b.createdAt.localeCompare(a.createdAt)
  })

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 w-16">ID</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">标题</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 w-20">严重度</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 w-20">状态</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 w-24">来源</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 w-24">关联场景</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 w-28">关联任务</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 w-32">负责人</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 w-28">报告日期</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(issue => {
            const member = getMemberById(team, issue.assigneeId)
            const scenario = issue.scenarioId ? getScenarioById(scenarios, issue.scenarioId) : undefined
            const linkedTask = issue.linkedTaskId ? getTaskById(tasks, issue.linkedTaskId) : undefined

            return (
              <tr
                key={issue.id}
                onClick={() => onEdit(issue)}
                className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <span className="text-xs font-mono text-gray-400">{issue.id.toUpperCase()}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-medium text-gray-900">{issue.title}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${severityStyle[issue.severity]}`}>
                    {issue.severity}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle[issue.status]}`}>
                    {issue.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-gray-500">{issue.source}</span>
                </td>
                <td className="px-4 py-3">
                  {scenario ? (
                    <span className="text-xs text-violet-600 font-medium">{scenario.code}</span>
                  ) : (
                    <span className="text-xs text-gray-300">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {linkedTask ? (
                    <Link
                      href="/tasks"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium truncate block max-w-[100px]"
                      title={linkedTask.title}
                    >
                      {linkedTask.title}
                    </Link>
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
              </tr>
            )
          })}
        </tbody>
      </table>

      {sorted.length === 0 && (
        <div className="py-16 text-center text-sm text-gray-400">
          没有匹配的问题
        </div>
      )}
    </div>
  )
}
