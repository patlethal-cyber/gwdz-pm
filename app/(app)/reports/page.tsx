'use client'

import { useState, useMemo } from 'react'
import { useData } from '@/lib/data-context'
import { FileText, Copy, Check, BarChart3 } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

type Tab = '日报' | '周报' | '可视化周报'

function getMonday(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${y}/${m}/${d}`
}

const CATEGORY_LABELS: Record<string, string> = {
  scenario: '场景开发',
  project: '项目管理',
  support: '支持保障',
}

const SEVERITY_COLORS: Record<string, string> = {
  '严重': '#ef4444',
  '一般': '#f59e0b',
  '轻微': '#3b82f6',
  '建议': '#6b7280',
}

export default function ReportsPage() {
  const {
    tasks, issues, scenarios, milestones, team, getMember, getScenario,
    getOverdueTasks, getIssuesByScenario, today, ready,
  } = useData()

  const [tab, setTab] = useState<Tab>('日报')
  const [copiedSection, setCopiedSection] = useState<string | null>(null)
  const [onsiteStaff, setOnsiteStaff] = useState('上午：温宇恒、高泉淙  下午：温宇恒、高泉淙')

  if (!ready) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-10 bg-gray-100 rounded-lg animate-pulse w-48" />
        <div className="h-8 bg-gray-100 rounded-lg animate-pulse w-64" />
        <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    )
  }

  const weekMonday = getMonday(today)
  const weekFriday = addDays(weekMonday, 4)
  const nextMonday = addDays(weekMonday, 7)
  const nextFriday = addDays(weekMonday, 11)

  const inProgressTasks = tasks.filter(t => t.status === '进行中')
  const overdueTasks = getOverdueTasks()
  const severeOpenIssues = issues.filter(
    i => i.severity !== '轻微' && i.severity !== '建议' && i.status !== '已解决' && i.status !== '已关闭'
  )

  // Group in-progress tasks by category
  const tasksByCategory = inProgressTasks.reduce<Record<string, typeof inProgressTasks>>((acc, t) => {
    const cat = t.category || 'project'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(t)
    return acc
  }, {})

  // Weekly data
  const completedThisWeek = tasks.filter(
    t => t.status === '已完成' && t.updatedAt >= weekMonday && t.updatedAt <= weekFriday
  )
  const inProgressThisWeek = tasks.filter(t => t.status === '进行中')
  const nextWeekTasks = tasks.filter(
    t => t.status !== '已完成' && t.dueDate >= nextMonday && t.dueDate <= nextFriday
  )

  // ===== Builders =====

  function buildDailyText(): string {
    const lines: string[] = []
    lines.push(today)
    lines.push('')
    lines.push('1. 当日驻场人员')
    lines.push(onsiteStaff)
    lines.push('')
    lines.push('2. 本日工作简报')

    const cats = Object.keys(tasksByCategory)
    if (cats.length === 0) {
      lines.push('  无进行中任务')
    } else {
      cats.forEach(cat => {
        lines.push(`  【${CATEGORY_LABELS[cat] || cat}】`)
        tasksByCategory[cat].forEach(t => {
          const assignee = getMember(t.assigneeId)?.name || t.assigneeId
          const scenario = t.scenarioId ? getScenario(t.scenarioId) : null
          const prefix = scenario ? `[${scenario.code}] ` : ''
          lines.push(`  - ${prefix}${t.title}（${assignee}）`)
        })
      })
    }

    lines.push('')
    lines.push('3. 待解决问题')
    const problemItems = [
      ...overdueTasks.map(t => {
        const assignee = getMember(t.assigneeId)?.name || t.assigneeId
        return `- [逾期] ${t.title}（截止 ${t.dueDate}，${assignee}）`
      }),
      ...severeOpenIssues.map(i => {
        const assignee = getMember(i.assigneeId)?.name || i.assigneeId
        return `- [${i.severity}] ${i.title}（${assignee}）`
      }),
    ]
    if (problemItems.length === 0) {
      lines.push('  无')
    } else {
      problemItems.forEach(item => lines.push(`  ${item}`))
    }

    return lines.join('\n')
  }

  function buildWeeklyProgressTable(): string {
    const lines: string[] = []
    lines.push('===== A. 进展跟踪表 =====')
    lines.push('序号 | 事项 | 当前进展 | 下周计划 | 状态 | 问题风险 | 责任人 | 开始时间 | 计划完成时间')
    lines.push('--- | --- | --- | --- | --- | --- | --- | --- | ---')

    scenarios.forEach((s, idx) => {
      const scenarioTasks = tasks.filter(t => t.scenarioId === s.id)
      const done = scenarioTasks.filter(t => t.status === '已完成').length
      const total = scenarioTasks.length
      const progress = total > 0 ? `${done}/${total} 任务完成` : '暂无任务'

      const nextWeek = scenarioTasks
        .filter(t => t.status !== '已完成' && t.dueDate >= nextMonday && t.dueDate <= nextFriday)
        .map(t => t.title)
        .join('；') || '按计划推进'

      const scenarioIssues = getIssuesByScenario(s.id)
        .filter(i => i.status !== '已解决' && i.status !== '已关闭')
      const riskText = scenarioIssues.length > 0
        ? scenarioIssues.map(i => `[${i.severity}]${i.title}`).join('；')
        : '无'

      const statusMap: Record<string, string> = { green: '正常', amber: '关注', red: '风险' }
      const status = total === 0 ? '待启动' : done === total ? '已完成' : statusMap[s.dataReadiness] || '进行中'

      const owner = getMember(s.ownerId)?.name || s.ownerId

      lines.push(
        `${idx + 1} | ${s.code} ${s.name} | ${progress} | ${nextWeek} | ${status} | ${riskText} | ${owner} | ${s.startDate} | ${s.endDate}`
      )
    })

    return lines.join('\n')
  }

  function buildWeeklyReport(): string {
    const lines: string[] = []
    lines.push('===== B. 项目周报 =====')
    lines.push('')
    lines.push('【基本信息】')
    lines.push(`项目名称：国微电子 HIAgent AI 智能体项目`)
    lines.push(`报告周期：${formatDate(weekMonday)} - ${formatDate(weekFriday)}`)
    lines.push(`填报日期：${formatDate(today)}`)
    lines.push('')

    // 1. Issues
    lines.push('1. 问题及风险')
    const reportableIssues = issues.filter(
      i => (i.severity === '严重' || i.severity === '一般') && i.status !== '已关闭'
    )
    if (reportableIssues.length === 0) {
      lines.push('  暂无重要问题')
    } else {
      reportableIssues.forEach(i => {
        const assignee = getMember(i.assigneeId)?.name || i.assigneeId
        lines.push(`  - [${i.severity}] ${i.title}`)
        lines.push(`    发现日期：${i.createdAt}`)
        lines.push(`    对策：${i.resolution || '待制定'}`)
        lines.push(`    进展：${i.status}`)
        lines.push(`    责任人：${assignee}`)
      })
    }
    lines.push('')

    // 2. Milestones
    lines.push('2. 项目里程碑')
    milestones.forEach(m => {
      const icon = m.status === '已完成' ? '[done]' : m.status === '进行中' ? '[doing]' : '[todo]'
      lines.push(`  ${icon} ${m.code} ${m.name}（${m.date}）`)
    })
    lines.push('')

    // 3. This week
    lines.push('3. 本周进展')
    if (completedThisWeek.length > 0) {
      lines.push('  已完成：')
      completedThisWeek.forEach(t => {
        const assignee = getMember(t.assigneeId)?.name || t.assigneeId
        lines.push(`  - ${t.title}（${assignee}）`)
      })
    }
    if (inProgressThisWeek.length > 0) {
      lines.push('  进行中：')
      inProgressThisWeek.forEach(t => {
        const assignee = getMember(t.assigneeId)?.name || t.assigneeId
        lines.push(`  - ${t.title}（${assignee}）`)
      })
    }
    if (completedThisWeek.length === 0 && inProgressThisWeek.length === 0) {
      lines.push('  暂无记录')
    }
    lines.push('')

    // 4. Next week
    lines.push('4. 下周计划')
    if (nextWeekTasks.length === 0) {
      lines.push('  按 WBS 计划推进')
    } else {
      nextWeekTasks.forEach(t => {
        const assignee = getMember(t.assigneeId)?.name || t.assigneeId
        lines.push(`  - ${t.title}（截止 ${t.dueDate}，${assignee}）`)
      })
    }

    return lines.join('\n')
  }

  function handleCopy(text: string, sectionId: string) {
    navigator.clipboard.writeText(text)
    setCopiedSection(sectionId)
    setTimeout(() => setCopiedSection(null), 2000)
  }

  function CopyButton({ text, sectionId }: { text: string; sectionId: string }) {
    const isCopied = copiedSection === sectionId
    return (
      <button
        onClick={() => handleCopy(text, sectionId)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
      >
        {isCopied ? <Check size={14} /> : <Copy size={14} />}
        {isCopied ? '已复制' : '复制到剪贴板'}
      </button>
    )
  }

  // ===== Visual data =====

  const scenarioProgressData = scenarios.map(s => {
    const sTasks = tasks.filter(t => t.scenarioId === s.id)
    const done = sTasks.filter(t => t.status === '已完成').length
    const total = sTasks.length
    const pct = total > 0 ? Math.round((done / total) * 100) : 0
    return { name: s.code, progress: pct, total, done }
  })

  const severityCounts = issues.reduce<Record<string, number>>((acc, i) => {
    if (i.status !== '已解决' && i.status !== '已关闭') {
      acc[i.severity] = (acc[i.severity] || 0) + 1
    }
    return acc
  }, {})
  const severityPieData = Object.entries(severityCounts).map(([name, value]) => ({ name, value }))

  const milestoneData = milestones.map(m => ({
    code: m.code,
    name: m.name,
    date: m.date,
    status: m.status,
    value: m.status === '已完成' ? 100 : m.status === '进行中' ? 50 : 0,
  }))

  const weekTaskData = [
    { name: '已完成', count: completedThisWeek.length },
    { name: '进行中', count: inProgressThisWeek.length },
    { name: '下周计划', count: nextWeekTasks.length },
    { name: '逾期', count: overdueTasks.length },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
          <FileText size={20} className="text-violet-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">报告</h1>
          <p className="text-sm text-gray-500">生成日报与周报，一键复制到微信</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {(['日报', '周报', '可视化周报'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
              tab === t
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === '可视化周报' && <BarChart3 size={14} />}
            {t}
          </button>
        ))}
      </div>

      {/* ===== Daily Report ===== */}
      {tab === '日报' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800">项目日报 - {today}</h2>
            <CopyButton text={buildDailyText()} sectionId="daily" />
          </div>
          <div className="p-6 space-y-5">
            {/* Date */}
            <div className="text-sm font-medium text-gray-900">{today}</div>

            {/* 1. On-site staff */}
            <div>
              <div className="text-sm font-semibold text-gray-800 mb-2">1. 当日驻场人员</div>
              <input
                type="text"
                value={onsiteStaff}
                onChange={e => setOnsiteStaff(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 2. Work summary */}
            <div>
              <div className="text-sm font-semibold text-gray-800 mb-2">2. 本日工作简报</div>
              {Object.keys(tasksByCategory).length === 0 ? (
                <p className="text-sm text-gray-400 pl-2">无进行中任务</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(tasksByCategory).map(([cat, catTasks]) => (
                    <div key={cat}>
                      <div className="text-xs font-medium text-gray-500 mb-1">
                        {CATEGORY_LABELS[cat] || cat}
                      </div>
                      <ul className="space-y-1 pl-2">
                        {catTasks.map(t => {
                          const assignee = getMember(t.assigneeId)?.name || t.assigneeId
                          const scenario = t.scenarioId ? getScenario(t.scenarioId) : null
                          return (
                            <li key={t.id} className="text-sm text-gray-700 flex items-start gap-1.5">
                              <span className="text-gray-300 mt-0.5">-</span>
                              <span>
                                {scenario && (
                                  <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded mr-1.5">
                                    {scenario.code}
                                  </span>
                                )}
                                {t.title}
                                <span className="text-gray-400 ml-1">({assignee})</span>
                              </span>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Pending issues */}
            <div>
              <div className="text-sm font-semibold text-gray-800 mb-2">3. 待解决问题</div>
              {overdueTasks.length === 0 && severeOpenIssues.length === 0 ? (
                <p className="text-sm text-gray-400 pl-2">无</p>
              ) : (
                <ul className="space-y-1.5 pl-2">
                  {overdueTasks.map(t => (
                    <li key={t.id} className="text-sm text-red-700 flex items-start gap-1.5">
                      <span className="text-red-300 mt-0.5">-</span>
                      <span>
                        <span className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded mr-1">逾期</span>
                        {t.title}
                        <span className="text-gray-400 ml-1">(截止 {t.dueDate}，{getMember(t.assigneeId)?.name || t.assigneeId})</span>
                      </span>
                    </li>
                  ))}
                  {severeOpenIssues.map(i => (
                    <li key={i.id} className="text-sm text-amber-700 flex items-start gap-1.5">
                      <span className="text-amber-300 mt-0.5">-</span>
                      <span>
                        <span className={`text-xs px-1.5 py-0.5 rounded mr-1 ${
                          i.severity === '严重' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                        }`}>{i.severity}</span>
                        {i.title}
                        <span className="text-gray-400 ml-1">({getMember(i.assigneeId)?.name || i.assigneeId})</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== Weekly Report ===== */}
      {tab === '周报' && (
        <div className="space-y-6">
          {/* A. Progress tracking table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">A. 进展跟踪表</h2>
              <CopyButton text={buildWeeklyProgressTable()} sectionId="weekly-a" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 w-10">序号</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500">事项</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500">当前进展</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500">下周计划</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 w-16">状态</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500">问题风险</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 w-16">责任人</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 w-24">开始时间</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 w-24">计划完成</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {scenarios.map((s, idx) => {
                    const sTasks = tasks.filter(t => t.scenarioId === s.id)
                    const done = sTasks.filter(t => t.status === '已完成').length
                    const total = sTasks.length
                    const progress = total > 0 ? `${done}/${total} 完成` : '暂无任务'

                    const nextWeek = sTasks
                      .filter(t => t.status !== '已完成' && t.dueDate >= nextMonday && t.dueDate <= nextFriday)
                      .map(t => t.title)
                      .join('；') || '按计划推进'

                    const sIssues = getIssuesByScenario(s.id).filter(i => i.status !== '已解决' && i.status !== '已关闭')
                    const owner = getMember(s.ownerId)?.name || s.ownerId

                    const statusLabel = total === 0 ? '待启动' : done === total ? '已完成' : '进行中'
                    const statusColor = statusLabel === '已完成' ? 'text-green-600 bg-green-50' :
                      statusLabel === '进行中' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 bg-gray-50'

                    return (
                      <tr key={s.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          <span className="text-xs text-gray-400 mr-1">{s.code}</span>
                          {s.name}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{progress}</td>
                        <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{nextWeek}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {sIssues.length === 0 ? (
                            <span className="text-xs text-gray-400">无</span>
                          ) : (
                            <div className="space-y-0.5">
                              {sIssues.slice(0, 2).map(i => (
                                <div key={i.id} className="text-xs text-red-600 truncate max-w-[180px]">
                                  [{i.severity}] {i.title}
                                </div>
                              ))}
                              {sIssues.length > 2 && (
                                <div className="text-xs text-gray-400">+{sIssues.length - 2} 项</div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{owner}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{s.startDate}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{s.endDate}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* B. Weekly report body */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">B. 项目周报</h2>
              <CopyButton text={buildWeeklyReport()} sectionId="weekly-b" />
            </div>
            <div className="p-6 space-y-6">
              {/* Basic info */}
              <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">项目名称：</span>
                  <span className="font-medium text-gray-900">国微电子 HIAgent AI 智能体项目</span>
                </div>
                <div>
                  <span className="text-gray-500">报告周期：</span>
                  <span className="font-medium text-gray-900">{formatDate(weekMonday)} - {formatDate(weekFriday)}</span>
                </div>
                <div>
                  <span className="text-gray-500">填报日期：</span>
                  <span className="font-medium text-gray-900">{formatDate(today)}</span>
                </div>
              </div>

              {/* 1. Issues */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">1. 问题及风险</h3>
                {(() => {
                  const reportableIssues = issues.filter(
                    i => (i.severity === '严重' || i.severity === '一般') && i.status !== '已关闭'
                  )
                  if (reportableIssues.length === 0) {
                    return <p className="text-sm text-gray-400 pl-2">暂无重要问题</p>
                  }
                  return (
                    <div className="space-y-3">
                      {reportableIssues.map(i => (
                        <div key={i.id} className={`rounded-lg border-l-[3px] p-3 ${
                          i.severity === '严重' ? 'border-l-red-500 bg-red-50/60' : 'border-l-amber-500 bg-amber-50/60'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                              i.severity === '严重' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                            }`}>{i.severity}</span>
                            <span className="text-sm font-medium text-gray-900">{i.title}</span>
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-xs text-gray-500 mt-2">
                            <div>发现：{i.createdAt}</div>
                            <div>对策：{i.resolution || '待制定'}</div>
                            <div>进展：{i.status}</div>
                            <div>责任人：{getMember(i.assigneeId)?.name || i.assigneeId}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>

              {/* 2. Milestones */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">2. 项目里程碑</h3>
                <div className="space-y-2">
                  {milestones.map(m => {
                    const statusColor = m.status === '已完成' ? 'bg-green-100 text-green-700' :
                      m.status === '进行中' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                    return (
                      <div key={m.id} className="flex items-center gap-3 text-sm">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>
                          {m.status}
                        </span>
                        <span className="text-gray-400 text-xs">{m.code}</span>
                        <span className="text-gray-800">{m.name}</span>
                        <span className="text-gray-400 text-xs ml-auto">{m.date}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 3. This week progress */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">3. 本周进展</h3>
                {completedThisWeek.length === 0 && inProgressThisWeek.length === 0 ? (
                  <p className="text-sm text-gray-400 pl-2">暂无记录</p>
                ) : (
                  <div className="space-y-3">
                    {completedThisWeek.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-green-600 mb-1">已完成（{completedThisWeek.length}）</div>
                        <ul className="space-y-1">
                          {completedThisWeek.map(t => (
                            <li key={t.id} className="text-sm text-gray-700 pl-2">
                              - {t.title}（{getMember(t.assigneeId)?.name || t.assigneeId}）
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {inProgressThisWeek.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-blue-600 mb-1">进行中（{inProgressThisWeek.length}）</div>
                        <ul className="space-y-1">
                          {inProgressThisWeek.map(t => (
                            <li key={t.id} className="text-sm text-gray-700 pl-2">
                              - {t.title}（{getMember(t.assigneeId)?.name || t.assigneeId}）
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 4. Next week plan */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">4. 下周计划</h3>
                {nextWeekTasks.length === 0 ? (
                  <p className="text-sm text-gray-400 pl-2">按 WBS 计划推进</p>
                ) : (
                  <ul className="space-y-1">
                    {nextWeekTasks.map(t => (
                      <li key={t.id} className="text-sm text-gray-700 pl-2">
                        - {t.title}（截止 {t.dueDate}，{getMember(t.assigneeId)?.name || t.assigneeId}）
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Visual Weekly Report ===== */}
      {tab === '可视化周报' && (
        <div className="space-y-6">
          {/* Scenario progress bars */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">场景进度概览</h2>
            <div className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scenarioProgressData} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} />
                  <YAxis type="category" dataKey="name" width={40} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: unknown, _name: unknown, props: unknown) => {
                      const p = props as { payload?: { done?: number; total?: number } }
                      const done = p?.payload?.done ?? 0
                      const total = p?.payload?.total ?? 0
                      return [`${value}% (${done}/${total})`, '完成率']
                    }}
                  />
                  <Bar dataKey="progress" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Issue severity pie */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-800 mb-4">未关闭问题严重程度分布</h2>
              {severityPieData.length === 0 ? (
                <div className="h-[240px] flex items-center justify-center text-sm text-gray-400">
                  暂无未关闭问题
                </div>
              ) : (
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={severityPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }: { name?: string; value?: number }) => `${name ?? ''}: ${value ?? ''}`}
                      >
                        {severityPieData.map((entry, idx) => (
                          <Cell key={idx} fill={SEVERITY_COLORS[entry.name] || '#6b7280'} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Week task stats */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-800 mb-4">本周任务统计</h2>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekTaskData} margin={{ left: 0, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
                      {weekTaskData.map((entry, idx) => (
                        <Cell
                          key={idx}
                          fill={
                            entry.name === '已完成' ? '#22c55e' :
                            entry.name === '进行中' ? '#3b82f6' :
                            entry.name === '逾期' ? '#ef4444' : '#8b5cf6'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Milestone timeline */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">里程碑进度</h2>
            <div className="flex items-start gap-0 overflow-x-auto pb-2">
              {milestoneData.map((m, idx) => {
                const statusColor = m.status === '已完成' ? 'bg-green-500' :
                  m.status === '进行中' ? 'bg-blue-500' : 'bg-gray-300'
                const textColor = m.status === '已完成' ? 'text-green-700' :
                  m.status === '进行中' ? 'text-blue-700' : 'text-gray-500'
                const isPast = m.date <= today

                return (
                  <div key={m.code} className="flex items-start flex-1 min-w-[120px]">
                    <div className="flex flex-col items-center">
                      <div className={`w-4 h-4 rounded-full ${statusColor} flex-shrink-0 z-10`} />
                      {idx < milestoneData.length - 1 && (
                        <div className={`w-full h-0.5 mt-[-8px] ${isPast ? 'bg-green-300' : 'bg-gray-200'}`} />
                      )}
                      <div className="mt-2 text-center px-1">
                        <div className={`text-xs font-semibold ${textColor}`}>{m.name}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{m.code}</div>
                        <div className="text-[10px] text-gray-400">{m.date}</div>
                        <div className={`text-[10px] font-medium mt-1 ${textColor}`}>{m.status}</div>
                      </div>
                    </div>
                    {idx < milestoneData.length - 1 && (
                      <div className={`flex-1 h-0.5 mt-[7px] ${isPast ? 'bg-green-300' : 'bg-gray-200'}`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
