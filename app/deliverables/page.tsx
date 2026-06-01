'use client'

import { useState, useMemo } from 'react'
import { LayoutGrid, List, ChevronDown } from 'lucide-react'
import Header from '@/components/layout/Header'
import DeliverablePipeline from '@/components/deliverables/DeliverablePipeline'
import DeliverableList from '@/components/deliverables/DeliverableList'
import { deliverables, getDeliverablesByStatus } from '@/lib/store'
import type { DeliverableStatus } from '@/lib/types'

type ViewMode = 'pipeline' | 'list'

const DEPARTMENTS = ['全部', '客户质量部', '测试一部', '测试二部', '项目级'] as const
const TEMPLATE_TYPES = ['全部', 'T01-业务调研表', 'T02-蓝图设计', 'T03-数据工程报告', 'T07-缺陷跟踪', 'T08-变更登记', 'T09-培训计划', '项目级'] as const

const STATUS_BADGES: { status: DeliverableStatus; label: string; bg: string; text: string; dot: string }[] = [
  { status: '待编制', label: '待编制', bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' },
  { status: '编制中', label: '编制中', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  { status: '待审核', label: '待审核', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  { status: '待签字', label: '待签字', bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  { status: '已归档', label: '已归档', bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
]

function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: readonly string[]
  onChange: (v: string) => void
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-1.5 text-sm bg-white border border-gray-200 rounded-lg text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
      >
        {options.map(opt => (
          <option key={opt} value={opt}>
            {opt === '全部' ? `${label}: 全部` : opt}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  )
}

export default function DeliverablesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('pipeline')
  const [deptFilter, setDeptFilter] = useState('全部')
  const [templateFilter, setTemplateFilter] = useState('全部')

  const filteredDeliverables = useMemo(() => {
    return deliverables.filter(d => {
      if (deptFilter !== '全部' && d.department !== deptFilter) return false
      if (templateFilter !== '全部' && d.templateType !== templateFilter) return false
      return true
    })
  }, [deptFilter, templateFilter])

  const statusCounts = useMemo(() => {
    const counts: Record<DeliverableStatus, number> = {
      '待编制': 0, '编制中': 0, '待审核': 0, '待签字': 0, '已归档': 0,
    }
    for (const d of filteredDeliverables) {
      counts[d.status]++
    }
    return counts
  }, [filteredDeliverables])

  const headerActions = (
    <div className="flex items-center gap-2">
      <FilterDropdown label="部门" value={deptFilter} options={DEPARTMENTS} onChange={setDeptFilter} />
      <FilterDropdown label="模板" value={templateFilter} options={TEMPLATE_TYPES} onChange={setTemplateFilter} />
      <div className="w-px h-6 bg-gray-200 mx-1" />
      <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
        <button
          onClick={() => setViewMode('pipeline')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            viewMode === 'pipeline'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <LayoutGrid size={14} />
          流水线
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            viewMode === 'list'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <List size={14} />
          列表
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="交付物管理"
        subtitle={`共 ${filteredDeliverables.length} 项交付物`}
        actions={headerActions}
      />

      {/* Stats bar */}
      <div className="flex items-center gap-3 px-6 py-3 bg-white border-b border-gray-100">
        {STATUS_BADGES.map(({ status, label, bg, text, dot }) => (
          <div
            key={status}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${bg}`}
          >
            <span className={`w-2 h-2 rounded-full ${dot}`} />
            <span className={`text-sm font-medium ${text}`}>{label}</span>
            <span className={`text-sm font-bold ${text}`}>{statusCounts[status]}</span>
          </div>
        ))}
        <div className="ml-auto text-xs text-gray-400">
          合计 {filteredDeliverables.length} 项
        </div>
      </div>

      {/* View content */}
      {viewMode === 'pipeline' ? (
        <DeliverablePipeline filteredDeliverables={filteredDeliverables} />
      ) : (
        <DeliverableList filteredDeliverables={filteredDeliverables} />
      )}
    </div>
  )
}
