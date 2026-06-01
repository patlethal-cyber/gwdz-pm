'use client'

import { X, User, Briefcase, CheckSquare, FileText, AlertTriangle, Mail, Phone, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useData } from '@/lib/data-context'
import type { TeamMember, Task, Deliverable, Issue } from '@/lib/types'

interface PersonDetailProps {
  member: TeamMember
  onClose: () => void
}

const taskStatusColor: Record<string, string> = {
  '待办': 'bg-gray-100 text-gray-600',
  '进行中': 'bg-blue-50 text-blue-600',
  '审核中': 'bg-violet-50 text-violet-600',
  '已完成': 'bg-emerald-50 text-emerald-600',
}

const deliverableStatusColor: Record<string, string> = {
  '待编制': 'bg-gray-100 text-gray-600',
  '编制中': 'bg-blue-50 text-blue-600',
  '待审核': 'bg-amber-50 text-amber-600',
  '待签字': 'bg-violet-50 text-violet-600',
  '已归档': 'bg-emerald-50 text-emerald-600',
}

const issueStatusColor: Record<string, string> = {
  '待处理': 'bg-red-50 text-red-600',
  '处理中': 'bg-amber-50 text-amber-600',
  '已解决': 'bg-emerald-50 text-emerald-600',
  '已关闭': 'bg-gray-100 text-gray-500',
  '已驳回': 'bg-gray-100 text-gray-500',
}

const severityColor: Record<string, string> = {
  '严重': 'text-red-600',
  '一般': 'text-amber-600',
  '轻微': 'text-blue-600',
  '建议': 'text-gray-500',
}

function groupBy<T>(items: T[], key: (item: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {}
  for (const item of items) {
    const k = key(item)
    if (!result[k]) result[k] = []
    result[k].push(item)
  }
  return result
}

export default function PersonDetail({ member, onClose }: PersonDetailProps) {
  const { getPersonAggregation, getScenario } = useData()
  const agg = getPersonAggregation(member.id)

  const tasksByStatus = groupBy(agg.tasks, t => t.status)
  const deliverablesByStatus = groupBy(agg.deliverables, d => d.status)

  const taskStatusOrder = ['进行中', '待办', '审核中', '已完成']
  const deliverableStatusOrder = ['编制中', '待编制', '待审核', '待签字', '已归档']

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start gap-4 p-6 border-b border-gray-200">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
            style={{ backgroundColor: member.color }}
          >
            {member.initials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900">{member.name}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{member.role}</p>
            <span className="inline-block mt-1.5 px-2 py-0.5 text-[11px] font-medium text-gray-600 bg-gray-100 rounded-full">
              {member.group}
            </span>
            {(member.email || member.phone) && (
              <div className="flex flex-wrap items-center gap-3 mt-2">
                {member.email && (
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Mail size={12} /> {member.email}
                  </span>
                )}
                {member.phone && (
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Phone size={12} /> {member.phone}
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Stats bar */}
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-lg font-bold text-blue-700">{agg.tasks.length}</p>
              <p className="text-[10px] text-blue-500 mt-0.5">任务</p>
            </div>
            <div className="text-center p-3 bg-violet-50 rounded-lg">
              <p className="text-lg font-bold text-violet-700">{agg.deliverables.length}</p>
              <p className="text-[10px] text-violet-500 mt-0.5">交付物</p>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-lg">
              <p className="text-lg font-bold text-amber-700">{agg.issues.length}</p>
              <p className="text-[10px] text-amber-500 mt-0.5">问题</p>
            </div>
            <div className="text-center p-3 bg-emerald-50 rounded-lg">
              <p className="text-lg font-bold text-emerald-700">{agg.scenarios.length}</p>
              <p className="text-[10px] text-emerald-500 mt-0.5">场景</p>
            </div>
          </div>

          {/* Scenarios */}
          {agg.scenarios.length > 0 && (
            <section>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <Briefcase size={14} />
                负责场景
                <span className="text-xs font-normal text-gray-400">({agg.scenarios.length})</span>
              </h3>
              <div className="space-y-1.5">
                {agg.scenarios.map(s => (
                  <Link
                    key={s.id}
                    href={`/scenarios/${s.id}`}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-mono text-gray-400">{s.code}</span>
                      <span className="text-sm text-gray-700 truncate group-hover:text-blue-600">{s.name}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">{s.department}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Tasks */}
          {agg.tasks.length > 0 && (
            <section>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <CheckSquare size={14} />
                相关任务
                <span className="text-xs font-normal text-gray-400">({agg.tasks.length})</span>
              </h3>
              <div className="space-y-3">
                {taskStatusOrder.map(status => {
                  const items = tasksByStatus[status]
                  if (!items || items.length === 0) return null
                  return (
                    <div key={status}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${taskStatusColor[status]}`}>
                          {status}
                        </span>
                        <span className="text-[10px] text-gray-400">{items.length}</span>
                      </div>
                      <div className="space-y-1">
                        {items.map((t: Task) => {
                          const scenario = t.scenarioId ? getScenario(t.scenarioId) : undefined
                          return (
                            <Link
                              key={t.id}
                              href="/tasks"
                              className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
                            >
                              <span className="text-sm text-gray-700 truncate group-hover:text-blue-600">{t.title}</span>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {scenario && (
                                  <span className="text-[10px] text-gray-400">{scenario.code}</span>
                                )}
                                <span className="text-[10px] text-gray-400">{t.dueDate}</span>
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Deliverables */}
          {agg.deliverables.length > 0 && (
            <section>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <FileText size={14} />
                负责交付物
                <span className="text-xs font-normal text-gray-400">({agg.deliverables.length})</span>
              </h3>
              <div className="space-y-3">
                {deliverableStatusOrder.map(status => {
                  const items = deliverablesByStatus[status]
                  if (!items || items.length === 0) return null
                  return (
                    <div key={status}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${deliverableStatusColor[status]}`}>
                          {status}
                        </span>
                        <span className="text-[10px] text-gray-400">{items.length}</span>
                      </div>
                      <div className="space-y-1">
                        {items.map((d: Deliverable) => (
                          <Link
                            key={d.id}
                            href="/deliverables"
                            className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs font-mono text-gray-400">{d.code}</span>
                              <span className="text-sm text-gray-700 truncate group-hover:text-blue-600">{d.name}</span>
                            </div>
                            {d.currentVersion && (
                              <span className="text-[10px] text-gray-400 flex-shrink-0">{d.currentVersion}</span>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Issues */}
          {agg.issues.length > 0 && (
            <section>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <AlertTriangle size={14} />
                相关问题
                <span className="text-xs font-normal text-gray-400">({agg.issues.length})</span>
              </h3>
              <div className="space-y-1">
                {agg.issues.map((i: Issue) => (
                  <Link
                    key={i.id}
                    href="/issues"
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-[10px] font-semibold ${severityColor[i.severity]}`}>{i.severity}</span>
                      <span className="text-sm text-gray-700 truncate group-hover:text-blue-600">{i.title}</span>
                    </div>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${issueStatusColor[i.status]}`}>
                      {i.status}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Empty state */}
          {agg.tasks.length === 0 && agg.deliverables.length === 0 && agg.issues.length === 0 && agg.scenarios.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <User size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">暂无关联数据</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
