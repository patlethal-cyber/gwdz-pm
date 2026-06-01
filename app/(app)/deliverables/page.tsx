'use client'

import { useState, useMemo, useEffect } from 'react'
import { LayoutGrid, List, ChevronDown, FolderOpen } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/layout/Header'
import DeliverablePipeline from '@/components/deliverables/DeliverablePipeline'
import DeliverableList from '@/components/deliverables/DeliverableList'
import DeliverableModal from '@/components/deliverables/DeliverableModal'
import { useData } from '@/lib/data-context'
import type { Deliverable, DeliverableStatus } from '@/lib/types'

type ViewMode = 'category' | 'pipeline'

const DEPARTMENTS = ['全部', '客户质量部', '测试一部', '测试二部', '项目级'] as const

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
  const { deliverables, updateDeliverable, getDeliverablesByCategory, ready } = useData()
  const searchParams = useSearchParams()

  const [viewMode, setViewMode] = useState<ViewMode>('category')
  const [deptFilter, setDeptFilter] = useState('全部')
  const [codeFilter, setCodeFilter] = useState('全部')
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Read ?status= from URL for dashboard drill-down
  const urlStatus = searchParams.get('status') as DeliverableStatus | null

  // Build unique code/category options from deliverables
  const codeOptions = useMemo(() => {
    const codes = new Set<string>()
    for (const d of deliverables) {
      codes.add(d.code)
    }
    return ['全部', ...Array.from(codes).sort()]
  }, [deliverables])

  const filteredDeliverables = useMemo(() => {
    return deliverables.filter(d => {
      if (deptFilter !== '全部' && d.department !== deptFilter) return false
      if (codeFilter !== '全部' && d.code !== codeFilter) return false
      if (urlStatus && d.status !== urlStatus) return false
      return true
    })
  }, [deliverables, deptFilter, codeFilter, urlStatus])

  const statusCounts = useMemo(() => {
    const counts: Record<DeliverableStatus, number> = {
      '待编制': 0, '编制中': 0, '待审核': 0, '待签字': 0, '已归档': 0,
    }
    for (const d of filteredDeliverables) {
      counts[d.status]++
    }
    return counts
  }, [filteredDeliverables])

  // Category-grouped data for category view
  const categoryGrouped = useMemo(() => {
    const cats: Record<string, Deliverable[]> = {}
    for (const d of filteredDeliverables) {
      const cat = d.category
      if (!cats[cat]) cats[cat] = []
      cats[cat].push(d)
    }
    return cats
  }, [filteredDeliverables])

  function handleSelect(d: Deliverable) {
    setSelectedDeliverable(d)
    setModalOpen(true)
  }

  function handleModalClose() {
    setModalOpen(false)
    setSelectedDeliverable(null)
  }

  function handleModalSave(updates: Partial<Deliverable>) {
    if (selectedDeliverable) {
      updateDeliverable(selectedDeliverable.id, updates)
    }
    handleModalClose()
  }

  if (!ready) {
    return (
      <div className="flex flex-col h-screen">
        <div className="h-16 border-b border-gray-200 bg-white" />
        <div className="flex-1 p-6 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
              <div className="space-y-2">
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const headerActions = (
    <div className="flex items-center gap-2">
      <FilterDropdown label="部门" value={deptFilter} options={DEPARTMENTS} onChange={setDeptFilter} />
      <FilterDropdown label="编号" value={codeFilter} options={codeOptions} onChange={setCodeFilter} />
      {urlStatus && (
        <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium">
          筛选: {urlStatus}
          <button
            onClick={() => window.history.replaceState(null, '', '/deliverables')}
            className="ml-1 text-blue-400 hover:text-blue-600"
          >
            &times;
          </button>
        </span>
      )}
      <div className="w-px h-6 bg-gray-200 mx-1" />
      <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
        <button
          onClick={() => setViewMode('category')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            viewMode === 'category'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FolderOpen size={14} />
          按分类
        </button>
        <button
          onClick={() => setViewMode('pipeline')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            viewMode === 'pipeline'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <LayoutGrid size={14} />
          按状态
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
          共 {filteredDeliverables.length} 项
        </div>
      </div>

      {/* View content */}
      {viewMode === 'category' ? (
        <DeliverableList
          deliverables={filteredDeliverables}
          categoryGrouped={categoryGrouped}
          onSelect={handleSelect}
        />
      ) : (
        <DeliverablePipeline filteredDeliverables={filteredDeliverables} onSelect={handleSelect} />
      )}

      {/* Modal */}
      <DeliverableModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        deliverable={selectedDeliverable ?? undefined}
        onSave={handleModalSave}
      />
    </div>
  )
}
