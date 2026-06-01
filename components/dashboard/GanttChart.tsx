'use client'

import { scenarios, deliverables } from '@/lib/store'

const GANTT_START = new Date('2026-05-01')
const GANTT_END = new Date('2026-08-15')
const TODAY = new Date('2026-05-31')
const TOTAL_DAYS = Math.ceil((GANTT_END.getTime() - GANTT_START.getTime()) / (1000 * 60 * 60 * 24))

const BATCH_COLORS: Record<string, string> = {
  '一批': '#7c3aed',
  '二批': '#db2777',
  '二批（提前）': '#db2777',
  '待定': '#6b7280',
}

const SCENARIO_DATES: Record<string, { start: string; end: string }> = {
  S02:  { start: '2026-05-25', end: '2026-06-18' },
  S04:  { start: '2026-05-29', end: '2026-06-18' },
  S06:  { start: '2026-05-29', end: '2026-06-18' },
  S100: { start: '2026-05-25', end: '2026-06-18' },
  S01:  { start: '2026-06-01', end: '2026-06-30' },
  S98:  { start: '2026-06-15', end: '2026-06-30' },
  S101: { start: '2026-06-08', end: '2026-06-30' },
  '37': { start: '2026-06-03', end: '2026-06-30' },
  '38': { start: '2026-06-03', end: '2026-06-30' },
  '53': { start: '2026-06-03', end: '2026-06-30' },
  '95': { start: '2026-06-03', end: '2026-06-30' },
  '99': { start: '2026-06-03', end: '2026-06-30' },
}

const MILESTONES = [
  { code: 'M4', date: '2026-06-18', label: 'M4 一批UAT' },
  { code: 'M5', date: '2026-06-30', label: 'M5 二批UAT' },
  { code: 'M6', date: '2026-07-15', label: 'M6 初验' },
  { code: 'M7', date: '2026-08-14', label: 'M7 终验' },
]

const READINESS_COLORS: Record<string, string> = {
  green: '#16a34a',
  amber: '#d97706',
  red: '#dc2626',
}

function dayOffset(dateStr: string): number {
  const d = new Date(dateStr)
  return Math.ceil((d.getTime() - GANTT_START.getTime()) / (1000 * 60 * 60 * 24))
}

function pct(days: number): number {
  return (days / TOTAL_DAYS) * 100
}

function getProgress(scenarioCode: string): number {
  const scenarioDeliverables = deliverables.filter(d => d.scenarioCode === scenarioCode)
  if (scenarioDeliverables.length === 0) return 0
  const archived = scenarioDeliverables.filter(d => d.status === '已归档').length
  return archived / scenarioDeliverables.length
}

function truncateName(name: string, max: number): string {
  return name.length > max ? name.slice(0, max) + '...' : name
}

// Generate month labels for header
function getMonthLabels() {
  const labels: { month: string; startPct: number; widthPct: number }[] = []
  const months = [
    { label: '5月', start: '2026-05-01', end: '2026-05-31' },
    { label: '6月', start: '2026-06-01', end: '2026-06-30' },
    { label: '7月', start: '2026-07-01', end: '2026-07-31' },
    { label: '8月', start: '2026-08-01', end: '2026-08-15' },
  ]
  for (const m of months) {
    const s = Math.max(0, dayOffset(m.start))
    const e = Math.min(TOTAL_DAYS, dayOffset(m.end))
    labels.push({ month: m.label, startPct: pct(s), widthPct: pct(e - s) })
  }
  return labels
}

// Scenario ordering: batch 1 first, then batch 2, then TBD
const BATCH_ORDER: Record<string, number> = { '一批': 0, '二批（提前）': 1, '二批': 1, '待定': 2 }

export default function GanttChart() {
  const monthLabels = getMonthLabels()
  const todayPct = pct(dayOffset('2026-05-31'))

  const sortedScenarios = [...scenarios].sort((a, b) => {
    const batchA = BATCH_ORDER[a.batch] ?? 3
    const batchB = BATCH_ORDER[b.batch] ?? 3
    if (batchA !== batchB) return batchA - batchB
    const datesA = SCENARIO_DATES[a.code]
    const datesB = SCENARIO_DATES[b.code]
    if (datesA && datesB) return datesA.start.localeCompare(datesB.start)
    return 0
  })

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-gray-900">
        场景甘特图
      </h2>

      <div className="overflow-x-auto">
        <div style={{ minWidth: 700 }}>
          {/* Month header */}
          <div className="relative mb-1 flex h-7 border-b border-gray-200">
            <div className="w-[180px] flex-shrink-0" />
            <div className="relative flex-1">
              {monthLabels.map((m) => (
                <div
                  key={m.month}
                  className="absolute top-0 flex h-full items-center border-l border-gray-200 px-2 text-xs font-medium text-gray-500"
                  style={{ left: `${m.startPct}%`, width: `${m.widthPct}%` }}
                >
                  {m.month}
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          <div className="relative">
            {sortedScenarios.map((sc, idx) => {
              const dates = SCENARIO_DATES[sc.code]
              if (!dates) return null

              const barStart = pct(dayOffset(dates.start))
              const barEnd = pct(dayOffset(dates.end))
              const barWidth = barEnd - barStart
              const progress = getProgress(sc.code)
              const batchColor = BATCH_COLORS[sc.batch] ?? '#6b7280'
              const readinessColor = READINESS_COLORS[sc.dataReadiness] ?? '#6b7280'

              return (
                <div
                  key={sc.id}
                  className={`flex items-center h-10 ${idx % 2 === 0 ? 'bg-gray-50/50' : ''}`}
                >
                  {/* Label column */}
                  <div className="w-[180px] flex-shrink-0 flex items-center gap-2 px-2">
                    <span
                      className="inline-block h-2 w-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: readinessColor }}
                      title={`数据就绪: ${sc.dataReadiness}`}
                    />
                    <span className="text-xs font-medium text-gray-700 truncate">
                      {sc.code}
                    </span>
                    <span className="text-xs text-gray-400 truncate">
                      {truncateName(sc.name, 10)}
                    </span>
                  </div>

                  {/* Bar area */}
                  <div className="relative flex-1 h-full flex items-center">
                    {/* Light grid lines for month boundaries */}
                    {monthLabels.map((m) => (
                      <div
                        key={m.month}
                        className="absolute top-0 h-full border-l border-gray-100"
                        style={{ left: `${m.startPct}%` }}
                      />
                    ))}

                    {/* Bar background (total) */}
                    <div
                      className="absolute h-6 rounded-md"
                      style={{
                        left: `${barStart}%`,
                        width: `${barWidth}%`,
                        backgroundColor: batchColor,
                        opacity: 0.15,
                      }}
                    />

                    {/* Bar fill (progress) */}
                    <div
                      className="absolute h-6 rounded-md transition-all"
                      style={{
                        left: `${barStart}%`,
                        width: `${barWidth * progress}%`,
                        backgroundColor: batchColor,
                        opacity: 0.7,
                      }}
                    />

                    {/* Bar border */}
                    <div
                      className="absolute h-6 rounded-md border"
                      style={{
                        left: `${barStart}%`,
                        width: `${barWidth}%`,
                        borderColor: batchColor,
                        opacity: 0.4,
                      }}
                    />
                  </div>
                </div>
              )
            })}

            {/* Today line */}
            <div
              className="absolute top-0 h-full border-l-2 border-dashed border-red-400 z-10"
              style={{ left: `calc(180px + (100% - 180px) * ${todayPct / 100})` }}
            >
              <span className="absolute -top-5 -translate-x-1/2 rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-medium text-white whitespace-nowrap">
                今天
              </span>
            </div>

            {/* Milestone lines */}
            {MILESTONES.map((ms) => {
              const msPct = pct(dayOffset(ms.date))
              return (
                <div
                  key={ms.code}
                  className="absolute top-0 h-full border-l border-dotted border-gray-300 z-[5]"
                  style={{ left: `calc(180px + (100% - 180px) * ${msPct / 100})` }}
                >
                  <span className="absolute -bottom-5 -translate-x-1/2 text-[9px] text-gray-400 whitespace-nowrap">
                    {ms.label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="mt-8 flex items-center gap-5 border-t border-gray-100 pt-3">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: '#7c3aed', opacity: 0.7 }} />
              <span className="text-[11px] text-gray-500">一批</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: '#db2777', opacity: 0.7 }} />
              <span className="text-[11px] text-gray-500">二批</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: '#6b7280', opacity: 0.7 }} />
              <span className="text-[11px] text-gray-500">待定</span>
            </div>
            <div className="ml-4 flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: '#16a34a' }} />
              <span className="text-[11px] text-gray-500">数据就绪</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: '#d97706' }} />
              <span className="text-[11px] text-gray-500">数据不足</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: '#dc2626' }} />
              <span className="text-[11px] text-gray-500">数据缺失</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
