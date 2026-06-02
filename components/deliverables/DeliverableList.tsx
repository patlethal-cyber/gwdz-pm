'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useData } from '@/lib/data-context'
import type { Deliverable, DeliverableStatus } from '@/lib/types'

const STATUS_STYLE: Record<DeliverableStatus, { bg: string; text: string; dot: string }> = {
  '待编制': { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' },
  '编制中': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  '待审核': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  '待签字': { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  '已归档': { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
}

// Ordered category keys for display
const CATEGORY_ORDER = [
  '业务调研表',
  '蓝图设计文档',
  '数据工程实施报告',
  '智能体操作手册',
  'UAT反馈报告',
  '智能体验收确认表',
  '缺陷记录和跟踪文档',
  '需求变更登记表',
  '培训计划',
  '培训签到表',
  '项目日报',
  '项目周报',
  '项目级文档',
]

interface DeliverableListProps {
  deliverables: Deliverable[]
  categoryGrouped: Record<string, Deliverable[]>
  onSelect: (d: Deliverable) => void
}

export default function DeliverableList({ deliverables, categoryGrouped, onSelect }: DeliverableListProps) {
  const { getMember, today } = useData()

  // All categories expanded by default
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  function toggleCategory(cat: string) {
    setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }))
  }

  // Sort categories: known order first, then any unknown alphabetically
  const sortedCategories = Object.keys(categoryGrouped).sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a)
    const ib = CATEGORY_ORDER.indexOf(b)
    if (ia === -1 && ib === -1) return a.localeCompare(b, 'zh-CN')
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })

  // Category code prefix mapping
  function getCategoryCode(cat: string): string {
    const first = categoryGrouped[cat]?.[0]
    return first?.code || ''
  }

  if (sortedCategories.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-gray-500">没有匹配的交付物</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
      {sortedCategories.map(cat => {
        const items = categoryGrouped[cat]
        const isCollapsed = collapsed[cat]
        const code = getCategoryCode(cat)

        return (
          <div key={cat} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Category header */}
            <button
              onClick={() => toggleCategory(cat)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className={`transition-transform ${isCollapsed ? '' : 'rotate-90'}`}>
                <ChevronRight size={16} className="text-gray-500" />
              </div>
              {code && (
                <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 shrink-0">
                  {code}
                </span>
              )}
              <span className="text-sm font-semibold text-gray-900">{cat}</span>
              <span className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {items.length}
              </span>
            </button>

            {/* Table content */}
            {!isCollapsed && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t border-gray-100 bg-gray-50/80">
                    <th className="px-4 py-2 text-left font-medium text-gray-500 min-w-[200px]">名称</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500 w-[80px]">场景</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500 w-[100px]">状态</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500 w-[80px]">版本</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500 w-[110px]">负责人</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500 w-[110px]">截止日期</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((d, idx) => {
                    const owner = getMember(d.ownerId)
                    const style = STATUS_STYLE[d.status]
                    const isOverdue = d.status !== '已归档' && d.dueDate < today

                    return (
                      <tr
                        key={d.id}
                        onClick={() => onSelect(d)}
                        className={`border-t border-gray-50 hover:bg-blue-50/30 transition-colors cursor-pointer ${
                          idx % 2 === 1 ? 'bg-gray-50/40' : ''
                        }`}
                      >
                        <td className="px-4 py-2.5 font-medium text-gray-900">{d.name}</td>
                        <td className="px-4 py-2.5">
                          {d.scenarioCode ? (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">
                              {d.scenarioCode}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">--</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                            {d.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs font-mono">
                          {d.currentVersion || '--'}
                        </td>
                        <td className="px-4 py-2.5">
                          {owner ? (
                            <div className="flex items-center gap-1.5">
                              <div
                                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-medium shrink-0"
                                style={{ backgroundColor: owner.color }}
                              >
                                {owner.initials[0]}
                              </div>
                              <span className="text-xs text-gray-600">{owner.name}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">--</span>
                          )}
                        </td>
                        <td className={`px-4 py-2.5 text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                          {d.dueDate}
                          {isOverdue && <span className="ml-1 text-red-400">!</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )
      })}
    </div>
  )
}
