'use client'

import { useEffect, useState, useCallback } from 'react'
import { X, Trash2, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useData } from '@/lib/data-context'
import type { Task, TaskStatus, TaskPriority, TaskCategory } from '@/lib/types'

const statusOptions: TaskStatus[] = ['待办', '进行中', '审核中', '已完成']
const priorityOptions: TaskPriority[] = ['紧急', '高', '中', '低']
const categoryOptions: { value: TaskCategory; label: string }[] = [
  { value: 'scenario', label: '场景' },
  { value: 'project', label: '项目' },
  { value: 'support', label: '支持' },
]

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  task?: Task
  onSave: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void
  onDelete?: (id: string) => void
  defaultStatus?: TaskStatus
}

export default function TaskModal({ isOpen, onClose, task, onSave, onDelete, defaultStatus }: TaskModalProps) {
  const router = useRouter()
  const { team, scenarios, deliverables } = useData()
  const isEdit = !!task
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('待办')
  const [priority, setPriority] = useState<TaskPriority>('中')
  const [category, setCategory] = useState<TaskCategory>('project')
  const [assigneeId, setAssigneeId] = useState('')
  const [contactId, setContactId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [scenarioId, setScenarioId] = useState('')
  const [deliverableId, setDeliverableId] = useState('')
  const [tagsInput, setTagsInput] = useState('')

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description)
      setStatus(task.status)
      setPriority(task.priority)
      setCategory(task.category || 'project')
      setAssigneeId(task.assigneeId)
      setContactId(task.contactId || '')
      setDueDate(task.dueDate)
      setScenarioId(task.scenarioId || '')
      setDeliverableId(task.deliverableId || '')
      setTagsInput(task.tags.join(', '))
    } else {
      setTitle('')
      setDescription('')
      setStatus(defaultStatus || '待办')
      setPriority('中')
      setCategory('project')
      setAssigneeId('')
      setContactId('')
      setDueDate('')
      setScenarioId('')
      setDeliverableId('')
      setTagsInput('')
    }
    setShowDeleteConfirm(false)
  }, [task, isOpen, defaultStatus])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  function handleDelete() {
    if (task && onDelete) {
      onDelete(task.id)
      onClose()
    }
  }

  function handleSave() {
    if (!title.trim()) return
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean)
    const data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> & { id?: string } = {
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      category,
      assigneeId,
      contactId: contactId || undefined,
      dueDate,
      scenarioId: category === 'scenario' ? scenarioId || undefined : undefined,
      deliverableId: deliverableId || undefined,
      tags,
    }
    if (task) {
      data.id = task.id
    }
    onSave(data)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-bold text-gray-900">
            {isEdit ? '编辑任务' : '新建任务'}
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
              placeholder="输入任务标题..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">描述</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="任务详细描述..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Status + Priority row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">状态</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">优先级</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {priorityOptions.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Category + Assignee row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">分类</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as TaskCategory)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {categoryOptions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
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
                {team.map(m => <option key={m.id} value={m.id}>{m.name} - {m.role}</option>)}
              </select>
            </div>
          </div>

          {/* Contact (external) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">对接人（甲方/火山）</label>
            <select
              value={contactId}
              onChange={e => setContactId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">无</option>
              {team.filter(m => m.organization && m.organization !== '乙方').map(m => (
                <option key={m.id} value={m.id}>{m.name} - {m.role}</option>
              ))}
            </select>
            {contactId && (() => {
              const contact = team.find(m => m.id === contactId)
              if (!contact) return null
              const orgColor = contact.organization === '甲方' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'
              return (
                <div className="flex items-center gap-2 mt-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${orgColor}`}>
                    {contact.name[0]}
                  </span>
                  <span className="text-sm text-gray-700">{contact.name}</span>
                  <span className="text-xs text-gray-400">{contact.organization}</span>
                </div>
              )
            })()}
          </div>

          {/* Scenario (only if category = scenario) */}
          {category === 'scenario' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">关联场景</label>
              <select
                value={scenarioId}
                onChange={e => setScenarioId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">选择场景...</option>
                {scenarios.map(s => <option key={s.id} value={s.id}>{s.code} {s.name}</option>)}
              </select>
            </div>
          )}

          {/* F1: 关联交付物（双向） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">关联交付物</label>
            <select
              value={deliverableId}
              onChange={e => setDeliverableId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">无</option>
              {deliverables.map(d => <option key={d.id} value={d.id}>{d.code} {d.name}</option>)}
            </select>
            {deliverableId && (() => {
              const d = deliverables.find(x => x.id === deliverableId)
              if (!d) return null
              return (
                <button
                  type="button"
                  onClick={() => { onClose(); router.push(`/deliverables?open=${deliverableId}`) }}
                  className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline"
                >
                  <ExternalLink size={12} />
                  打开交付物 {d.code}
                </button>
              )
            })()}
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">截止日期</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">标签</label>
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="用逗号分隔，如：数据, 客户依赖"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Delete confirmation */}
        {showDeleteConfirm && (
          <div className="px-6 py-3 bg-red-50 border-t border-red-200 flex items-center justify-between gap-3">
            <span className="text-sm text-red-700">确定要删除此任务吗？此操作不可撤销。</span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-red-100 rounded-md transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div>
            {isEdit && onDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={15} />
                删除
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
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
              {isEdit ? '保存修改' : '创建任务'}
            </button>
          </div>
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
