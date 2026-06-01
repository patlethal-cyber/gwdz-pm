'use client'

import {
  ListChecks,
  Loader,
  AlertTriangle,
  PackageCheck,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { useData } from '@/lib/data-context'

export default function StatsCards() {
  const { tasks, deliverables, getOverdueTasks, getTasksByStatus } = useData()

  const totalTasks = tasks.length
  const inProgress = getTasksByStatus('进行中').length
  const overdue = getOverdueTasks().length
  const archivedCount = deliverables.filter(d => d.status === '已归档').length
  const deliverableRate = deliverables.length > 0
    ? Math.round((archivedCount / deliverables.length) * 100)
    : 0

  const cards = [
    {
      key: 'total',
      label: '总任务数',
      value: String(totalTasks),
      icon: ListChecks,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      trend: '+2',
      trendUp: true,
    },
    {
      key: 'inProgress',
      label: '进行中',
      value: String(inProgress),
      icon: Loader,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      trend: '+3',
      trendUp: true,
    },
    {
      key: 'overdue',
      label: '逾期任务',
      value: String(overdue),
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-100',
      trend: '-1',
      trendUp: false,
    },
    {
      key: 'rate',
      label: '交付物完成率',
      value: `${deliverableRate}%`,
      icon: PackageCheck,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      trend: '+5%',
      trendUp: true,
    },
  ] as const

  return (
    <div className="grid grid-cols-4 gap-5">
      {cards.map((card) => {
        const Icon = card.icon
        const isOverdueCard = card.key === 'overdue'
        const overdueHighlight = isOverdueCard && overdue > 0

        return (
          <div
            key={card.key}
            className={`rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${
              overdueHighlight ? 'border-red-200 ring-1 ring-red-100' : card.border
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.bg}`}
              >
                <Icon size={20} className={card.color} />
              </div>
              <div
                className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                  card.trendUp
                    ? isOverdueCard
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-blue-50 text-blue-600'
                    : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                {card.trendUp ? (
                  isOverdueCard ? (
                    <TrendingDown size={12} />
                  ) : (
                    <TrendingUp size={12} />
                  )
                ) : (
                  <TrendingDown size={12} />
                )}
                <span>{card.trend}</span>
              </div>
            </div>
            <div className="mt-4">
              <div
                className={`text-3xl font-bold tracking-tight ${
                  overdueHighlight ? 'text-red-600' : 'text-gray-900'
                }`}
              >
                {card.value}
              </div>
              <div className="mt-1 text-sm text-gray-500">{card.label}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
