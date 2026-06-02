'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useData } from '@/lib/data-context'
import { ListChecks, AlertCircle, Info } from 'lucide-react'

// ===== Date utilities (string-only, no Date constructor) =====

function parseDate(s: string) {
  const [y, m, d] = s.split('-').map(Number)
  return { year: y, month: m, day: d }
}

function dateToDays(s: string): number {
  const { year, month, day } = parseDate(s)
  const monthDays = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  let total = 0
  for (let m = 1; m < month; m++) total += monthDays[m]
  total += day
  total += (year - 2026) * 365
  return total
}

const GANTT_START = '2026-05-01'
const GANTT_END = '2026-08-15'
const GANTT_START_DAYS = dateToDays(GANTT_START)
const GANTT_END_DAYS = dateToDays(GANTT_END)
const TOTAL_DAYS = GANTT_END_DAYS - GANTT_START_DAYS

function dayOffset(dateStr: string): number {
  return dateToDays(dateStr) - GANTT_START_DAYS
}

function pct(days: number): number {
  return Math.max(0, Math.min(100, (days / TOTAL_DAYS) * 100))
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + '...' : s
}

// ===== Constants =====

const BATCH_COLORS: Record<string, { bg: string; fill: string; border: string; label: string }> = {
  '一批':       { bg: '#ede9fe', fill: '#7c3aed', border: '#a78bfa', label: '一批' },
  '二批':       { bg: '#fce7f3', fill: '#db2777', border: '#f472b6', label: '二批' },
}

const READINESS: Record<string, { color: string; label: string }> = {
  green: { color: '#16a34a', label: '就绪' },
  amber: { color: '#d97706', label: '不足' },
  red:   { color: '#dc2626', label: '缺失' },
}

const DEPT_BADGE: Record<string, { bg: string; text: string; short: string }> = {
  '客户质量部': { bg: '#dbeafe', text: '#1e40af', short: '客质' },
  '测试一部':  { bg: '#dcfce7', text: '#166534', short: '测一' },
  '测试二部':  { bg: '#fef3c7', text: '#92400e', short: '测二' },
}

const MILESTONES = [
  { code: 'M4', date: '2026-06-18', label: 'M4 一批UAT' },
  { code: 'M5', date: '2026-06-30', label: 'M5 二批UAT' },
  { code: 'M6', date: '2026-07-15', label: 'M6 初验' },
  { code: 'M7', date: '2026-08-14', label: 'M7 终验' },
]

const MONTH_DEFS = [
  { label: '5月', start: '2026-05-01', end: '2026-05-31' },
  { label: '6月', start: '2026-06-01', end: '2026-06-30' },
  { label: '7月', start: '2026-07-01', end: '2026-07-31' },
  { label: '8月', start: '2026-08-01', end: '2026-08-15' },
]

const STATUS_WEIGHTS: Record<string, number> = {
  '待编制': 0,
  '编制中': 0.25,
  '待审核': 0.5,
  '待签字': 0.75,
  '已归档': 1,
}

const BATCH_ORDER: Record<string, number> = { '一批': 0, '二批': 1 }

const LABEL_WIDTH = 250
const RIGHT_INFO_WIDTH = 110

export default function GanttChart() {
  const {
    scenarios, deliverables, getMember, today, ready,
    getTasksByScenario, getIssuesByScenario, getDeliverablesByScenario,
  } = useData()

  const router = useRouter()
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  // Compute month labels
  const monthLabels = useMemo(() => MONTH_DEFS.map(m => {
    const s = Math.max(0, dayOffset(m.start))
    const e = Math.min(TOTAL_DAYS, dayOffset(m.end))
    return { label: m.label, startPct: pct(s), widthPct: pct(e - s) }
  }), [])

  // Today line position
  const todayPct = useMemo(() => pct(dayOffset(today)), [today])

  // Sort: batch 1 first, then batch 2, then TBD; within batch by startDate
  const sortedScenarios = useMemo(() => [...scenarios].sort((a, b) => {
    const ba = BATCH_ORDER[a.batch] ?? 3
    const bb = BATCH_ORDER[b.batch] ?? 3
    if (ba !== bb) return ba - bb
    return a.startDate < b.startDate ? -1 : a.startDate > b.startDate ? 1 : 0
  }), [scenarios])

  // Per-scenario metrics
  const scenarioMetrics = useMemo(() => {
    const map: Record<string, {
      progress: number; taskCount: number; issueCount: number;
      totalDel: number; archivedDel: number
    }> = {}
    for (const sc of scenarios) {
      const dels = getDeliverablesByScenario(sc.id)
      const archived = dels.filter(d => d.status === '已归档').length
      const tasks = getTasksByScenario(sc.id)
      const issues = getIssuesByScenario(sc.id)
      map[sc.id] = {
        progress: dels.length > 0 ? dels.reduce((sum, d) => sum + (STATUS_WEIGHTS[d.status] ?? 0), 0) / dels.length : 0,
        taskCount: tasks.length,
        issueCount: issues.length,
        totalDel: dels.length,
        archivedDel: archived,
      }
    }
    return map
  }, [scenarios, deliverables, getDeliverablesByScenario, getTasksByScenario, getIssuesByScenario])

  if (!ready) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="h-6 w-32 animate-pulse rounded bg-gray-200 mb-4" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 mb-3">
            <div className="h-5 w-48 animate-pulse rounded bg-gray-100" />
            <div className="h-5 flex-1 animate-pulse rounded bg-gray-100" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-gray-900">
          场景甘特图
        </h2>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Info size={12} />
          <span>悬停查看详情</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: 900 }}>

          {/* ===== Header: months + milestones ===== */}
          <div className="flex">
            <div style={{ width: LABEL_WIDTH, flexShrink: 0 }} />
            <div className="relative flex-1" style={{ marginRight: RIGHT_INFO_WIDTH }}>
              {/* Milestone labels at top */}
              <div className="relative h-5 mb-0.5">
                {MILESTONES.map(ms => {
                  const x = pct(dayOffset(ms.date))
                  return (
                    <div
                      key={ms.code}
                      className="absolute text-[10px] font-medium text-gray-500 whitespace-nowrap"
                      style={{ left: `${x}%`, transform: 'translateX(-50%)' }}
                    >
                      {ms.label}
                    </div>
                  )
                })}
              </div>
              {/* Month headers */}
              <div className="relative h-7 border-b border-gray-200">
                {monthLabels.map(m => (
                  <div
                    key={m.label}
                    className="absolute top-0 h-full flex items-center border-l border-gray-200 px-2 text-xs font-medium text-gray-500"
                    style={{ left: `${m.startPct}%`, width: `${m.widthPct}%` }}
                  >
                    {m.label}
                  </div>
                ))}
              </div>
            </div>
            {/* Right column header */}
            <div
              style={{ width: RIGHT_INFO_WIDTH, flexShrink: 0 }}
              className="flex items-end justify-center pb-1 border-b border-gray-200 text-[10px] text-gray-500"
            >
              任务 / 问题
            </div>
          </div>

          {/* ===== Rows ===== */}
          <div className="relative">
            {sortedScenarios.map((sc, idx) => {
              const barStartPct = pct(dayOffset(sc.startDate))
              const barEndPct = pct(dayOffset(sc.endDate))
              const barWidthPct = barEndPct - barStartPct
              const metrics = scenarioMetrics[sc.id] || { progress: 0, taskCount: 0, issueCount: 0, totalDel: 0, archivedDel: 0 }
              const batchStyle = BATCH_COLORS[sc.batch] || BATCH_COLORS['待定']
              const readiness = READINESS[sc.dataReadiness] || READINESS.green
              const dept = DEPT_BADGE[sc.department] || { bg: '#f3f4f6', text: '#374151', short: '其他' }
              const owner = getMember(sc.ownerId)
              const isHovered = hoveredRow === sc.id
              const progressPct = Math.round(metrics.progress * 100)

              return (
                <div
                  key={sc.id}
                  className="flex items-center transition-colors cursor-pointer"
                  style={{
                    height: 44,
                    backgroundColor: isHovered ? '#f8fafc' : idx % 2 === 0 ? '#fafafa' : 'transparent',
                  }}
                  onMouseEnter={() => setHoveredRow(sc.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  {/* ===== Left label (250px) ===== */}
                  <div
                    style={{ width: LABEL_WIDTH, flexShrink: 0 }}
                    className="flex items-center gap-1.5 px-2 overflow-hidden cursor-pointer group/label"
                    onClick={() => router.push(`/scenarios/${sc.id}`)}
                  >
                    {/* Data readiness dot */}
                    <span
                      className="inline-block h-2 w-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: readiness.color }}
                      title={`数据: ${readiness.label}`}
                    />

                    {/* Owner avatar */}
                    {owner && (
                      <span
                        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: owner.color }}
                        title={owner.name}
                      >
                        {owner.initials}
                      </span>
                    )}

                    {/* Scenario code */}
                    <span className="text-xs font-semibold text-gray-700 flex-shrink-0 group-hover/label:text-blue-600 transition-colors">
                      {sc.code}
                    </span>

                    {/* Scenario name (truncated) */}
                    <span className="text-xs text-gray-500 truncate group-hover/label:text-blue-600 transition-colors" title={sc.name}>
                      {truncate(sc.name, 8)}
                    </span>

                    {/* Department badge */}
                    <span
                      className="inline-block rounded px-1 py-0.5 text-[9px] font-medium flex-shrink-0 leading-none"
                      style={{ backgroundColor: dept.bg, color: dept.text }}
                    >
                      {dept.short}
                    </span>
                  </div>

                  {/* ===== Bar area ===== */}
                  <div className="relative flex-1 h-full flex items-center" style={{ marginRight: 0 }}>
                    {/* Month grid lines */}
                    {monthLabels.map(m => (
                      <div
                        key={m.label}
                        className="absolute top-0 h-full border-l border-gray-100"
                        style={{ left: `${m.startPct}%` }}
                      />
                    ))}

                    {/* Milestone vertical dotted lines */}
                    {MILESTONES.map(ms => {
                      const x = pct(dayOffset(ms.date))
                      return (
                        <div
                          key={ms.code}
                          className="absolute top-0 h-full"
                          style={{
                            left: `${x}%`,
                            borderLeft: '1px dotted #d1d5db',
                          }}
                        />
                      )
                    })}

                    {/* Today line */}
                    <div
                      className="absolute top-0 h-full z-10"
                      style={{
                        left: `${todayPct}%`,
                        borderLeft: '2px dashed #ef4444',
                      }}
                    />

                    {/* Bar background (full duration, light) */}
                    <div
                      className="absolute rounded-md"
                      style={{
                        left: `${barStartPct}%`,
                        width: `${barWidthPct}%`,
                        height: 22,
                        backgroundColor: batchStyle.bg,
                        border: `1px solid ${batchStyle.border}`,
                      }}
                    />

                    {/* Bar fill (progress) */}
                    {metrics.progress > 0 && (
                      <div
                        className="absolute rounded-l-md transition-all"
                        style={{
                          left: `${barStartPct}%`,
                          width: `${barWidthPct * metrics.progress}%`,
                          height: 22,
                          backgroundColor: batchStyle.fill,
                          opacity: 0.75,
                          borderTopLeftRadius: 6,
                          borderBottomLeftRadius: 6,
                          borderTopRightRadius: metrics.progress >= 0.98 ? 6 : 0,
                          borderBottomRightRadius: metrics.progress >= 0.98 ? 6 : 0,
                        }}
                      />
                    )}

                    {/* Progress text on bar */}
                    {barWidthPct > 8 && (
                      <div
                        className="absolute flex items-center justify-center text-[10px] font-semibold z-10 pointer-events-none"
                        style={{
                          left: `${barStartPct}%`,
                          width: `${barWidthPct}%`,
                          height: 22,
                          color: metrics.progress > 0.3 ? '#ffffff' : batchStyle.fill,
                        }}
                      >
                        {progressPct}%
                      </div>
                    )}

                    {/* Hover tooltip */}
                    {isHovered && (
                      <div
                        className="absolute z-30 rounded-lg border border-gray-200 bg-white p-3 shadow-lg text-xs"
                        style={{
                          left: `${Math.min(barStartPct + barWidthPct / 2, 70)}%`,
                          top: -70,
                          minWidth: 200,
                          transform: 'translateX(-50%)',
                        }}
                      >
                        <div className="font-semibold text-gray-800 mb-1">
                          {sc.code} {sc.name}
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-gray-500">
                          <span>开始:</span>
                          <span className="font-medium text-gray-700">{sc.startDate}</span>
                          <span>结束:</span>
                          <span className="font-medium text-gray-700">{sc.endDate}</span>
                          <span>负责人:</span>
                          <span className="font-medium text-gray-700">{owner?.name || '-'}</span>
                          <span>进度:</span>
                          <span className="font-medium text-gray-700">
                            {progressPct}% ({metrics.archivedDel}/{metrics.totalDel})
                          </span>
                          <span>批次:</span>
                          <span className="font-medium text-gray-700">{sc.batch}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ===== Right info badges ===== */}
                  <div
                    style={{ width: RIGHT_INFO_WIDTH, flexShrink: 0 }}
                    className="flex items-center justify-center gap-2 px-2"
                  >
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
                      <ListChecks size={10} />
                      {metrics.taskCount}
                    </span>
                    <span
                      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                        metrics.issueCount > 0
                          ? 'bg-red-50 text-red-600'
                          : 'bg-gray-50 text-gray-500'
                      }`}
                    >
                      <AlertCircle size={10} />
                      {metrics.issueCount}
                    </span>
                  </div>
                </div>
              )
            })}

            {/* Today label at top of chart area (drawn once, outside rows) */}
          </div>

          {/* ===== Today label below chart ===== */}
          <div className="flex mt-1">
            <div style={{ width: LABEL_WIDTH, flexShrink: 0 }} />
            <div className="relative flex-1" style={{ marginRight: RIGHT_INFO_WIDTH }}>
              <div
                className="absolute text-[10px] font-medium text-red-500 whitespace-nowrap"
                style={{ left: `${todayPct}%`, transform: 'translateX(-50%)' }}
              >
                今天 {today}
              </div>
            </div>
          </div>

          {/* ===== Legend ===== */}
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-gray-100 pt-3">
            <span className="text-[11px] font-medium text-gray-500 mr-1">批次:</span>
            {Object.entries(BATCH_COLORS)
              .filter(([k]) => k !== '二批（提前）')
              .map(([key, val]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-3 w-6 rounded-sm"
                    style={{ backgroundColor: val.fill, opacity: 0.75 }}
                  />
                  <span className="text-[11px] text-gray-500">{val.label}</span>
                </div>
              ))}
            <span className="ml-3 text-[11px] font-medium text-gray-500 mr-1">数据就绪:</span>
            {Object.entries(READINESS).map(([key, val]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: val.color }}
                />
                <span className="text-[11px] text-gray-500">{val.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 ml-3">
              <span className="inline-block w-4 border-t-2 border-dashed border-red-400" />
              <span className="text-[11px] text-gray-500">今天</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-4 border-t border-dotted border-gray-400" />
              <span className="text-[11px] text-gray-500">里程碑</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
