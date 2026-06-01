'use client'

import type { Issue, IssueStatus, IssueSeverity } from '@/lib/types'

const statusConfig: Record<IssueStatus, { label: string; bg: string; text: string; border: string; ring: string }> = {
  '待处理': { label: '待处理', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', ring: 'ring-red-300' },
  '处理中': { label: '处理中', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', ring: 'ring-blue-300' },
  '已解决': { label: '已解决', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', ring: 'ring-green-300' },
  '已关闭': { label: '已关闭', bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', ring: 'ring-gray-300' },
  '已驳回': { label: '已驳回', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', ring: 'ring-amber-300' },
}

const severityColors: Record<IssueSeverity, string> = {
  '严重': '#dc2626',
  '一般': '#d97706',
  '轻微': '#2563eb',
  '建议': '#6b7280',
}

const statuses: IssueStatus[] = ['待处理', '处理中', '已解决', '已关闭', '已驳回']
const severities: IssueSeverity[] = ['严重', '一般', '轻微', '建议']

interface IssueSummaryProps {
  issues: Issue[]
  onStatusFilter: (status: IssueStatus | null) => void
  activeStatus?: IssueStatus | null
}

export default function IssueSummary({ issues, onStatusFilter, activeStatus }: IssueSummaryProps) {
  const statusCounts = statuses.reduce((acc, s) => {
    acc[s] = issues.filter(i => i.status === s).length
    return acc
  }, {} as Record<IssueStatus, number>)

  const severityCounts = severities.reduce((acc, s) => {
    acc[s] = issues.filter(i => i.severity === s).length
    return acc
  }, {} as Record<IssueSeverity, number>)

  const total = issues.length
  const criticalCount = severityCounts['严重']

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      {/* Status counts row */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-baseline gap-2 mr-4">
          <span className="text-2xl font-bold text-gray-900">{total}</span>
          <span className="text-sm text-gray-500">个问题</span>
          {criticalCount > 0 && (
            <span className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
              严重 {criticalCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {statuses.map(s => {
            const cfg = statusConfig[s]
            const count = statusCounts[s]
            const isActive = activeStatus === s
            return (
              <button
                key={s}
                onClick={() => onStatusFilter(isActive ? null : s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${cfg.bg} ${cfg.border} ${
                  isActive ? `ring-2 ${cfg.ring} shadow-sm` : 'hover:shadow-sm'
                }`}
              >
                <span className={`text-lg font-bold ${cfg.text}`}>{count}</span>
                <span className={`text-xs font-medium ${cfg.text} opacity-80`}>{cfg.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Severity distribution bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-gray-500">严重度分布</span>
          <div className="flex items-center gap-3">
            {severities.map(s => (
              <div key={s} className="flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: severityColors[s] }}
                />
                <span className="text-xs text-gray-500">{s} {severityCounts[s]}</span>
              </div>
            ))}
          </div>
        </div>
        {total > 0 ? (
          <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
            {severities.map(s => {
              const pct = (severityCounts[s] / total) * 100
              if (pct === 0) return null
              return (
                <div
                  key={s}
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: severityColors[s],
                  }}
                  title={`${s}: ${severityCounts[s]} (${Math.round(pct)}%)`}
                />
              )
            })}
          </div>
        ) : (
          <div className="h-3 rounded-full bg-gray-100" />
        )}
      </div>
    </div>
  )
}
