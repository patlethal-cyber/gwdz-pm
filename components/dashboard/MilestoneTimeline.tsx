'use client'

import type { Milestone } from '@/lib/types'

interface MilestoneTimelineProps {
  milestones: Milestone[]
}

function statusDot(status: Milestone['status']) {
  switch (status) {
    case '已完成':
      return 'bg-emerald-500 ring-4 ring-emerald-100'
    case '进行中':
      return 'bg-blue-500 ring-4 ring-blue-100 animate-pulse'
    case '待开始':
      return 'bg-gray-300 ring-4 ring-gray-100'
  }
}

function statusLabel(status: Milestone['status']) {
  switch (status) {
    case '已完成':
      return 'text-emerald-700 bg-emerald-50'
    case '进行中':
      return 'text-blue-700 bg-blue-50'
    case '待开始':
      return 'text-gray-500 bg-gray-50'
  }
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function daysBetween(a: string, b: string) {
  return (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24)
}

export default function MilestoneTimeline({ milestones }: MilestoneTimelineProps) {
  const sorted = [...milestones].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const today = '2026-05-31'
  const firstDate = sorted[0]?.date ?? today
  const lastDate = sorted[sorted.length - 1]?.date ?? today
  const totalSpan = daysBetween(firstDate, lastDate) || 1

  const todayPct = Math.min(
    Math.max((daysBetween(firstDate, today) / totalSpan) * 100, 0),
    100
  )

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-base font-semibold text-gray-900">
        项目里程碑
      </h2>

      <div className="relative px-6 pt-2 pb-4">
        {/* connecting line */}
        <div className="absolute top-[42px] left-6 right-6 h-0.5 bg-gray-200" />
        {/* progress fill */}
        <div
          className="absolute top-[42px] left-6 h-0.5 bg-blue-400"
          style={{ width: `${todayPct}%` }}
        />

        {/* today marker */}
        <div
          className="absolute top-[30px] -translate-x-1/2"
          style={{ left: `${todayPct}%` }}
        >
          <div className="flex flex-col items-center">
            <span className="mb-1 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
              今天
            </span>
            <div className="h-6 w-px bg-blue-400" />
          </div>
        </div>

        {/* milestone nodes */}
        <div className="relative flex justify-between">
          {sorted.map((ms) => {
            const pct = (daysBetween(firstDate, ms.date) / totalSpan) * 100
            return (
              <div
                key={ms.id}
                className="flex flex-col items-center"
                style={{ width: `${100 / sorted.length}%` }}
              >
                {/* code label */}
                <span className="mb-2 text-xs font-bold text-gray-700">
                  {ms.code}
                </span>

                {/* dot */}
                <div className={`z-10 h-3.5 w-3.5 rounded-full ${statusDot(ms.status)}`} />

                {/* name */}
                <span className="mt-2 text-xs font-medium text-gray-800 text-center leading-tight max-w-[100px]">
                  {ms.name}
                </span>

                {/* date */}
                <span className="mt-0.5 text-[11px] text-gray-400">
                  {formatDate(ms.date)}
                </span>

                {/* status badge */}
                <span
                  className={`mt-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusLabel(ms.status)}`}
                >
                  {ms.status}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
