'use client'

import { useState, useMemo, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import IssueSummary from '@/components/issues/IssueSummary'
import IssueList from '@/components/issues/IssueList'
import IssueModal from '@/components/issues/IssueModal'
import { useData } from '@/lib/data-context'
import type { Issue, IssueStatus, IssueSeverity, IssueSource } from '@/lib/types'

const statusOptions: IssueStatus[] = ['待处理', '处理中', '已解决', '已关闭', '已驳回']
const severityOptions: IssueSeverity[] = ['严重', '一般', '轻微', '建议']
const sourceOptions: IssueSource[] = ['甲方反馈', 'UAT测试', '内部发现', '平台问题']

export default function IssuesPage() {
  const { issues, addIssue, updateIssue, deleteIssue, team, scenarios, tasks, today, ready } = useData()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [modalOpen, setModalOpen] = useState(false)
  const [editIssue, setEditIssue] = useState<Issue | undefined>(undefined)

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterSeverity, setFilterSeverity] = useState<string>('')
  const [filterSource, setFilterSource] = useState<string>('')
  const [filterScenario, setFilterScenario] = useState<string>('')
  const [filterAssignee, setFilterAssignee] = useState<string>('')

  // Read URL params on mount for dashboard drill-down
  useEffect(() => {
    const urlSeverity = searchParams.get('severity')
    const urlStatus = searchParams.get('status')
    if (urlSeverity && severityOptions.includes(urlSeverity as IssueSeverity)) {
      setFilterSeverity(urlSeverity)
    }
    if (urlStatus && statusOptions.includes(urlStatus as IssueStatus)) {
      setFilterStatus(urlStatus)
    }
  }, [searchParams])

  // Handle ?open=issueId from global search
  useEffect(() => {
    if (!ready) return
    const openId = searchParams.get('open')
    if (!openId) return
    const target = issues.find(i => i.id === openId)
    if (target) {
      setEditIssue(target)
      setModalOpen(true)
    }
    router.replace('/issues', { scroll: false })
  }, [searchParams, ready, issues, router])

  const hasFilters = filterStatus || filterSeverity || filterSource || filterScenario || filterAssignee

  function handleEdit(issue: Issue) {
    setEditIssue(issue)
    setModalOpen(true)
  }

  function handleCreate() {
    setEditIssue(undefined)
    setModalOpen(true)
  }

  function handleSave(saved: Issue) {
    const exists = issues.some(i => i.id === saved.id)
    if (exists) {
      updateIssue(saved.id, saved)
    } else {
      const { id, createdAt, updatedAt, ...rest } = saved
      addIssue(rest)
    }
  }

  function handleStatusFilter(status: IssueStatus | null) {
    setFilterStatus(status || '')
  }

  const filtered = useMemo(() => {
    let result = issues
    if (filterStatus) result = result.filter(i => i.status === filterStatus)
    if (filterSeverity) result = result.filter(i => i.severity === filterSeverity)
    if (filterSource) result = result.filter(i => i.source === filterSource)
    if (filterScenario) result = result.filter(i => i.scenarioId === filterScenario)
    if (filterAssignee) result = result.filter(i => i.assigneeId === filterAssignee)
    return result
  }, [issues, filterStatus, filterSeverity, filterSource, filterScenario, filterAssignee])

  // Unique assignees from current issues
  const assigneeIds = [...new Set(issues.map(i => i.assigneeId).filter(Boolean))]
  const assigneeMembers = assigneeIds.map(id => team.find(m => m.id === id)).filter(Boolean)

  // Unique scenarios from current issues
  const scenarioIds = [...new Set(issues.map(i => i.scenarioId).filter(Boolean))] as string[]
  const issueScenarios = scenarioIds.map(id => scenarios.find(s => s.id === id)).filter(Boolean)

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="问题跟踪"
        subtitle={`共 ${issues.length} 个问题`}
        actions={
          <button
            onClick={handleCreate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <Plus size={15} />
            新建问题
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Summary with clickable status pills */}
        <IssueSummary
          issues={issues}
          onStatusFilter={handleStatusFilter}
          activeStatus={(filterStatus as IssueStatus) || null}
        />

        {/* Filter bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-gray-500 font-medium">筛选：</span>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部状态</option>
            {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filterSeverity}
            onChange={e => setFilterSeverity(e.target.value)}
            className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部严重度</option>
            {severityOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filterSource}
            onChange={e => setFilterSource(e.target.value)}
            className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部来源</option>
            {sourceOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filterScenario}
            onChange={e => setFilterScenario(e.target.value)}
            className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部场景</option>
            {issueScenarios.map(s => s && <option key={s.id} value={s.id}>{s.code} {s.name}</option>)}
          </select>
          <select
            value={filterAssignee}
            onChange={e => setFilterAssignee(e.target.value)}
            className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部负责人</option>
            {assigneeMembers.map(m => m && <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          {hasFilters && (
            <button
              onClick={() => {
                setFilterStatus('')
                setFilterSeverity('')
                setFilterSource('')
                setFilterScenario('')
                setFilterAssignee('')
              }}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              清除筛选
            </button>
          )}
          <span className="ml-auto text-xs text-gray-500">{filtered.length} 个问题</span>
        </div>

        {/* Issue table */}
        <IssueList
          issues={filtered}
          onEdit={handleEdit}
          team={team}
          scenarios={scenarios}
          tasks={tasks}
          today={today}
        />
      </div>

      <IssueModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditIssue(undefined) }}
        issue={editIssue}
        onSave={handleSave}
        onDelete={deleteIssue}
      />
    </div>
  )
}
