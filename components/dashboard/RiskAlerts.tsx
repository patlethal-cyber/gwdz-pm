'use client'

import { AlertTriangle, Clock, ShieldCheck } from 'lucide-react'

interface RiskItem {
  id: string
  title: string
  assignee: string
  dueDate: string
  scenario?: string
  type: 'overdue' | 'urgent'
}

interface RiskAlertsProps {
  items: RiskItem[]
}

function formatDate(dateStr: string) {
  const parts = dateStr.split('-')
  return `${parts[0]}-${parts[1]}-${parts[2]}`
}

function daysUntil(dateStr: string) {
  const pa = '2026-05-31'.split('-').map(Number)
  const pb = dateStr.split('-').map(Number)
  const monthDays = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  function toDayCount(parts: number[]) {
    let total = 0
    for (let m = 1; m < parts[1]; m++) total += monthDays[m]
    total += parts[2]
    total += (parts[0] - 2026) * 365
    return total
  }
  return toDayCount(pb) - toDayCount(pa)
}

export default function RiskAlerts({ items }: RiskAlertsProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          风险预警
        </h2>
        <div className="flex items-center gap-3 rounded-lg bg-emerald-50 p-4">
          <ShieldCheck size={20} className="text-emerald-600" />
          <span className="text-sm font-medium text-emerald-700">
            暂无风险 -- 所有任务按计划推进
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-base font-semibold text-gray-900">风险预警</h2>
        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
          {items.length}
        </span>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const isOD = item.type === 'overdue'
          const days = daysUntil(item.dueDate)

          return (
            <div
              key={item.id}
              className={`flex items-start gap-3 rounded-lg border-l-[3px] p-3.5 ${
                isOD
                  ? 'border-l-red-500 bg-red-50/60'
                  : 'border-l-amber-500 bg-amber-50/60'
              }`}
            >
              <div
                className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md ${
                  isOD ? 'bg-red-100' : 'bg-amber-100'
                }`}
              >
                {isOD ? (
                  <Clock size={14} className="text-red-600" />
                ) : (
                  <AlertTriangle size={14} className="text-amber-600" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900 leading-snug">
                    {item.title}
                  </p>
                  {item.scenario && (
                    <span className="flex-shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                      {item.scenario}
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-500">
                  <span>{item.assignee}</span>
                  <span className="text-gray-300">|</span>
                  <span
                    className={
                      isOD ? 'font-medium text-red-600' : 'text-gray-500'
                    }
                  >
                    {isOD
                      ? `已逾期 ${Math.abs(days)} 天`
                      : `截止 ${formatDate(item.dueDate)}`}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
