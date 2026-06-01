'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'
import { tasks } from '@/lib/store'
import type { TaskStatus } from '@/lib/types'

const STATUS_CONFIG: { status: TaskStatus; label: string; color: string }[] = [
  { status: '待办',   label: '待办',   color: '#9ca3af' },
  { status: '进行中', label: '进行中', color: '#2563eb' },
  { status: '审核中', label: '审核中', color: '#d97706' },
  { status: '已完成', label: '已完成', color: '#16a34a' },
]

export default function TaskDistribution() {
  const data = STATUS_CONFIG.map(({ status, label, color }) => ({
    name: label,
    value: tasks.filter(t => t.status === status).length,
    color,
  })).filter(d => d.value > 0)

  const total = tasks.length

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-gray-900">
        任务分布
      </h2>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} />
              ))}
            </Pie>

            {/* Center label */}
            <text
              x="50%"
              y="42%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-gray-900"
              style={{ fontSize: 28, fontWeight: 700 }}
            >
              {total}
            </text>
            <text
              x="50%"
              y="52%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-gray-400"
              style={{ fontSize: 12 }}
            >
              项任务
            </text>

            <Legend
              verticalAlign="bottom"
              align="center"
              iconType="circle"
              iconSize={8}
              formatter={(value: string) => (
                <span style={{ color: '#6b7280', fontSize: 12 }}>{value}</span>
              )}
              wrapperStyle={{ paddingTop: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
