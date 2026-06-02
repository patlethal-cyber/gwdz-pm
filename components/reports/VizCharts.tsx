'use client'

// 可视化周报图表 —— 单独成 client 组件，供 reports 页用 next/dynamic(ssr:false) 懒加载，
// 把 recharts 体积从首屏 bundle 拆出（E）。
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

const SEVERITY_COLORS: Record<string, string> = {
  '严重': '#ef4444',
  '一般': '#f59e0b',
  '轻微': '#3b82f6',
  '建议': '#6b7280',
}

interface VizChartsProps {
  scenarioProgressData: { name: string; progress: number; total: number; done: number }[]
  severityPieData: { name: string; value: number }[]
  weekTaskData: { name: string; count: number }[]
  milestoneData: { code: string; name: string; date: string; status: string; value: number }[]
  today: string
}

export default function VizCharts({
  scenarioProgressData,
  severityPieData,
  weekTaskData,
  milestoneData,
  today,
}: VizChartsProps) {
  return (
    <div className="space-y-6">
      {/* Scenario progress bars */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">场景进度概览</h2>
        <div className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scenarioProgressData} layout="vertical" margin={{ left: 10, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="name" width={40} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: unknown, _name: unknown, props: unknown) => {
                  const p = props as { payload?: { done?: number; total?: number } }
                  const done = p?.payload?.done ?? 0
                  const total = p?.payload?.total ?? 0
                  return [`${value}% (${done}/${total})`, '完成率']
                }}
              />
              <Bar dataKey="progress" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Issue severity pie */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">未关闭问题严重程度分布</h2>
          {severityPieData.length === 0 ? (
            <div className="h-[240px] flex items-center justify-center text-sm text-gray-500">
              暂无未关闭问题
            </div>
          ) : (
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }: { name?: string; value?: number }) => `${name ?? ''}: ${value ?? ''}`}
                  >
                    {severityPieData.map((entry, idx) => (
                      <Cell key={idx} fill={SEVERITY_COLORS[entry.name] || '#6b7280'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Week task stats */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">本周任务统计</h2>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekTaskData} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
                  {weekTaskData.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={
                        entry.name === '已完成' ? '#22c55e' :
                        entry.name === '进行中' ? '#3b82f6' :
                        entry.name === '逾期' ? '#ef4444' : '#8b5cf6'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Milestone timeline */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">里程碑进度</h2>
        <div className="flex items-start gap-0 overflow-x-auto pb-2">
          {milestoneData.map((m, idx) => {
            const statusColor = m.status === '已完成' ? 'bg-green-500' :
              m.status === '进行中' ? 'bg-blue-500' : 'bg-gray-300'
            const textColor = m.status === '已完成' ? 'text-green-700' :
              m.status === '进行中' ? 'text-blue-700' : 'text-gray-500'
            const isPast = m.date <= today

            return (
              <div key={m.code} className="flex items-start flex-1 min-w-[120px]">
                <div className="flex flex-col items-center">
                  <div className={`w-4 h-4 rounded-full ${statusColor} flex-shrink-0 z-10`} />
                  {idx < milestoneData.length - 1 && (
                    <div className={`w-full h-0.5 mt-[-8px] ${isPast ? 'bg-green-300' : 'bg-gray-200'}`} />
                  )}
                  <div className="mt-2 text-center px-1">
                    <div className={`text-xs font-semibold ${textColor}`}>{m.name}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{m.code}</div>
                    <div className="text-[10px] text-gray-500">{m.date}</div>
                    <div className={`text-[10px] font-medium mt-1 ${textColor}`}>{m.status}</div>
                  </div>
                </div>
                {idx < milestoneData.length - 1 && (
                  <div className={`flex-1 h-0.5 mt-[7px] ${isPast ? 'bg-green-300' : 'bg-gray-200'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
