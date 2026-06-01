'use client'

import {
  CheckSquare,
  FileText,
  Calendar,
  Flag,
  AlertCircle,
} from 'lucide-react'

interface ActivityItem {
  id: string
  type: 'task' | 'deliverable' | 'meeting' | 'milestone' | 'issue'
  action: string
  subject: string
  userName: string
  userInitials: string
  userColor: string
  timestamp: string
}

interface ActivityFeedProps {
  items: ActivityItem[]
}

const typeConfig = {
  task: {
    icon: CheckSquare,
    bg: 'bg-blue-50',
    color: 'text-blue-600',
  },
  deliverable: {
    icon: FileText,
    bg: 'bg-violet-50',
    color: 'text-violet-600',
  },
  meeting: {
    icon: Calendar,
    bg: 'bg-emerald-50',
    color: 'text-emerald-600',
  },
  milestone: {
    icon: Flag,
    bg: 'bg-amber-50',
    color: 'text-amber-600',
  },
  issue: {
    icon: AlertCircle,
    bg: 'bg-red-50',
    color: 'text-red-600',
  },
}

function relativeTime(timestamp: string) {
  // Parse timestamps by splitting to avoid Date constructor timezone issues
  const nowParts = '2026-05-31T12:00:00'.split(/[-T:]/).map(Number)
  const thenParts = timestamp.split(/[-T:]/).map(Number)

  const monthDays = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  function toMinutes(p: number[]) {
    let days = 0
    for (let m = 1; m < p[1]; m++) days += monthDays[m]
    days += p[2]
    days += (p[0] - 2026) * 365
    return days * 24 * 60 + p[3] * 60 + p[4]
  }

  const diffMin = toMinutes(nowParts) - toMinutes(thenParts)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin} 分钟前`
  if (diffHr < 24) return `${diffHr} 小时前`
  if (diffDay === 1) return '昨天'
  if (diffDay < 7) return `${diffDay} 天前`
  return `${thenParts[1]}/${thenParts[2]}`
}

export default function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-gray-900">
        最近动态
      </h2>

      <div className="space-y-1">
        {items.map((item) => {
          const config = typeConfig[item.type]
          const Icon = config.icon

          return (
            <div
              key={item.id}
              className="group flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-gray-50"
            >
              {/* user avatar */}
              <div
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: item.userColor }}
              >
                {item.userInitials}
              </div>

              {/* content */}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-700 leading-snug">
                  <span className="font-medium text-gray-900">
                    {item.userName}
                  </span>{' '}
                  {item.action}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium ${config.bg} ${config.color}`}
                  >
                    <Icon size={11} />
                    {item.subject}
                  </span>
                </div>
              </div>

              {/* timestamp */}
              <span className="flex-shrink-0 pt-0.5 text-xs text-gray-400">
                {relativeTime(item.timestamp)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
