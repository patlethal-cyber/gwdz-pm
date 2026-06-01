'use client'

import { useState } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { getMember } from '@/lib/store'
import type { Deliverable, DeliverableStatus } from '@/lib/types'

const STATUS_STYLE: Record<DeliverableStatus, { bg: string; text: string; dot: string }> = {
  '待编制': { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' },
  '编制中': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  '待审核': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  '待签字': { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  '已归档': { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
}

type SortField = 'name' | 'code' | 'scenarioCode' | 'department' | 'status' | 'version' | 'ownerId' | 'dueDate'
type SortDir = 'asc' | 'desc'

interface DeliverableListProps {
  filteredDeliverables: Deliverable[]
}

const STATUS_ORDER: DeliverableStatus[] = ['待编制', '编制中', '待审核', '待签字', '已归档']

export default function DeliverableList({ filteredDeliverables }: DeliverableListProps) {
  const [sortField, setSortField] = useState<SortField>('code')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const sorted = [...filteredDeliverables].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    if (sortField === 'status') {
      return (STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)) * dir
    }
    const av = (a[sortField] ?? '') as string
    const bv = (b[sortField] ?? '') as string
    return av.localeCompare(bv, 'zh-CN') * dir
  })

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown size={12} className="text-gray-300 ml-1" />
    return sortDir === 'asc'
      ? <ArrowUp size={12} className="text-blue-500 ml-1" />
      : <ArrowDown size={12} className="text-blue-500 ml-1" />
  }

  const columns: { key: SortField; label: string; className: string }[] = [
    { key: 'name', label: '名称', className: 'min-w-[200px]' },
    { key: 'code', label: '模板编号', className: 'w-[100px]' },
    { key: 'scenarioCode', label: '场景', className: 'w-[80px]' },
    { key: 'department', label: '部门', className: 'w-[110px]' },
    { key: 'status', label: '状态', className: 'w-[100px]' },
    { key: 'version', label: '版本', className: 'w-[80px]' },
    { key: 'ownerId', label: '负责人', className: 'w-[110px]' },
    { key: 'dueDate', label: '截止日期', className: 'w-[110px]' },
  ]

  return (
    <div className="px-6 pt-4 pb-4 flex-1 overflow-auto">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left font-medium text-gray-500 select-none cursor-pointer hover:text-gray-700 hover:bg-gray-100/60 transition-colors ${col.className}`}
                  onClick={() => handleSort(col.key)}
                >
                  <div className="flex items-center">
                    {col.label}
                    <SortIcon field={col.key} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                  没有匹配的交付物
                </td>
              </tr>
            ) : (
              sorted.map((d, idx) => {
                const owner = getMember(d.ownerId)
                const style = STATUS_STYLE[d.status]
                const isOverdue = d.status !== '已归档' && d.dueDate < '2026-05-31'
                return (
                  <tr
                    key={d.id}
                    className={`border-b border-gray-50 hover:bg-blue-50/30 transition-colors cursor-pointer ${idx % 2 === 1 ? 'bg-gray-50/40' : ''}`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{d.name}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{d.code}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {d.scenarioCode ? (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">{d.scenarioCode}</span>
                      ) : (
                        <span className="text-xs text-gray-400">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{d.department}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs font-mono">{d.version || '--'}</td>
                    <td className="px-4 py-3">
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
                        <span className="text-xs text-gray-400">--</span>
                      )}
                    </td>
                    <td className={`px-4 py-3 text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                      {d.dueDate}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
