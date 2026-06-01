'use client'

import { ChevronRight } from 'lucide-react'
import { useData } from '@/lib/data-context'
import type { Deliverable, DeliverableStatus } from '@/lib/types'

const STATUS_COLUMNS: {
  status: DeliverableStatus
  label: string
  headerBg: string
  headerText: string
  colBg: string
  dotColor: string
}[] = [
  { status: '待编制', label: '待编制', headerBg: 'bg-gray-100', headerText: 'text-gray-700', colBg: 'bg-gray-50/50', dotColor: 'bg-gray-400' },
  { status: '编制中', label: '编制中', headerBg: 'bg-blue-100', headerText: 'text-blue-700', colBg: 'bg-blue-50/30', dotColor: 'bg-blue-500' },
  { status: '待审核', label: '待审核', headerBg: 'bg-amber-100', headerText: 'text-amber-700', colBg: 'bg-amber-50/30', dotColor: 'bg-amber-500' },
  { status: '待签字', label: '待签字', headerBg: 'bg-purple-100', headerText: 'text-purple-700', colBg: 'bg-purple-50/30', dotColor: 'bg-purple-500' },
  { status: '已归档', label: '已归档', headerBg: 'bg-green-100', headerText: 'text-green-700', colBg: 'bg-green-50/30', dotColor: 'bg-green-500' },
]

interface DeliverablePipelineProps {
  filteredDeliverables: Deliverable[]
  onSelect: (d: Deliverable) => void
}

function DeliverableCard({ d, onSelect }: { d: Deliverable; onSelect: (d: Deliverable) => void }) {
  const { getMember } = useData()
  const owner = getMember(d.ownerId)
  const updatedDate = d.updatedAt ? new Date(d.updatedAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) : ''

  return (
    <div
      onClick={() => onSelect(d)}
      className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium text-gray-900 leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">
          {d.name}
        </h4>
      </div>
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-medium bg-gray-100 text-gray-600">
          {d.code}
        </span>
        {d.scenarioCode && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-600">
            {d.scenarioCode}
          </span>
        )}
        {d.version && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-500">
            {d.version}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {owner && (
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-medium shrink-0"
              style={{ backgroundColor: owner.color }}
              title={owner.name}
            >
              {owner.initials[0]}
            </div>
          )}
          <span className="text-xs text-gray-400">{owner?.name}</span>
        </div>
        {updatedDate && (
          <span className="text-xs text-gray-400">{updatedDate}</span>
        )}
      </div>
    </div>
  )
}

export default function DeliverablePipeline({ filteredDeliverables, onSelect }: DeliverablePipelineProps) {
  return (
    <div className="flex gap-0 overflow-x-auto pb-4 px-6 pt-4 min-h-0 flex-1">
      {STATUS_COLUMNS.map((col, idx) => {
        const items = filteredDeliverables.filter(d => d.status === col.status)
        return (
          <div key={col.status} className="flex items-stretch">
            <div className={`flex flex-col min-w-[260px] max-w-[280px] rounded-xl ${col.colBg}`}>
              {/* Column header */}
              <div className={`flex items-center justify-between px-3 py-2.5 rounded-t-xl ${col.headerBg}`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                  <span className={`text-sm font-semibold ${col.headerText}`}>{col.label}</span>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${col.headerBg} ${col.headerText}`}>
                  {items.length}
                </span>
              </div>
              {/* Card list */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[calc(100vh-260px)]">
                {items.length === 0 ? (
                  <div className="text-center py-8 text-sm text-gray-400">
                    暂无交付物
                  </div>
                ) : (
                  items.map(d => <DeliverableCard key={d.id} d={d} onSelect={onSelect} />)
                )}
              </div>
            </div>
            {/* Arrow between columns */}
            {idx < STATUS_COLUMNS.length - 1 && (
              <div className="flex items-center justify-center w-6 shrink-0">
                <ChevronRight size={18} className="text-gray-300" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
