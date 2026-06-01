'use client'

import { useEffect, useState, useCallback } from 'react'
import { X, Plus, Trash2, Check } from 'lucide-react'
import type { Task, TaskStatus, TaskPriority, ChecklistItem } from '@/lib/types'
import { team, scenarios } from '@/lib/store'

const statusOptions: TaskStatus[] = ['待办', '进行中', '审核中', '已完成']
const priorityOptions: TaskPriority[] = ['紧急', '高', '中', '低']
const departmentOptions = ['客户质量部', '测试一部', '测试二部']

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  task?: Task
  onSave: (task: Task) => void
  defaultStatus?: TaskStatus
}

function generateId() {
  return 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export default function TaskModal({ isOpen, onClose, task, onSave, defaultStatus }: TaskModalProps) {
  const isEdit = !!task

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('待办')
  const [priority, setPriority] = useState<TaskPriority>('中')
  const [assigneeId, setAssigneeId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [scenarioId, setScenarioId] = useState('')
  const [department, setDepartment] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [newCheckItem, setNewCheckItem] = useState('')

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description)
      setStatus(task.status)
      setPriority(task.priority)
      setAssigneeId(task.assigneeId)
      setDueDate(task.dueDate)
      setScenarioId(task.scenarioId || '')
      setDepartment(task.department || '')
      setTagsInput(task.tags.join(', '))
      setChecklist([...task.checklist])
    } else {
      setTitle('')
      setDescription('')
      setStatus(defaultStatus || '待办')
      setPriority('中')
      setAssigneeId('')
      setDueDate('')
      setScenarioId('')
      setDepartment('')
      setTagsInput('')
      setChecklist([])
    }
    setNewCheckItem('')
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

  function handleSave() {
    if (!title.trim()) return
    const now = '2026-05-31'
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean)
    const saved: Task = {
      id: task?.id || generateId(),
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      assigneeId,
      dueDate,
      scenarioId: scenarioId || undefined,
      department: department || undefined,
      tags,
      checklist,
      createdAt: task?.createdAt || now,
      updatedAt: now,
    }
    onSave(saved)
    onClose()
  }

  function addCheckItem() {
    if (!newCheckItem.trim()) return
    setChecklist(prev => [...prev, {
      id: 'cl' + Date.now().toString(36),
      text: newCheckItem.trim(),
      done: false,
    }])
    setNewCheckItem('')
  }

  function toggleCheckItem(id: string) {
    setChecklist(prev => prev.map(c => c.id === id ? { ...c, done: !c.done } : c))
  }

  function removeCheckItem(id: string) {
    setChecklist(prev => prev.filter(c => c.id !== id))
  }

  if (!isOpen) return null

  const edenTeam = team.filter(m => m.organization === '乙方')

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
                {edenTeam.map(m => <option key={m.id} value={m.id}>{m.name} - {m.role}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">截止日期</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Scenario + Department row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">场景</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">部门</label>
              <select
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">无</option>
                {departmentOptions.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
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

          {/* Checklist */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">检查清单</label>
            {checklist.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {checklist.map(item => (
                  <div key={item.id} className="flex items-center gap-2 group/item">
                    <button
                      onClick={() => toggleCheckItem(item.id)}
                      className={`w-4.5 h-4.5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                        item.done
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {item.done && <Check size={10} />}
                    </button>
                    <span className={`flex-1 text-sm ${item.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {item.text}
                    </span>
                    <button
                      onClick={() => removeCheckItem(item.id)}
                      className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={newCheckItem}
                onChange={e => setNewCheckItem(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCheckItem() } }}
                placeholder="添加检查项..."
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={addCheckItem}
                className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
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
            {isEdit ? '保存修改' : '创建任务'}
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
