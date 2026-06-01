'use client'

import Link from 'next/link'
import {
  Loader,
  AlertTriangle,
  BarChart3,
  ListChecks,
} from 'lucide-react'
import type { DashboardStats } from '@/lib/types'

interface StatsCardsProps {
  stats: DashboardStats
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      key: 'inProgress',
      label: '进行中任务',
      value: stats.tasksInProgress,
      icon: Loader,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      href: '/tasks?status=进行中',
      highlight: false,
    },
    {
      key: 'overdue',
      label: '逾期任务',
      value: stats.tasksOverdue,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      href: '/tasks?status=overdue',
      highlight: stats.tasksOverdue > 0,
    },
    {
      key: 'severe',
      label: '严重问题',
      value: stats.issuesSevere,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      href: '/issues?severity=严重',
      highlight: stats.issuesSevere > 0,
    },
    {
      key: 'progress',
      label: '项目总体进度',
      value: stats.projectProgress,
      icon: BarChart3,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      href: '/deliverables',
      highlight: false,
      isProgress: true,
    },
  ] as const

  return (
    <div className="grid grid-cols-4 gap-5">
      {cards.map(card => {
        const Icon = card.icon
        const isRed = card.highlight

        return (
          <Link
            key={card.key}
            href={card.href}
            className={`block rounded-xl border bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${
              isRed ? 'border-red-300 ring-1 ring-red-100' : card.border
            }`}
          >
            <div className="flex items-center justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.bg}`}>
                <Icon size={20} className={isRed ? 'text-red-600' : card.color} />
              </div>
              {card.key !== 'progress' && (
                <div className="flex items-center gap-1">
                  <ListChecks size={14} className="text-gray-300" />
                  <span className="text-xs text-gray-400">
                    / {stats.totalTasks}
                  </span>
                </div>
              )}
            </div>
            <div className="mt-4">
              {card.key === 'progress' ? (
                <>
                  <div className="text-3xl font-bold tracking-tight text-gray-900">
                    {card.value}%
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${Math.min(card.value, 100)}%` }}
                    />
                  </div>
                </>
              ) : (
                <div
                  className={`text-3xl font-bold tracking-tight ${
                    isRed ? 'text-red-600' : 'text-gray-900'
                  }`}
                >
                  {card.value}
                </div>
              )}
              <div className="mt-1 text-sm text-gray-500">{card.label}</div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
