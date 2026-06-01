'use client'

import {
  ListChecks,
  Loader,
  AlertTriangle,
  PackageCheck,
} from 'lucide-react'

interface StatsCardsProps {
  totalTasks: number
  inProgress: number
  overdue: number
  deliverableRate: number
}

const cards = [
  {
    key: 'total',
    label: '总任务数',
    icon: ListChecks,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
  },
  {
    key: 'inProgress',
    label: '进行中',
    icon: Loader,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
  },
  {
    key: 'overdue',
    label: '逾期任务',
    icon: AlertTriangle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-100',
  },
  {
    key: 'rate',
    label: '交付物完成率',
    icon: PackageCheck,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
  },
] as const

export default function StatsCards({
  totalTasks,
  inProgress,
  overdue,
  deliverableRate,
}: StatsCardsProps) {
  const values: Record<string, string> = {
    total: String(totalTasks),
    inProgress: String(inProgress),
    overdue: String(overdue),
    rate: `${deliverableRate}%`,
  }

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
            </div>
            <div className="mt-4">
              <div
                className={`text-3xl font-bold tracking-tight ${
                  overdueHighlight ? 'text-red-600' : 'text-gray-900'
                }`}
              >
                {values[card.key]}
              </div>
              <div className="mt-1 text-sm text-gray-500">{card.label}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
