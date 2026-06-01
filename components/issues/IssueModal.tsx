'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { X, Search, XCircle } from 'lucide-react'
import type { Issue, IssueStatus, IssueSeverity, IssueSource, IssueCategory } from '@/lib/types'
import { useData } from '@/lib/data-context'

const statusOptions: IssueStatus[] = ['待处理', '处理中', '已解决', '已关闭', '已驳回']
const severityOptions: IssueSeverity[] = ['严重', '一般', '轻微', '建议']
const sourceOptions: IssueSource[] = ['甲方反馈', 'UAT测试', '内部发现', '平台问题']
const categoryOptions: { value: IssueCategory; label: string }[] = [
  { value: 'scenario', label: '场景问题' },
  { value: 'project', label: '项目问题' },
]

interface IssueModalProps {
  isOpen: boolean
  onClose: () => void
  issue?: Issue
  onSave: (issue: Issue) => void
}

export default function IssueModal({ isOpen, onClose, issue, onSave }: IssueModalProps) {
  const { team, scenarios, tasks, today } = useData()
  const isEdit = !!issue

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<IssueStatus>('待处理')
  const [severity, setSeverity] = useState<IssueSeverity>('一般')
  const [source, setSource] = useState<IssueSource>('内部发现')
  const [category, setCategory] = useState<IssueCategory>('scenario')
  const [assigneeId, setAssigneeId] = useState('')
  const [scenarioId, setScenarioId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [linkedTaskIds, setLinkedTaskIds] = useState<string[]>([])
  const [resolution, setResolution] = useState('')

  // Task search state
  const [taskSearch, setTaskSearch] = useState('')
  const [showTaskDropdown, setShowTaskDropdown] = useState(false)
  const taskSearchRef = useRef<HTMLInputElement>(null)
  const taskDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (issue) {
      setTitle(issue.title)
      setDescription(issue.description)
      setStatus(issue.status)
      setSeverity(issue.severity)
      setSource(issue.source)
      setCategory(issue.category || 'scenario')
      setAssigneeId(issue.assigneeId)
      setScenarioId(issue.scenarioId || '')
      setDueDate(issue.dueDate || '')
      setLinkedTaskIds(issue.linkedTaskIds || [])
      setResolution(issue.resolution || '')
    } else {
      setTitle('')
      setDescription('')
      setStatus('待处理')
      setSeverity('一般')
      setSource('内部发现')
      setCategory('scenario')
      setAssigneeId('')
      setScenarioId('')
      setDueDate('')
      setLinkedTaskIds([])
      setResolution('')
    }
    setTaskSearch('')
    setShowTaskDropdown(false)
  }, [issue, isOpen])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  // Close task dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        taskDropdownRef.current && !taskDropdownRef.current.contains(e.target as Node) &&
        taskSearchRef.current && !taskSearchRef.current.contains(e.target as Node)
      ) {
        setShowTaskDropdown(false)
      }
    }
    if (showTaskDropdown) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
  }, [showTaskDropdown])

  const filteredTasks = useMemo(() => {
    const q = taskSearch.trim().toLowerCase()
    return tasks.filter(t => {
      if (linkedTaskIds.includes(t.id)) return false
      if (!q) return true
      return t.title.toLowerCase().includes(q)
    }).slice(0, 10)
  }, [tasks, taskSearch, linkedTaskIds])

  function addLinkedTask(taskId: string) {
    setLinkedTaskIds(prev => [...prev, taskId])
    setTaskSearch('')
    setShowTaskDropdown(false)
  }

  function removeLinkedTask(taskId: string) {
    setLinkedTaskIds(prev => prev.filter(id => id !== taskId))
  }

  function handleSave() {
    if (!title.trim()) return
    const showResolution = status === '已解决' || status === '已关闭'
    const saved: Issue = {
      id: issue?.id || ('iss' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)),
      title: title.trim(),
      description: description.trim(),
      status,
      severity,
      source,
      category,
      reporterId: issue?.reporterId || 'm01',
      assigneeId,
      scenarioId: category === 'scenario' ? (scenarioId || undefined) : undefined,
      dueDate: dueDate || undefined,
      linkedTaskIds,
      resolution: showResolution ? resolution.trim() || undefined : undefined,
      createdAt: issue?.createdAt || today,
      updatedAt: today,
      resolvedAt: (status === '已解决' || status === '已关闭') ? (issue?.resolvedAt || today) : undefined,
    }
    onSave(saved)
    onClose()
  }

  if (!isOpen) return null

  const showResolution = status === '已解决' || status === '已关闭'

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-bold text-gray-900">
            {isEdit ? '编辑问题' : '新建问题'}
          </h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">标题 *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="输入问题标题..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">描述</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="问题详细描述..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Status + Severity row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">状态</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as IssueStatus)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">严重度</label>
              <select
                value={severity}
                onChange={e => setSeverity(e.target.value as IssueSeverity)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {severityOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Source + Category row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">来源</label>
              <select
                value={source}
                onChange={e => setSource(e.target.value as IssueSource)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {sourceOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">分类</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as IssueCategory)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {categoryOptions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          {/* Assignee + Due Date row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">负责人</label>
              <select
                value={assigneeId}
                onChange={e => setAssigneeId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">选择负责人...</option>
                {team.map(m => <option key={m.id} value={m.id}>{m.name} - {m.role}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">计划解决日期</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>
          </div>

          {/* Scenario (conditional) */}
          {category === 'scenario' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">关联场景</label>
              <select
                value={scenarioId}
                onChange={e => setScenarioId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">无</option>
                {scenarios.map(s => <option key={s.id} value={s.id}>{s.code} {s.name}</option>)}
              </select>
            </div>
          )}

          {/* Linked Tasks - multi-select with search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              关联任务
              {linkedTaskIds.length > 0 && (
                <span className="ml-1.5 text-xs text-gray-400 font-normal">({linkedTaskIds.length})</span>
              )}
            </label>

            {/* Selected task chips */}
            {linkedTaskIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {linkedTaskIds.map(tid => {
                  const t = tasks.find(tk => tk.id === tid)
                  if (!t) return null
                  return (
                    <span
                      key={tid}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-md border border-blue-200"
                    >
                      <span className="max-w-[160px] truncate">{t.title}</span>
                      <button
                        onClick={() => removeLinkedTask(tid)}
                        className="text-blue-400 hover:text-blue-600 flex-shrink-0"
                      >
                        <XCircle size={14} />
                      </button>
                    </span>
                  )
                })}
              </div>
            )}

            {/* Task search input */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={taskSearchRef}
                type="text"
                value={taskSearch}
                onChange={e => { setTaskSearch(e.target.value); setShowTaskDropdown(true) }}
                onFocus={() => setShowTaskDropdown(true)}
                placeholder="搜索任务名称..."
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              {showTaskDropdown && filteredTasks.length > 0 && (
                <div
                  ref={taskDropdownRef}
                  className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-10 max-h-[200px] overflow-y-auto"
                >
                  {filteredTasks.map(t => (
                    <button
                      key={t.id}
                      onMouseDown={e => { e.preventDefault(); addLinkedTask(t.id) }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      <span className="line-clamp-1">{t.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Resolution - conditional */}
          {showResolution && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">解决方案</label>
              <textarea
                value={resolution}
                onChange={e => setResolution(e.target.value)}
                placeholder="描述解决方案..."
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isEdit ? '保存修改' : '创建问题'}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slideIn 0.25s ease-out;
        }
      `}</style>
    </div>
  )
}
