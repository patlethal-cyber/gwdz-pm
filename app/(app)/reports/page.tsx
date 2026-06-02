'use client'

import { useState, useMemo } from 'react'
import { useData } from '@/lib/data-context'
import { FileText, Copy, Check, BarChart3 } from 'lucide-react'
import dynamic from 'next/dynamic'

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

// 懒加载 recharts 图表（ssr:false）——把图表库从首屏 bundle 拆出（E）
const VizCharts = dynamic(() => import('@/components/reports/VizCharts'), {
  ssr: false,
  loading: () => (
    <div className="h-[360px] rounded-xl border border-gray-200 bg-gray-50 animate-pulse flex items-center justify-center text-sm text-gray-500">
      图表加载中…
    </div>
  ),
})

const EXECUTION_GROUPS = ['第二执行组', '第一执行组', '专项支持'] as const
const GROUP_LABELS: Record<string, string> = {
  '第二执行组': '第二执行组（客质部）',
  '第一执行组': '第一执行组（测试部）',
  '专项支持': '专项支持（插件/数据）',
}
const GROUP_MEMBER_IDS: Record<string, string[]> = {
  '第二执行组': ['m02', 'm06', 'm07'],
  '第一执行组': ['m03', 'm04', 'm05'],
  '专项支持': ['m08', 'm09'],
}

function getYesterday(todayStr: string): string {
  const d = new Date(todayStr + 'T00:00:00')
  const day = d.getDay()
  // If Monday (1), yesterday is Friday (-3); if Sunday (0), use Friday (-2); otherwise -1
  const offset = day === 1 ? -3 : day === 0 ? -2 : -1
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
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

  const overdueTasks = getOverdueTasks()

  // Weekly data
  const completedThisWeek = tasks.filter(
    t => t.status === '已完成' && t.updatedAt >= weekMonday && t.updatedAt <= weekFriday
  )
  const inProgressThisWeek = tasks.filter(t => t.status === '进行中')
  const nextWeekTasks = tasks.filter(
    t => t.status !== '已完成' && t.dueDate >= nextMonday && t.dueDate <= nextFriday
  )

  const yesterday = getYesterday(today)

  // Tasks that were active yesterday (in progress or completed yesterday)
  const yesterdayTasks = tasks.filter(t =>
    (t.status === '进行中' || t.status === '审核中') ||
    (t.status === '已完成' && t.updatedAt >= yesterday)
  )

  // Tasks planned for today (not completed, due near today)
  const todayPlannedTasks = tasks.filter(t =>
    t.status !== '已完成' && t.dueDate <= addDays(today, 7)
  )

  // Open issues + overdue tasks for risk section
  const openIssues = issues.filter(i => i.status !== '已解决' && i.status !== '已关闭')

  // Group tasks by execution group
  function getTaskGroup(t: typeof tasks[0]): string {
    // Check if assignee belongs to a known group
    for (const [group, memberIds] of Object.entries(GROUP_MEMBER_IDS)) {
      if (memberIds.includes(t.assigneeId)) return group
    }
    // PM tasks go to project management, but we skip them in the 3-group view
    return '项目管理'
  }

  function groupTasksByExecution(taskList: typeof tasks) {
    const grouped: Record<string, typeof tasks> = {}
    for (const g of EXECUTION_GROUPS) grouped[g] = []
    for (const t of taskList) {
      const group = getTaskGroup(t)
      if (grouped[group]) grouped[group].push(t)
    }
    return grouped
  }

  // ===== Builders =====

  function buildSection1Text(): string {
    const lines: string[] = []
    lines.push('一、主计划（总计划）')
    lines.push('序号 | 大计划项 | 计划节点 | 计划时间 | 当前实际情况 | 责任人 | 备注')
    lines.push('--- | --- | --- | --- | --- | --- | ---')
    milestones.forEach((m, idx) => {
      const statusLabel = m.status === '已完成' ? '已完成' : m.status === '进行中' ? '进行中' : '待开始'
      lines.push(`${idx + 1} | ${m.code} ${m.name} | ${m.description} | ${m.date} | ${statusLabel} | 李培嵩 | `)
    })
    return lines.join('\n')
  }

  function buildSection2Text(): string {
    const lines: string[] = []
    lines.push('二、已办（昨日）')
    lines.push('序号 | 小组 | 昨日计划任务 | 当前进展稽核验收情况 | 偏差分析 | 纠偏措施 | 备注')
    lines.push('--- | --- | --- | --- | --- | --- | ---')
    const grouped = groupTasksByExecution(yesterdayTasks)
    let seq = 1
    for (const group of EXECUTION_GROUPS) {
      const groupTasks = grouped[group]
      if (groupTasks.length === 0) {
        lines.push(`${seq} | ${GROUP_LABELS[group] || group} | 无 | - | - | - | `)
        seq++
        continue
      }
      for (const t of groupTasks) {
        const assignee = getMember(t.assigneeId)?.name || t.assigneeId
        const scenario = t.scenarioId ? getScenario(t.scenarioId) : null
        const prefix = scenario ? `[${scenario.code}] ` : ''
        const progress = t.status === '已完成' ? '已完成' : t.status === '审核中' ? '审核中' : '进行中'
        const deviation = t.dueDate < today && t.status !== '已完成' ? '逾期' : '无偏差'
        const correction = deviation === '逾期' ? '加速推进' : ''
        lines.push(`${seq} | ${GROUP_LABELS[group] || group} | ${prefix}${t.title}（${assignee}） | ${progress} | ${deviation} | ${correction} | `)
        seq++
      }
    }
    return lines.join('\n')
  }

  function buildSection3Text(): string {
    const lines: string[] = []
    lines.push('三、待办（今日）')
    lines.push('序号 | 小组 | 今日任务项内容 | 计划时间 | 完成要求标准 | 责任人 | 备注')
    lines.push('--- | --- | --- | --- | --- | --- | ---')
    const grouped = groupTasksByExecution(todayPlannedTasks)
    let seq = 1
    for (const group of EXECUTION_GROUPS) {
      const groupTasks = grouped[group]
      if (groupTasks.length === 0) {
        lines.push(`${seq} | ${GROUP_LABELS[group] || group} | 无 | - | - | - | `)
        seq++
        continue
      }
      for (const t of groupTasks) {
        const assignee = getMember(t.assigneeId)?.name || t.assigneeId
        const scenario = t.scenarioId ? getScenario(t.scenarioId) : null
        const prefix = scenario ? `[${scenario.code}] ` : ''
        const standard = t.status === '待办' ? '完成并提交' : '持续推进'
        lines.push(`${seq} | ${GROUP_LABELS[group] || group} | ${prefix}${t.title} | ${t.dueDate} | ${standard} | ${assignee} | `)
        seq++
      }
    }
    return lines.join('\n')
  }

  function buildSection4Text(): string {
    const lines: string[] = []
    lines.push('四、风险问题等事项')
    lines.push('序号 | 风险/其他事项 | 描述 | 拟处置的措施策略 | 所需资源 | 责任人 | 备注')
    lines.push('--- | --- | --- | --- | --- | --- | ---')
    let seq = 1
    // Open issues
    for (const i of openIssues) {
      const assignee = getMember(i.assigneeId)?.name || i.assigneeId
      const measure = i.resolution || '待制定'
      lines.push(`${seq} | [${i.severity}] ${i.title} | ${i.description.slice(0, 60)} | ${measure} | - | ${assignee} | `)
      seq++
    }
    // Overdue tasks as risks
    for (const t of overdueTasks) {
      const assignee = getMember(t.assigneeId)?.name || t.assigneeId
      lines.push(`${seq} | [逾期] ${t.title} | 截止 ${t.dueDate}，当前未完成 | 加速推进，协调资源 | - | ${assignee} | `)
      seq++
    }
    if (seq === 1) {
      lines.push('1 | 无 | - | - | - | - | ')
    }
    return lines.join('\n')
  }

  function buildDailyText(): string {
    const lines: string[] = []
    lines.push(`国微电子 HIAgent AI 智能体项目 — 项目早会日报`)
    lines.push(`日期：${today}（昨日：${yesterday}）`)
    lines.push(`驻场人员：${onsiteStaff}`)
    lines.push('')
    lines.push(buildSection1Text())
    lines.push('')
    lines.push(buildSection2Text())
    lines.push('')
    lines.push(buildSection3Text())
    lines.push('')
    lines.push(buildSection4Text())
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
          <h1 className="text-xl font-bold text-gray-900">项目早会日报 / 周报</h1>
          <p className="text-sm text-gray-500">基于早会指南 V1.4 模板，一键生成日报与周报</p>
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

      {/* ===== Daily Report (项目早会日报) ===== */}
      {tab === '日报' && (() => {
        const grouped2 = groupTasksByExecution(yesterdayTasks)
        const grouped3 = groupTasksByExecution(todayPlannedTasks)
        return (
        <div className="space-y-5">
          {/* Header card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-900">项目早会日报</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {today}（昨日：{yesterday}）
                </p>
              </div>
              <CopyButton text={buildDailyText()} sectionId="daily-all" />
            </div>
            <div className="px-6 py-3">
              <label className="text-xs font-medium text-gray-500 block mb-1">驻场人员</label>
              <input
                type="text"
                value={onsiteStaff}
                onChange={e => setOnsiteStaff(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Section 1: 主计划 */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <span className="w-5 h-5 bg-blue-600 text-white rounded text-xs flex items-center justify-center font-bold">1</span>
                主计划（总计划）
              </h3>
              <CopyButton text={buildSection1Text()} sectionId="daily-s1" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 w-10">序号</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500">大计划项</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500">计划节点</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 w-24">计划时间</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 w-20">当前实际情况</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 w-16">责任人</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 w-16">备注</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {milestones.map((m, idx) => {
                    const statusColor = m.status === '已完成' ? 'text-green-700 bg-green-50' :
                      m.status === '进行中' ? 'text-blue-700 bg-blue-50' : 'text-gray-500 bg-gray-100'
                    const isOverdue = m.status !== '已完成' && m.date < today
                    return (
                      <tr key={m.id} className={`hover:bg-gray-50/50 ${isOverdue ? 'bg-red-50/30' : ''}`}>
                        <td className="px-3 py-2.5 text-gray-500">{idx + 1}</td>
                        <td className="px-3 py-2.5 font-medium text-gray-900">
                          <span className="text-xs text-gray-500 mr-1">{m.code}</span>
                          {m.name}
                        </td>
                        <td className="px-3 py-2.5 text-gray-600 text-xs">{m.description}</td>
                        <td className="px-3 py-2.5 text-xs text-gray-500">{m.date}</td>
                        <td className="px-3 py-2.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>
                            {m.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-gray-600">李培嵩</td>
                        <td className="px-3 py-2.5 text-xs text-gray-500">
                          {isOverdue && <span className="text-red-500 font-medium">已逾期</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: 已办（昨日） */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <span className="w-5 h-5 bg-emerald-600 text-white rounded text-xs flex items-center justify-center font-bold">2</span>
                已办（昨日 {yesterday}）
              </h3>
              <CopyButton text={buildSection2Text()} sectionId="daily-s2" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 w-10">序号</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 w-36">小组</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500">昨日计划任务</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 w-24">进展稽核</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 w-20">偏差分析</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 w-20">纠偏措施</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 w-16">备注</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(() => {
                    let seq = 0
                    return EXECUTION_GROUPS.flatMap(group => {
                      const groupTasks = grouped2[group]
                      if (groupTasks.length === 0) {
                        seq++
                        return [(
                          <tr key={`${group}-empty`} className="hover:bg-gray-50/50">
                            <td className="px-3 py-2.5 text-gray-500">{seq}</td>
                            <td className="px-3 py-2.5 text-xs font-medium text-gray-600">{GROUP_LABELS[group]}</td>
                            <td className="px-3 py-2.5 text-gray-500 text-xs">无</td>
                            <td className="px-3 py-2.5 text-gray-500 text-xs">-</td>
                            <td className="px-3 py-2.5 text-gray-500 text-xs">-</td>
                            <td className="px-3 py-2.5 text-gray-500 text-xs">-</td>
                            <td className="px-3 py-2.5" />
                          </tr>
                        )]
                      }
                      return groupTasks.map((t, tIdx) => {
                        seq++
                        const assignee = getMember(t.assigneeId)?.name || t.assigneeId
                        const scenario = t.scenarioId ? getScenario(t.scenarioId) : null
                        const progress = t.status === '已完成' ? '已完成' : t.status === '审核中' ? '审核中' : '进行中'
                        const progressColor = t.status === '已完成' ? 'text-green-700 bg-green-50' :
                          t.status === '审核中' ? 'text-amber-700 bg-amber-50' : 'text-blue-700 bg-blue-50'
                        const isOverdue = t.dueDate < today && t.status !== '已完成'
                        return (
                          <tr key={t.id} className={`hover:bg-gray-50/50 ${isOverdue ? 'bg-red-50/30' : ''}`}>
                            <td className="px-3 py-2.5 text-gray-500">{seq}</td>
                            <td className="px-3 py-2.5 text-xs font-medium text-gray-600">
                              {tIdx === 0 ? GROUP_LABELS[group] : ''}
                            </td>
                            <td className="px-3 py-2.5 text-gray-800">
                              {scenario && (
                                <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded mr-1.5">
                                  {scenario.code}
                                </span>
                              )}
                              {t.title}
                              <span className="text-gray-500 text-xs ml-1">({assignee})</span>
                            </td>
                            <td className="px-3 py-2.5">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${progressColor}`}>
                                {progress}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-xs">
                              {isOverdue ? (
                                <span className="text-red-600 font-medium">逾期</span>
                              ) : (
                                <span className="text-gray-500">无偏差</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-xs text-gray-500">
                              {isOverdue ? '加速推进' : ''}
                            </td>
                            <td className="px-3 py-2.5" />
                          </tr>
                        )
                      })
                    })
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: 待办（今日） */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <span className="w-5 h-5 bg-violet-600 text-white rounded text-xs flex items-center justify-center font-bold">3</span>
                待办（今日 {today}）
              </h3>
              <CopyButton text={buildSection3Text()} sectionId="daily-s3" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 w-10">序号</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 w-36">小组</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500">今日任务项内容</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 w-24">计划时间</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 w-24">完成要求标准</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 w-16">责任人</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 w-16">备注</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(() => {
                    let seq = 0
                    return EXECUTION_GROUPS.flatMap(group => {
                      const groupTasks = grouped3[group]
                      if (groupTasks.length === 0) {
                        seq++
                        return [(
                          <tr key={`${group}-empty`} className="hover:bg-gray-50/50">
                            <td className="px-3 py-2.5 text-gray-500">{seq}</td>
                            <td className="px-3 py-2.5 text-xs font-medium text-gray-600">{GROUP_LABELS[group]}</td>
                            <td className="px-3 py-2.5 text-gray-500 text-xs">无</td>
                            <td className="px-3 py-2.5 text-gray-500 text-xs">-</td>
                            <td className="px-3 py-2.5 text-gray-500 text-xs">-</td>
                            <td className="px-3 py-2.5 text-gray-500 text-xs">-</td>
                            <td className="px-3 py-2.5" />
                          </tr>
                        )]
                      }
                      return groupTasks.map((t, tIdx) => {
                        seq++
                        const assignee = getMember(t.assigneeId)?.name || t.assigneeId
                        const scenario = t.scenarioId ? getScenario(t.scenarioId) : null
                        const isUrgent = t.priority === '紧急' || t.priority === '高'
                        return (
                          <tr key={t.id} className={`hover:bg-gray-50/50 ${isUrgent ? 'bg-amber-50/30' : ''}`}>
                            <td className="px-3 py-2.5 text-gray-500">{seq}</td>
                            <td className="px-3 py-2.5 text-xs font-medium text-gray-600">
                              {tIdx === 0 ? GROUP_LABELS[group] : ''}
                            </td>
                            <td className="px-3 py-2.5 text-gray-800">
                              {scenario && (
                                <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded mr-1.5">
                                  {scenario.code}
                                </span>
                              )}
                              {t.title}
                              {isUrgent && (
                                <span className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded ml-1.5">
                                  {t.priority}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-xs text-gray-500">{t.dueDate}</td>
                            <td className="px-3 py-2.5 text-xs text-gray-600">
                              {t.status === '待办' ? '完成并提交' : '持续推进'}
                            </td>
                            <td className="px-3 py-2.5 text-xs text-gray-600">{assignee}</td>
                            <td className="px-3 py-2.5" />
                          </tr>
                        )
                      })
                    })
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: 风险问题 */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <span className="w-5 h-5 bg-red-600 text-white rounded text-xs flex items-center justify-center font-bold">4</span>
                风险问题等事项
                {(openIssues.length + overdueTasks.length) > 0 && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                    {openIssues.length + overdueTasks.length}
                  </span>
                )}
              </h3>
              <CopyButton text={buildSection4Text()} sectionId="daily-s4" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 w-10">序号</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 w-40">风险/其他事项</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500">描述</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 w-32">拟处置措施</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 w-20">所需资源</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 w-16">责任人</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 w-16">备注</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {openIssues.length === 0 && overdueTasks.length === 0 ? (
                    <tr>
                      <td className="px-3 py-2.5 text-gray-500">1</td>
                      <td colSpan={6} className="px-3 py-2.5 text-gray-500 text-xs">无风险问题</td>
                    </tr>
                  ) : (
                    <>
                      {openIssues.map((i, idx) => {
                        const assignee = getMember(i.assigneeId)?.name || i.assigneeId
                        const sevColor = i.severity === '严重' ? 'text-red-700 bg-red-50' :
                          i.severity === '一般' ? 'text-amber-700 bg-amber-50' :
                          i.severity === '轻微' ? 'text-blue-700 bg-blue-50' : 'text-gray-500 bg-gray-100'
                        return (
                          <tr key={i.id} className="hover:bg-gray-50/50">
                            <td className="px-3 py-2.5 text-gray-500">{idx + 1}</td>
                            <td className="px-3 py-2.5">
                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium mr-1 ${sevColor}`}>
                                {i.severity}
                              </span>
                              <span className="text-gray-800 text-xs">{i.title}</span>
                            </td>
                            <td className="px-3 py-2.5 text-xs text-gray-600 max-w-[200px] truncate">
                              {i.description.slice(0, 80)}
                            </td>
                            <td className="px-3 py-2.5 text-xs text-gray-600">
                              {i.resolution || '待制定'}
                            </td>
                            <td className="px-3 py-2.5 text-xs text-gray-500">-</td>
                            <td className="px-3 py-2.5 text-xs text-gray-600">{assignee}</td>
                            <td className="px-3 py-2.5" />
                          </tr>
                        )
                      })}
                      {overdueTasks.map((t, idx) => {
                        const assignee = getMember(t.assigneeId)?.name || t.assigneeId
                        return (
                          <tr key={t.id} className="hover:bg-gray-50/50 bg-red-50/30">
                            <td className="px-3 py-2.5 text-gray-500">{openIssues.length + idx + 1}</td>
                            <td className="px-3 py-2.5">
                              <span className="text-xs px-1.5 py-0.5 rounded font-medium mr-1 text-red-700 bg-red-50">
                                逾期
                              </span>
                              <span className="text-gray-800 text-xs">{t.title}</span>
                            </td>
                            <td className="px-3 py-2.5 text-xs text-gray-600">
                              截止 {t.dueDate}，当前未完成
                            </td>
                            <td className="px-3 py-2.5 text-xs text-gray-600">
                              加速推进，协调资源
                            </td>
                            <td className="px-3 py-2.5 text-xs text-gray-500">-</td>
                            <td className="px-3 py-2.5 text-xs text-gray-600">{assignee}</td>
                            <td className="px-3 py-2.5" />
                          </tr>
                        )
                      })}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        )
      })()}

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
                        <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          <span className="text-xs text-gray-500 mr-1">{s.code}</span>
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
                            <span className="text-xs text-gray-500">无</span>
                          ) : (
                            <div className="space-y-0.5">
                              {sIssues.slice(0, 2).map(i => (
                                <div key={i.id} className="text-xs text-red-600 truncate max-w-[180px]">
                                  [{i.severity}] {i.title}
                                </div>
                              ))}
                              {sIssues.length > 2 && (
                                <div className="text-xs text-gray-500">+{sIssues.length - 2} 项</div>
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
                    return <p className="text-sm text-gray-500 pl-2">暂无重要问题</p>
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
                        <span className="text-gray-500 text-xs">{m.code}</span>
                        <span className="text-gray-800">{m.name}</span>
                        <span className="text-gray-500 text-xs ml-auto">{m.date}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 3. This week progress */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">3. 本周进展</h3>
                {completedThisWeek.length === 0 && inProgressThisWeek.length === 0 ? (
                  <p className="text-sm text-gray-500 pl-2">暂无记录</p>
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
                  <p className="text-sm text-gray-500 pl-2">按 WBS 计划推进</p>
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

      {/* ===== Visual Weekly Report（recharts 懒加载）===== */}
      {tab === '可视化周报' && (
        <VizCharts
          scenarioProgressData={scenarioProgressData}
          severityPieData={severityPieData}
          weekTaskData={weekTaskData}
          milestoneData={milestoneData}
          today={today}
        />
      )}
    </div>
  )
}
