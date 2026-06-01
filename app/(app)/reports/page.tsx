'use client'

import { useState } from 'react'
import { useData } from '@/lib/data-context'
import { FileText, Copy, Check } from 'lucide-react'

const TODAY = '2026-05-31'

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

type Tab = '日报' | '周报'

export default function ReportsPage() {
  const { tasks, deliverables, issues, meetings, milestones, team, ready } = useData()
  const [tab, setTab] = useState<Tab>('日报')
  const [copied, setCopied] = useState(false)

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-gray-400">加载中...</div>
      </div>
    )
  }

  const getMemberName = (id: string) => team.find(m => m.id === id)?.name ?? id

  // --- Daily report data ---
  const inProgressTasks = tasks.filter(t => t.status === '进行中')
  const overdueTasks = tasks.filter(t => t.status !== '已完成' && t.dueDate < TODAY)
  const todayIssues = issues.filter(i => i.createdAt === TODAY)
  const twoDaysLater = addDays(TODAY, 2)
  const upcomingMeetings = meetings.filter(m => m.status === '即将召开' && m.date >= TODAY && m.date <= twoDaysLater)

  // --- Weekly report data ---
  const weekStart = addDays(TODAY, -7)
  const completedThisWeek = tasks.filter(t => t.status === '已完成' && t.updatedAt >= weekStart && t.updatedAt <= TODAY)
  const deliverablesByStatus: Record<string, number> = {}
  deliverables.forEach(d => {
    deliverablesByStatus[d.status] = (deliverablesByStatus[d.status] || 0) + 1
  })
  const openIssues = issues.filter(i => i.status !== '已解决' && i.status !== '已关闭')
  const severeIssues = openIssues.filter(i => i.severity === '严重')

  function buildDailyText(): string {
    const lines: string[] = []
    lines.push(`===== 项目日报 ${TODAY} =====`)
    lines.push('')

    lines.push('【进行中任务】')
    if (inProgressTasks.length === 0) {
      lines.push('  无')
    } else {
      inProgressTasks.forEach(t => {
        lines.push(`  - ${t.title}（负责人: ${getMemberName(t.assigneeId)}，截止: ${t.dueDate}）`)
      })
    }
    lines.push('')

    lines.push('【逾期任务】')
    if (overdueTasks.length === 0) {
      lines.push('  无')
    } else {
      overdueTasks.forEach(t => {
        lines.push(`  - ${t.title}（负责人: ${getMemberName(t.assigneeId)}，截止: ${t.dueDate}）`)
      })
    }
    lines.push('')

    lines.push('【今日新增问题】')
    if (todayIssues.length === 0) {
      lines.push('  无')
    } else {
      todayIssues.forEach(i => {
        lines.push(`  - [${i.severity}] ${i.title}（负责人: ${getMemberName(i.assigneeId)}）`)
      })
    }
    lines.push('')

    lines.push('【近期会议】')
    if (upcomingMeetings.length === 0) {
      lines.push('  无')
    } else {
      upcomingMeetings.forEach(m => {
        lines.push(`  - ${m.title}（${m.date} ${m.time}，${m.location}）`)
      })
    }

    return lines.join('\n')
  }

  function buildWeeklyText(): string {
    const lines: string[] = []
    lines.push(`===== 项目周报 ${weekStart} ~ ${TODAY} =====`)
    lines.push('')

    lines.push('【本周完成任务】')
    lines.push(`  共完成 ${completedThisWeek.length} 项`)
    completedThisWeek.forEach(t => {
      lines.push(`  - ${t.title}（${getMemberName(t.assigneeId)}）`)
    })
    lines.push('')

    lines.push('【交付物状态汇总】')
    Object.entries(deliverablesByStatus).forEach(([status, count]) => {
      lines.push(`  ${status}: ${count} 项`)
    })
    lines.push('')

    lines.push('【问题统计】')
    lines.push(`  未解决问题: ${openIssues.length} 项`)
    lines.push(`  其中严重: ${severeIssues.length} 项`)
    if (severeIssues.length > 0) {
      severeIssues.forEach(i => {
        lines.push(`    - ${i.title}（${i.status}，负责人: ${getMemberName(i.assigneeId)}）`)
      })
    }
    lines.push('')

    lines.push('【里程碑进度】')
    milestones.forEach(m => {
      const icon = m.status === '已完成' ? '[done]' : m.status === '进行中' ? '[doing]' : '[todo]'
      lines.push(`  ${icon} ${m.code} ${m.name}（${m.date}）`)
    })

    return lines.join('\n')
  }

  const reportText = tab === '日报' ? buildDailyText() : buildWeeklyText()

  function handleCopy() {
    navigator.clipboard.writeText(reportText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
            <FileText size={20} className="text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">报告</h1>
            <p className="text-sm text-gray-500">生成日报与周报，一键复制到微信</p>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? '已复制' : '复制到剪贴板'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {(['日报', '周报'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Report preview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
          {reportText}
        </pre>
      </div>
    </div>
  )
}
