'use client'

import { useMemo } from 'react'
import { useData } from '@/lib/data-context'
import {
  X, CheckSquare, FileText, Bug, Calendar, Flag,
  Plus, RefreshCw, Trash2, ArrowRightLeft,
} from 'lucide-react'

interface NotificationPanelProps {
  onClose: () => void
}

const entityTypeIcons: Record<string, typeof CheckSquare> = {
  task: CheckSquare,
  deliverable: FileText,
  issue: Bug,
  meeting: Calendar,
  milestone: Flag,
}

const entityTypeLabels: Record<string, string> = {
  task: '任务',
  deliverable: '交付物',
  issue: '问题',
  meeting: '会议',
  milestone: '里程碑',
}

const actionIcons: Record<string, typeof Plus> = {
  created: Plus,
  updated: RefreshCw,
  deleted: Trash2,
  status_changed: ArrowRightLeft,
}

const actionLabels: Record<string, string> = {
  created: '创建',
  updated: '更新',
  deleted: '删除',
  status_changed: '状态变更',
}

function relativeTime(timestamp: string): string {
  const now = Date.now()
  const ts = new Date(timestamp).getTime()
  if (isNaN(ts)) return ''
  const diff = Math.floor((now - ts) / 1000)

  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
  if (diff < 604800) return `${Math.floor(diff / 86400)} 天前`
  return timestamp.slice(0, 10)
}

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { activities, tasks, deliverables, issues, meetings } = useData()

  const entries = useMemo(() => {
    const sorted = [...activities].sort((a, b) =>
      b.timestamp.localeCompare(a.timestamp)
    )
    return sorted.slice(0, 20)
  }, [activities])

  function getEntityName(entityType: string, entityId: string): string {
    switch (entityType) {
      case 'task': {
        const t = tasks.find(x => x.id === entityId)
        return t?.title || entityId
      }
      case 'deliverable': {
        const d = deliverables.find(x => x.id === entityId)
        return d ? `${d.code} ${d.name}` : entityId
      }
      case 'issue': {
        const i = issues.find(x => x.id === entityId)
        return i?.title || entityId
      }
      case 'meeting': {
        const m = meetings.find(x => x.id === entityId)
        return m?.title || entityId
      }
      default:
        return entityId
    }
  }

  function buildDescription(entry: (typeof entries)[0]): string {
    const typeLabel = entityTypeLabels[entry.entityType] || entry.entityType
    const actionLabel = actionLabels[entry.action] || entry.action

    if (entry.action === 'status_changed' && entry.details?.statusChange) {
      const sc = entry.details.statusChange as { from: string; to: string }
      return `${typeLabel}${actionLabel}: ${sc.from} -> ${sc.to}`
    }

    return `${typeLabel}${actionLabel}`
  }

  return (
    <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-[100] max-h-[480px] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <h3 className="text-sm font-semibold text-gray-800">通知</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {entries.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">暂无新通知</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {entries.map(entry => {
              const EntityIcon = entityTypeIcons[entry.entityType] || Flag
              const ActionIcon = actionIcons[entry.action] || RefreshCw
              const entityName = getEntityName(entry.entityType, entry.entityId)
              const description = buildDescription(entry)
              const time = relativeTime(entry.timestamp)

              const iconBg =
                entry.entityType === 'task' ? 'bg-blue-50 text-blue-500' :
                entry.entityType === 'deliverable' ? 'bg-violet-50 text-violet-500' :
                entry.entityType === 'issue' ? 'bg-red-50 text-red-500' :
                entry.entityType === 'meeting' ? 'bg-green-50 text-green-500' :
                'bg-gray-50 text-gray-500'

              return (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                    <EntityIcon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <ActionIcon size={11} className="text-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-500">{description}</span>
                    </div>
                    <div className="text-sm text-gray-800 mt-0.5 truncate">{entityName}</div>
                    <div className="text-[10px] text-gray-400 mt-1">{time}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
