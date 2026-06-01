'use client'

import { useEffect, useState, useCallback } from 'react'
import { X } from 'lucide-react'
import type { Issue, IssueStatus, IssueSeverity, IssueSource } from '@/lib/types'
import { team, scenarios, tasks } from '@/lib/store'

const statusOptions: IssueStatus[] = ['待处理', '处理中', '已解决', '已关闭', '已驳回']
const severityOptions: IssueSeverity[] = ['严重', '一般', '轻微', '建议']
const sourceOptions: IssueSource[] = ['甲方反馈', 'UAT测试', '内部发现', '平台问题']

interface IssueModalProps {
  isOpen: boolean
  onClose: () => void
  issue?: Issue
  onSave: (issue: Issue) => void
}

function generateId() {
  return 'iss' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
}

export default function IssueModal({ isOpen, onClose, issue, onSave }: IssueModalProps) {
  const isEdit = !!issue

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<IssueStatus>('待处理')
  const [severity, setSeverity] = useState<IssueSeverity>('一般')
  const [source, setSource] = useState<IssueSource>('内部发现')
  const [assigneeId, setAssigneeId] = useState('')
  const [scenarioId, setScenarioId] = useState('')
  const [linkedTaskId, setLinkedTaskId] = useState('')
  const [resolution, setResolution] = useState('')

  useEffect(() => {
    if (issue) {
      setTitle(issue.title)
      setDescription(issue.description)
      setStatus(issue.status)
      setSeverity(issue.severity)
      setSource(issue.source)
      setAssigneeId(issue.assigneeId)
      setScenarioId(issue.scenarioId || '')
      setLinkedTaskId(issue.linkedTaskId || '')
      setResolution(issue.resolution || '')
    } else {
      setTitle('')
      setDescription('')
      setStatus('待处理')
      setSeverity('一般')
      setSource('内部发现')
      setAssigneeId('')
      setScenarioId('')
      setLinkedTaskId('')
      setResolution('')
    }
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

  function handleSave() {
    if (!title.trim()) return
    const now = '2026-05-31'
    const showResolution = status === '已解决' || status === '已关闭'
    const saved: Issue = {
      id: issue?.id || generateId(),
      title: title.trim(),
      description: description.trim(),
      status,
      severity,
      source,
      reporterId: issue?.reporterId || 'm01',
      assigneeId,
      scenarioId: scenarioId || undefined,
      linkedTaskId: linkedTaskId || undefined,
      resolution: showResolution ? resolution.trim() || undefined : undefined,
      createdAt: issue?.createdAt || now,
      updatedAt: now,
      resolvedAt: (status === '已解决' || status === '已关闭') ? (issue?.resolvedAt || now) : undefined,
    }
    onSave(saved)
    onClose()
  }

  if (!isOpen) return null

  const allTeam = team
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
              rows={4}
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

          {/* Source + Assignee row */}
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">负责人</label>
              <select
                value={assigneeId}
                onChange={e => setAssigneeId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">选择负责人...</option>
                {allTeam.map(m => <option key={m.id} value={m.id}>{m.name} - {m.role}({m.organization})</option>)}
              </select>
            </div>
          </div>

          {/* Scenario + Linked Task row */}
          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">关联任务</label>
              <select
                value={linkedTaskId}
                onChange={e => setLinkedTaskId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">无</option>
                {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
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
