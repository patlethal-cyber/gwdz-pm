'use client'

import { useData } from '@/lib/data-context'
import { AlertTriangle, Clock, AlertCircle, CalendarClock, X } from 'lucide-react'

interface Notification {
  id: string
  type: 'red' | 'amber' | 'blue'
  icon: typeof AlertTriangle
  title: string
  detail: string
}

const TODAY = '2026-05-31'

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

const typeOrder: Record<Notification['type'], number> = { red: 0, amber: 1, blue: 2 }

const typeBg: Record<Notification['type'], string> = {
  red: 'bg-red-50 border-red-200',
  amber: 'bg-amber-50 border-amber-200',
  blue: 'bg-blue-50 border-blue-200',
}

const typeIcon: Record<Notification['type'], string> = {
  red: 'text-red-500',
  amber: 'text-amber-500',
  blue: 'text-blue-500',
}

interface NotificationPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const { tasks, issues, meetings } = useData()

  if (!isOpen) return null

  const notifications: Notification[] = []

  const threeDaysLater = addDays(TODAY, 3)
  const twoDaysLater = addDays(TODAY, 2)

  // Overdue tasks (red)
  tasks.forEach(t => {
    if (t.status !== '已完成' && t.dueDate < TODAY) {
      notifications.push({
        id: `overdue-${t.id}`,
        type: 'red',
        icon: AlertTriangle,
        title: '任务逾期',
        detail: `${t.title}（截止 ${t.dueDate}）`,
      })
    }
  })

  // Due within 3 days (amber)
  tasks.forEach(t => {
    if (t.status !== '已完成' && t.dueDate >= TODAY && t.dueDate <= threeDaysLater) {
      notifications.push({
        id: `due-soon-${t.id}`,
        type: 'amber',
        icon: Clock,
        title: '即将到期',
        detail: `${t.title}（截止 ${t.dueDate}）`,
      })
    }
  })

  // Severe unresolved issues (red)
  issues.forEach(i => {
    if (i.severity === '严重' && i.status !== '已解决' && i.status !== '已关闭') {
      notifications.push({
        id: `issue-${i.id}`,
        type: 'red',
        icon: AlertCircle,
        title: '严重问题未解决',
        detail: i.title,
      })
    }
  })

  // Upcoming meetings within 2 days (blue)
  meetings.forEach(m => {
    if (m.status === '即将召开' && m.date >= TODAY && m.date <= twoDaysLater) {
      notifications.push({
        id: `meeting-${m.id}`,
        type: 'blue',
        icon: CalendarClock,
        title: '即将召开会议',
        detail: `${m.title}（${m.date} ${m.time}）`,
      })
    }
  })

  // Sort: red first, then amber, then blue
  notifications.sort((a, b) => typeOrder[a.type] - typeOrder[b.type])

  const display = notifications.slice(0, 10)

  return (
    <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-[100] max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800">通知</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {display.length === 0 ? (
        <div className="py-10 text-center text-sm text-gray-400">暂无通知</div>
      ) : (
        <div className="p-2 space-y-1.5">
          {display.map(n => {
            const Icon = n.icon
            return (
              <div
                key={n.id}
                className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border ${typeBg[n.type]}`}
              >
                <Icon size={16} className={`mt-0.5 flex-shrink-0 ${typeIcon[n.type]}`} />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-gray-700">{n.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5 truncate">{n.detail}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {notifications.length > 10 && (
        <div className="px-4 py-2 border-t border-gray-100 text-center">
          <span className="text-xs text-gray-400">还有 {notifications.length - 10} 条通知</span>
        </div>
      )}
    </div>
  )
}
