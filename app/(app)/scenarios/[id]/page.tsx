'use client'

import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useData } from '@/lib/data-context'
import Header from '@/components/layout/Header'
import {
  ArrowLeft,
  FileText,
  ListChecks,
  AlertCircle,
  Download,
  Calendar,
  User,
  Tag,
  CheckCircle2,
} from 'lucide-react'

const STATUS_WEIGHTS: Record<string, number> = {
  '待编制': 0,
  '编制中': 0.25,
  '待审核': 0.5,
  '待签字': 0.75,
  '已归档': 1,
}

const STATUS_STYLE: Record<string, { dot: string; text: string; bg: string }> = {
  '待编制': { dot: 'bg-gray-400', text: 'text-gray-600', bg: 'bg-gray-50' },
  '编制中': { dot: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50' },
  '待审核': { dot: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50' },
  '待签字': { dot: 'bg-purple-500', text: 'text-purple-600', bg: 'bg-purple-50' },
  '已归档': { dot: 'bg-green-500', text: 'text-green-600', bg: 'bg-green-50' },
}

const SEVERITY_STYLE: Record<string, { dot: string; text: string }> = {
  '严重': { dot: 'bg-red-500', text: 'text-red-600' },
  '一般': { dot: 'bg-amber-500', text: 'text-amber-600' },
  '轻微': { dot: 'bg-blue-500', text: 'text-blue-600' },
  '建议': { dot: 'bg-gray-400', text: 'text-gray-500' },
}

const TASK_STATUS_STYLE: Record<string, { dot: string; text: string }> = {
  '待办': { dot: 'bg-gray-400', text: 'text-gray-600' },
  '进行中': { dot: 'bg-blue-500', text: 'text-blue-600' },
  '审核中': { dot: 'bg-amber-500', text: 'text-amber-600' },
  '已完成': { dot: 'bg-green-500', text: 'text-green-600' },
}

const READINESS_MAP: Record<string, { color: string; label: string }> = {
  green: { color: '#16a34a', label: '已就绪' },
  amber: { color: '#d97706', label: '部分就绪' },
  red: { color: '#dc2626', label: '未就绪' },
}

const DEPT_STYLE: Record<string, { bg: string; text: string }> = {
  '客户质量部': { bg: 'bg-blue-50', text: 'text-blue-700' },
  '测试一部': { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  '测试二部': { bg: 'bg-amber-50', text: 'text-amber-700' },
}

const TYPE_STYLE: Record<string, { bg: string; text: string }> = {
  '知识检索': { bg: 'bg-cyan-50', text: 'text-cyan-700' },
  '文档生成': { bg: 'bg-violet-50', text: 'text-violet-700' },
  '审核校验': { bg: 'bg-orange-50', text: 'text-orange-700' },
  '知识推理': { bg: 'bg-pink-50', text: 'text-pink-700' },
}

export default function ScenarioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const router = useRouter()
  const {
    getScenario, getMember, getDeliverablesByScenario, getTasksByScenario,
    getIssuesByScenario, files, deliverableVersions, today, ready,
  } = useData()

  const scenario = getScenario(id)

  const scenarioDeliverables = useMemo(() => {
    if (!scenario) return []
    return getDeliverablesByScenario(scenario.id)
  }, [scenario, getDeliverablesByScenario])

  const scenarioTasks = useMemo(() => {
    if (!scenario) return []
    return getTasksByScenario(scenario.id)
  }, [scenario, getTasksByScenario])

  const scenarioIssues = useMemo(() => {
    if (!scenario) return []
    return getIssuesByScenario(scenario.id)
  }, [scenario, getIssuesByScenario])

  const scenarioFiles = useMemo(() => {
    if (!scenario) return []
    return files.filter(f => f.scenarioId === scenario.id)
  }, [scenario, files])

  const progress = useMemo(() => {
    if (scenarioDeliverables.length === 0) return 0
    const total = scenarioDeliverables.reduce(
      (sum, d) => sum + (STATUS_WEIGHTS[d.status] ?? 0), 0
    )
    return Math.round((total / scenarioDeliverables.length) * 100)
  }, [scenarioDeliverables])

  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="场景详情" />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200 mb-6" />
          <div className="h-64 animate-pulse rounded-xl bg-gray-100" />
        </main>
      </div>
    )
  }

  if (!scenario) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="场景详情" />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
          >
            <ArrowLeft size={16} />
            返回总览
          </button>
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">场景未找到</p>
          </div>
        </main>
      </div>
    )
  }

  const owner = getMember(scenario.ownerId)
  const readiness = READINESS_MAP[scenario.dataReadiness] || READINESS_MAP.green
  const deptStyle = DEPT_STYLE[scenario.department] || { bg: 'bg-gray-50', text: 'text-gray-700' }
  const typeStyle = TYPE_STYLE[scenario.type] || { bg: 'bg-gray-50', text: 'text-gray-700' }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="场景详情" />
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Back button */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          返回总览
        </button>

        {/* Header card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-xl font-bold text-gray-900">
                  {scenario.code}
                </h1>
                <span className="text-lg text-gray-600">{scenario.name}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${deptStyle.bg} ${deptStyle.text}`}>
                  {scenario.department}
                </span>
                <span
                  className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: scenario.batch === '一批' ? '#ede9fe' : '#fce7f3',
                    color: scenario.batch === '一批' ? '#7c3aed' : '#db2777',
                  }}
                >
                  {scenario.batch}
                </span>
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${typeStyle.bg} ${typeStyle.text}`}>
                  {scenario.type}
                </span>
              </div>
            </div>

            {/* Blueprint version */}
            <div className="flex items-center gap-2">
              <Tag size={14} className="text-gray-500" />
              <span className="text-sm text-gray-500">蓝图版本</span>
              <span className="text-sm font-mono font-medium text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                {scenario.blueprintVersion}
              </span>
            </div>
          </div>

          {/* Owner + dates + readiness */}
          <div className="mt-4 flex flex-wrap items-center gap-6 text-sm">
            {/* Owner */}
            <div className="flex items-center gap-2">
              {owner ? (
                <>
                  <span
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: owner.color }}
                  >
                    {owner.initials}
                  </span>
                  <span className="text-gray-700 font-medium">{owner.name}</span>
                </>
              ) : (
                <>
                  <User size={16} className="text-gray-500" />
                  <span className="text-gray-500">未分配</span>
                </>
              )}
            </div>

            {/* Data readiness */}
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: readiness.color }}
              />
              <span className="text-gray-600">数据: {readiness.label}</span>
              {scenario.dataNote && (
                <span className="text-gray-500 text-xs">({scenario.dataNote})</span>
              )}
            </div>

            {/* Date range */}
            <div className="flex items-center gap-1.5 text-gray-500">
              <Calendar size={14} />
              <span>{scenario.startDate} ~ {scenario.endDate}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-gray-500">交付进度</span>
              <span className="text-sm font-semibold text-gray-700">{progress}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all bg-blue-600"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Three-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Deliverables */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
              <FileText size={15} className="text-violet-500" />
              交付物
              <span className="text-xs font-normal text-gray-500">({scenarioDeliverables.length})</span>
            </h3>
            {scenarioDeliverables.length > 0 ? (
              <div className="space-y-2">
                {scenarioDeliverables.map(d => {
                  const st = STATUS_STYLE[d.status] || STATUS_STYLE['待编制']
                  const latestVersion = deliverableVersions
                    .filter(v => v.deliverableId === d.id)
                    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))[0]
                  return (
                    <div key={d.id} className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gray-50">
                      <span className={`inline-block h-2 w-2 rounded-full flex-shrink-0 ${st.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono text-gray-500">{d.code}</span>
                          <span className="text-sm text-gray-700 truncate">{d.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {(d.currentVersion || latestVersion) && (
                          <span className="text-[10px] font-mono text-gray-500">
                            {d.currentVersion || latestVersion?.versionNumber}
                          </span>
                        )}
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${st.bg} ${st.text}`}>
                          {d.status}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-500 text-center py-6">暂无交付物</p>
            )}
          </div>

          {/* Tasks */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
              <ListChecks size={15} className="text-blue-500" />
              任务
              <span className="text-xs font-normal text-gray-500">({scenarioTasks.length})</span>
            </h3>
            {scenarioTasks.length > 0 ? (
              <div className="space-y-2">
                {scenarioTasks.map(t => {
                  const ts = TASK_STATUS_STYLE[t.status] || TASK_STATUS_STYLE['待办']
                  const assignee = getMember(t.assigneeId)
                  return (
                    <div key={t.id} className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gray-50">
                      <span className={`inline-block h-2 w-2 rounded-full flex-shrink-0 ${ts.dot}`} />
                      <span className="text-sm text-gray-700 truncate flex-1 min-w-0">{t.title}</span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {assignee && (
                          <span
                            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold text-white"
                            style={{ backgroundColor: assignee.color }}
                            title={assignee.name}
                          >
                            {assignee.initials}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-500">{t.dueDate}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-500 text-center py-6">暂无任务</p>
            )}
          </div>

          {/* Issues */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
              <AlertCircle size={15} className="text-red-500" />
              问题
              <span className="text-xs font-normal text-gray-500">({scenarioIssues.length})</span>
            </h3>
            {scenarioIssues.length > 0 ? (
              <div className="space-y-2">
                {scenarioIssues.map(i => {
                  const sv = SEVERITY_STYLE[i.severity] || SEVERITY_STYLE['建议']
                  return (
                    <div key={i.id} className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gray-50">
                      <span className={`inline-block h-2 w-2 rounded-full flex-shrink-0 ${sv.dot}`} />
                      <span className="text-sm text-gray-700 truncate flex-1 min-w-0">{i.title}</span>
                      <span className={`text-[10px] font-medium flex-shrink-0 ${sv.text}`}>{i.severity}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-500 text-center py-6">暂无问题</p>
            )}
          </div>
        </div>

        {/* Files section */}
        {scenarioFiles.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
              <FileText size={15} className="text-gray-500" />
              关联文件
              <span className="text-xs font-normal text-gray-500">({scenarioFiles.length})</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {scenarioFiles.map(f => (
                <div key={f.id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-gray-50">
                  <FileText size={14} className="text-gray-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 truncate flex-1 min-w-0">{f.name}</span>
                  {f.fileUrl ? (
                    <a
                      href={f.fileUrl}
                      download={f.originalName}
                      className="p-1 text-gray-500 hover:text-blue-600 transition-colors flex-shrink-0"
                      onClick={e => e.stopPropagation()}
                    >
                      <Download size={14} />
                    </a>
                  ) : (
                    <span className="text-[10px] text-gray-300 flex-shrink-0">--</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
