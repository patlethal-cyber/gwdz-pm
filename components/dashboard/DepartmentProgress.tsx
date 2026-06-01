'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useData } from '@/lib/data-context'
import type { DeliverableStatus } from '@/lib/types'

const STATUS_CONFIG: { status: DeliverableStatus; label: string; color: string }[] = [
  { status: '待编制', label: '待编制', color: '#9ca3af' },
  { status: '编制中', label: '编制中', color: '#2563eb' },
  { status: '待审核', label: '待审核', color: '#d97706' },
  { status: '待签字', label: '待签字', color: '#7c3aed' },
  { status: '已归档', label: '已归档', color: '#16a34a' },
]

const DEPARTMENTS = ['客户质量部', '测试一部', '测试二部', '项目级']

const DEPT_SHORT: Record<string, string> = {
  '客户质量部': '客质部',
  '测试一部': '测试一',
  '测试二部': '测试二',
  '项目级': '项目级',
}

export default function DepartmentProgress() {
  const { deliverables } = useData()

  const data = DEPARTMENTS.map((dept) => {
    const deptDeliverables = deliverables.filter(d => d.department === dept)
    const row: Record<string, string | number> = { name: DEPT_SHORT[dept] ?? dept }
    for (const { status, label } of STATUS_CONFIG) {
      row[label] = deptDeliverables.filter(d => d.status === status).length
    }
    row['total'] = deptDeliverables.length
    return row
  })

  return (
    <div className="min-h-[300px] rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-gray-900">
        部门交付进度
      </h2>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 20, bottom: 0, left: 10 }}
            barSize={22}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={50}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.04)' }}
              contentStyle={{
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                fontSize: 12,
              }}
              formatter={(value, name) => [`${value} 项`, String(name)]}
            />
            {STATUS_CONFIG.map(({ label, color }) => (
              <Bar
                key={label}
                dataKey={label}
                stackId="stack"
                fill={color}
                radius={0}
              />
            ))}
            <Legend
              verticalAlign="bottom"
              align="center"
              iconType="circle"
              iconSize={8}
              formatter={(value: string) => (
                <span style={{ color: '#6b7280', fontSize: 11 }}>{value}</span>
              )}
              wrapperStyle={{ paddingTop: 8 }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
