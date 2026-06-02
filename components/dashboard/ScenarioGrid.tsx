'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useData } from '@/lib/data-context'
import {
  ChevronDown,
  ChevronRight,
  ListChecks,
  AlertCircle,
  FileText,
  CheckCircle2,
} from 'lucide-react'

const DEPT_ORDER = ['客户质量部', '测试一部', '测试二部']

const DEPT_STYLE: Record<string, { accent: string; bg: string; headerBg: string; headerText: string }> = {
  '客户质量部': { accent: '#2563eb', bg: '#eff6ff', headerBg: '#dbeafe', headerText: '#1e40af' },
  '测试一部':  { accent: '#059669', bg: '#ecfdf5', headerBg: '#dcfce7', headerText: '#166534' },
  '测试二部':  { accent: '#d97706', bg: '#fffbeb', headerBg: '#fef3c7', headerText: '#92400e' },
}

const READINESS_COLORS: Record<string, string> = {
  green: '#16a34a',
  amber: '#d97706',
  red: '#dc2626',
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + '...' : s
}

export default function ScenarioGrid() {
  const {
    scenarios, deliverables, getMember, ready,
    getTasksByScenario, getIssuesByScenario, getDeliverablesByScenario,
  } = useData()

  const router = useRouter()
  const [collapsedDepts, setCollapsedDepts] = useState<Record<string, boolean>>({})
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({})

  // Group scenarios by department in order
  const grouped = useMemo(() => {
    const map: Record<string, typeof scenarios> = {}
    for (const dept of DEPT_ORDER) {
      map[dept] = scenarios.filter(s => s.department === dept)
    }
    return map
  }, [scenarios])

  // Metrics per scenario
  const metrics = useMemo(() => {
    const m: Record<string, {
      progress: number; archived: number; total: number;
      taskCount: number; issueCount: number;
      tasks: { id: string; title: string; status: string }[];
      delivs: { id: string; name: string; status: string }[];
      issues: { id: string; title: string; severity: string; status: string }[];
    }> = {}
    for (const sc of scenarios) {
      const dels = getDeliverablesByScenario(sc.id)
      const archived = dels.filter(d => d.status === '已归档').length
      const tasks = getTasksByScenario(sc.id)
      const issues = getIssuesByScenario(sc.id)
      m[sc.id] = {
        progress: dels.length > 0 ? archived / dels.length : 0,
        archived,
        total: dels.length,
        taskCount: tasks.length,
        issueCount: issues.length,
        tasks: tasks.slice(0, 5).map(t => ({ id: t.id, title: t.title, status: t.status })),
        delivs: dels.slice(0, 5).map(d => ({ id: d.id, name: d.name, status: d.status })),
        issues: issues.slice(0, 5).map(i => ({ id: i.id, title: i.title, severity: i.severity, status: i.status })),
      }
    }
    return m
  }, [scenarios, deliverables, getDeliverablesByScenario, getTasksByScenario, getIssuesByScenario])

  const toggleDept = (dept: string) => {
    setCollapsedDepts(prev => ({ ...prev, [dept]: !prev[dept] }))
  }

  const toggleCard = (scId: string) => {
    setExpandedCards(prev => ({ ...prev, [scId]: !prev[scId] }))
  }

  if (!ready) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="h-6 w-40 animate-pulse rounded bg-gray-200 mb-4" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900 mb-5">
        场景进度总览
      </h2>

      <div className="space-y-5">
        {DEPT_ORDER.map(dept => {
          const style = DEPT_STYLE[dept]
          const isCollapsed = !!collapsedDepts[dept]
          const deptScenarios = grouped[dept] || []
          const deptTaskCount = deptScenarios.reduce((sum, sc) => sum + (metrics[sc.id]?.taskCount || 0), 0)
          const deptIssueCount = deptScenarios.reduce((sum, sc) => sum + (metrics[sc.id]?.issueCount || 0), 0)

          return (
            <div key={dept}>
              {/* Department header */}
              <button
                className="flex items-center gap-2 w-full text-left rounded-lg px-3 py-2 transition-colors hover:opacity-90"
                style={{ backgroundColor: style.headerBg }}
                onClick={() => toggleDept(dept)}
              >
                {isCollapsed
                  ? <ChevronRight size={16} style={{ color: style.headerText }} />
                  : <ChevronDown size={16} style={{ color: style.headerText }} />
                }
                <span className="text-sm font-semibold" style={{ color: style.headerText }}>
                  {dept}
                </span>
                <span className="text-xs font-normal" style={{ color: style.headerText, opacity: 0.7 }}>
                  ({deptScenarios.length} 场景)
                </span>
                <div className="ml-auto flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: style.headerText, opacity: 0.8 }}>
                    <ListChecks size={11} /> {deptTaskCount} 任务
                  </span>
                  {deptIssueCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-red-600">
                      <AlertCircle size={11} /> {deptIssueCount} 问题
                    </span>
                  )}
                </div>
              </button>

              {/* Scenario cards grid */}
              {!isCollapsed && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {deptScenarios.map(sc => {
                    const m = metrics[sc.id] || { progress: 0, archived: 0, total: 0, taskCount: 0, issueCount: 0, tasks: [], delivs: [], issues: [] }
                    const owner = getMember(sc.ownerId)
                    const readinessColor = READINESS_COLORS[sc.dataReadiness] || '#6b7280'
                    const isExpanded = !!expandedCards[sc.id]
                    const progressPct = Math.round(m.progress * 100)

                    return (
                      <div key={sc.id} className="flex flex-col">
                        {/* Card */}
                        <div
                          className="rounded-lg border border-gray-200 bg-white hover:shadow-md transition-shadow"
                        >
                          {/* Card header */}
                          <div className="p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div
                                className="flex items-center gap-1.5 min-w-0 cursor-pointer hover:opacity-70 transition-opacity"
                                onClick={() => router.push(`/scenarios/${sc.id}`)}
                              >
                                <span
                                  className="inline-block h-2 w-2 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: readinessColor }}
                                  title={`数据: ${sc.dataReadiness}`}
                                />
                                <span className="text-xs font-bold text-blue-700 flex-shrink-0 hover:underline">
                                  {sc.code}
                                </span>
                                <span className="text-xs text-gray-500 truncate hover:text-blue-600" title={sc.name}>
                                  {truncate(sc.name, 10)}
                                </span>
                              </div>
                              <span
                                className="inline-block rounded px-1 py-0.5 text-[9px] font-medium flex-shrink-0 leading-none"
                                style={{
                                  backgroundColor: sc.batch === '一批' ? '#ede9fe' : sc.batch.startsWith('二批') ? '#fce7f3' : '#f3f4f6',
                                  color: sc.batch === '一批' ? '#7c3aed' : sc.batch.startsWith('二批') ? '#db2777' : '#6b7280',
                                }}
                              >
                                {sc.batch === '二批（提前）' ? '二批' : sc.batch}
                              </span>
                            </div>

                            {/* Expandable area */}
                            <div className="cursor-pointer" onClick={() => toggleCard(sc.id)}>
                            {/* Owner */}
                            <div className="flex items-center gap-1.5 mb-2.5">
                              {owner && (
                                <span
                                  className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white flex-shrink-0"
                                  style={{ backgroundColor: owner.color }}
                                >
                                  {owner.initials}
                                </span>
                              )}
                              <span className="text-[11px] text-gray-500">
                                {owner?.name || '-'}
                              </span>
                            </div>

                            {/* Progress bar */}
                            <div className="mb-2">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-gray-400">
                                  交付进度
                                </span>
                                <span className="text-[10px] font-semibold text-gray-600">
                                  {progressPct}% ({m.archived}/{m.total})
                                </span>
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${progressPct}%`,
                                    backgroundColor: style.accent,
                                    opacity: 0.8,
                                  }}
                                />
                              </div>
                            </div>

                            {/* Badges */}
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
                                <ListChecks size={9} />
                                {m.taskCount}
                              </span>
                              <span
                                className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                                  m.issueCount > 0
                                    ? 'bg-red-50 text-red-600'
                                    : 'bg-gray-50 text-gray-400'
                                }`}
                              >
                                <AlertCircle size={9} />
                                {m.issueCount}
                              </span>
                            </div>
                            </div>{/* close expandable area wrapper */}
                          </div>
                        </div>

                        {/* Expanded detail */}
                        {isExpanded && (
                          <div className="mt-1 rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs space-y-3">
                            {/* Tasks */}
                            {m.tasks.length > 0 && (
                              <div>
                                <div className="flex items-center gap-1 text-gray-500 font-medium mb-1">
                                  <ListChecks size={11} /> 关联任务
                                </div>
                                <ul className="space-y-0.5">
                                  {m.tasks.map(t => (
                                    <li key={t.id} className="flex items-center gap-1.5 text-gray-600">
                                      <span className={`inline-block h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                                        t.status === '已完成' ? 'bg-green-400' :
                                        t.status === '进行中' ? 'bg-blue-400' :
                                        t.status === '审核中' ? 'bg-amber-400' :
                                        'bg-gray-300'
                                      }`} />
                                      <span className="truncate">{truncate(t.title, 20)}</span>
                                      <span className="ml-auto text-[10px] text-gray-400 flex-shrink-0">{t.status}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Deliverables */}
                            {m.delivs.length > 0 && (
                              <div>
                                <div className="flex items-center gap-1 text-gray-500 font-medium mb-1">
                                  <FileText size={11} /> 交付物
                                </div>
                                <ul className="space-y-0.5">
                                  {m.delivs.map(d => (
                                    <li key={d.id} className="flex items-center gap-1.5 text-gray-600">
                                      {d.status === '已归档'
                                        ? <CheckCircle2 size={10} className="text-green-500 flex-shrink-0" />
                                        : <FileText size={10} className="text-gray-300 flex-shrink-0" />
                                      }
                                      <span className="truncate">{truncate(d.name, 18)}</span>
                                      <span className="ml-auto text-[10px] text-gray-400 flex-shrink-0">{d.status}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Issues */}
                            {m.issues.length > 0 && (
                              <div>
                                <div className="flex items-center gap-1 text-gray-500 font-medium mb-1">
                                  <AlertCircle size={11} /> 问题
                                </div>
                                <ul className="space-y-0.5">
                                  {m.issues.map(i => (
                                    <li key={i.id} className="flex items-center gap-1.5 text-gray-600">
                                      <span className={`inline-block h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                                        i.severity === '严重' ? 'bg-red-500' :
                                        i.severity === '一般' ? 'bg-amber-400' :
                                        'bg-gray-300'
                                      }`} />
                                      <span className="truncate">{truncate(i.title, 18)}</span>
                                      <span className="ml-auto text-[10px] text-gray-400 flex-shrink-0">{i.status}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {m.tasks.length === 0 && m.delivs.length === 0 && m.issues.length === 0 && (
                              <div className="text-center text-gray-400 py-2">
                                暂无关联数据
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
