'use client'

import { useState, useRef } from 'react'
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  ChevronDown,
  Users,
  Upload,
  Link2,
  ListPlus,
  Search,
} from 'lucide-react'
import type { Meeting, MeetingActionItem, MeetingType } from '@/lib/types'
import { useData } from '@/lib/data-context'

const meetingTypes: MeetingType[] = ['周会', '里程碑评审', '部门对接', '日常沟通']

const typeBadgeColors: Record<MeetingType, string> = {
  '周会': 'bg-blue-50 text-blue-700 border-blue-200',
  '里程碑评审': 'bg-purple-50 text-purple-700 border-purple-200',
  '部门对接': 'bg-green-50 text-green-700 border-green-200',
  '日常沟通': 'bg-gray-50 text-gray-700 border-gray-200',
}

interface MeetingModalProps {
  meeting?: Meeting | null
  onClose: () => void
  onSave: (meeting: Meeting) => void
  onDelete: (id: string) => void
}

function generateId() {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
}

function emptyMeeting(): Meeting {
  return {
    id: generateId(),
    title: '',
    date: '2026-06-01',
    time: '14:00',
    duration: 60,
    location: '',
    attendeeIds: [],
    minutes: '',
    fileUrl: '',
    actionItems: [],
    type: '周会',
    createdAt: new Date().toISOString().slice(0, 10),
    updatedAt: new Date().toISOString().slice(0, 10),
  }
}

export default function MeetingModal({ meeting, onClose, onSave, onDelete }: MeetingModalProps) {
  const { team, tasks, getMember, addTask, today } = useData()
  const isCreate = !meeting
  const [form, setForm] = useState<Meeting>(meeting ? { ...meeting, actionItems: meeting.actionItems.map(a => ({ ...a })) } : emptyMeeting())
  const [showAttendeeDropdown, setShowAttendeeDropdown] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  // Track which action item is showing task link dropdown
  const [linkingActionId, setLinkingActionId] = useState<string | null>(null)
  const [taskSearchQuery, setTaskSearchQuery] = useState('')
  // Track which action item is showing inline create task form
  const [creatingTaskForId, setCreatingTaskForId] = useState<string | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskAssignee, setNewTaskAssignee] = useState('')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')

  const taskSearchRef = useRef<HTMLInputElement>(null)

  function updateField<K extends keyof Meeting>(key: K, value: Meeting[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  // --- Action Item helpers ---
  function addActionItem() {
    const item: MeetingActionItem = { id: generateId(), text: '', assigneeId: '', dueDate: '', done: false }
    updateField('actionItems', [...form.actionItems, item])
  }

  function updateActionItem(id: string, field: keyof MeetingActionItem, value: string | boolean) {
    updateField(
      'actionItems',
      form.actionItems.map(a => (a.id === id ? { ...a, [field]: value } : a))
    )
  }

  function removeActionItem(id: string) {
    updateField('actionItems', form.actionItems.filter(a => a.id !== id))
    if (linkingActionId === id) setLinkingActionId(null)
    if (creatingTaskForId === id) setCreatingTaskForId(null)
  }

  // --- Attendee helpers ---
  function toggleAttendee(id: string) {
    const ids = form.attendeeIds.includes(id)
      ? form.attendeeIds.filter(a => a !== id)
      : [...form.attendeeIds, id]
    updateField('attendeeIds', ids)
  }

  // --- Task linking ---
  function openTaskLinkDropdown(actionId: string) {
    setLinkingActionId(linkingActionId === actionId ? null : actionId)
    setCreatingTaskForId(null)
    setTaskSearchQuery('')
  }

  function linkTask(actionId: string, taskId: string) {
    updateActionItem(actionId, 'taskId', taskId)
    setLinkingActionId(null)
    setTaskSearchQuery('')
  }

  function unlinkTask(actionId: string) {
    updateField(
      'actionItems',
      form.actionItems.map(a => (a.id === actionId ? { ...a, taskId: undefined } : a))
    )
  }

  // --- Create task from action item ---
  function openCreateTaskForm(actionId: string) {
    const actionItem = form.actionItems.find(a => a.id === actionId)
    setCreatingTaskForId(actionId)
    setLinkingActionId(null)
    setNewTaskTitle(actionItem?.text || '')
    setNewTaskAssignee(actionItem?.assigneeId || '')
    setNewTaskDueDate(actionItem?.dueDate || '')
  }

  function submitCreateTask(actionId: string) {
    if (!newTaskTitle.trim()) return
    const taskId = addTask({
      title: newTaskTitle.trim(),
      description: `由会议纪要 "${form.title}" 的待办事项创建`,
      status: '待办',
      priority: '中',
      category: 'project',
      assigneeId: newTaskAssignee,
      dueDate: newTaskDueDate || today,
      tags: ['会议待办'],
    })
    // Link the new task to the action item
    updateActionItem(actionId, 'taskId', taskId)
    setCreatingTaskForId(null)
    setNewTaskTitle('')
    setNewTaskAssignee('')
    setNewTaskDueDate('')
  }

  // Filter tasks for search
  const filteredTasks = taskSearchQuery.trim()
    ? tasks.filter(t => t.title.toLowerCase().includes(taskSearchQuery.toLowerCase())).slice(0, 8)
    : tasks.slice(0, 8)

  function handleSave() {
    onSave(form)
  }

  function handleDelete() {
    onDelete(form.id)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto">
      {/* overlay */}
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />

      {/* modal - 80% width */}
      <div className="relative w-[80%] max-w-5xl mx-4 my-8 bg-white rounded-2xl shadow-2xl">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {isCreate ? '新建会议纪要' : '会议纪要详情'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6 max-h-[calc(100vh-180px)] overflow-y-auto">
          {/* ---- Section A: Header area ---- */}
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">会议标题</label>
              <input
                type="text"
                value={form.title}
                onChange={e => updateField('title', e.target.value)}
                placeholder="输入会议标题"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Date / Time / Duration / Type row */}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar size={14} className="inline mr-1 -mt-0.5" />日期
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => updateField('date', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock size={14} className="inline mr-1 -mt-0.5" />时间
                </label>
                <input
                  type="time"
                  value={form.time}
                  onChange={e => updateField('time', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">时长（分钟）</label>
                <input
                  type="number"
                  min={15}
                  step={15}
                  value={form.duration}
                  onChange={e => updateField('duration', Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">会议类型</label>
                <div className="relative">
                  <select
                    value={form.type}
                    onChange={e => updateField('type', e.target.value as MeetingType)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  >
                    {meetingTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin size={14} className="inline mr-1 -mt-0.5" />地点
              </label>
              <input
                type="text"
                value={form.location}
                onChange={e => updateField('location', e.target.value)}
                placeholder="会议室 / 线上链接"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* ---- Section B: Attendees ---- */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users size={14} className="inline mr-1 -mt-0.5" />参会人员
            </label>

            {/* Selected chips */}
            <div className="flex flex-wrap gap-2 mb-2 min-h-[32px]">
              {form.attendeeIds.map(id => {
                const m = getMember(id)
                if (!m) return null
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 pl-1 pr-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700"
                  >
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                      style={{ backgroundColor: m.color }}
                    >
                      {m.initials}
                    </span>
                    {m.name}
                    <button
                      onClick={() => toggleAttendee(id)}
                      className="ml-0.5 text-gray-400 hover:text-gray-600"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )
              })}
            </div>

            {/* Dropdown toggle */}
            <button
              onClick={() => setShowAttendeeDropdown(!showAttendeeDropdown)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {showAttendeeDropdown ? '收起' : '+ 添加参会人'}
            </button>

            {showAttendeeDropdown && (
              <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
                {team.map(m => {
                  const selected = form.attendeeIds.includes(m.id)
                  return (
                    <button
                      key={m.id}
                      onClick={() => toggleAttendee(m.id)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left transition-colors ${
                        selected ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                        style={{ backgroundColor: m.color }}
                      >
                        {m.initials}
                      </span>
                      <span className="flex-1">{m.name}</span>
                      <span className="text-xs text-gray-400">{m.role}</span>
                      {selected && <CheckCircle2 size={14} className="text-blue-600 flex-shrink-0" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* ---- Section C: Meeting minutes editor ---- */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">会议纪要</label>
            <textarea
              value={form.minutes}
              onChange={e => updateField('minutes', e.target.value)}
              placeholder="记录会议要点、讨论内容、决议事项...&#10;&#10;支持分段书写，建议按议题分段记录。"
              rows={8}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y leading-relaxed"
            />

            {/* File URL */}
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                <Upload size={12} className="inline mr-1 -mt-0.5" />上传会议文档
              </label>
              <input
                type="text"
                value={form.fileUrl || ''}
                onChange={e => updateField('fileUrl', e.target.value)}
                placeholder="粘贴文档链接（如 Vercel Blob URL）"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-500"
              />
            </div>
          </div>

          {/* ---- Section D: Action Items ---- */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">待办事项</label>
              <button
                onClick={addActionItem}
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <Plus size={14} />添加待办
              </button>
            </div>

            {form.actionItems.length === 0 && (
              <p className="text-sm text-gray-400 py-3 text-center border border-dashed border-gray-200 rounded-lg">
                暂无待办事项
              </p>
            )}

            <div className="space-y-2">
              {form.actionItems.map(item => {
                const assignee = getMember(item.assigneeId)
                const linkedTask = item.taskId ? tasks.find(t => t.id === item.taskId) : null
                const isLinking = linkingActionId === item.id
                const isCreating = creatingTaskForId === item.id

                return (
                  <div key={item.id} className="p-3 bg-gray-50 rounded-lg group">
                    {/* Main row */}
                    <div className="flex items-center gap-3">
                      {/* Done checkbox */}
                      <button
                        onClick={() => updateActionItem(item.id, 'done', !item.done)}
                        className="flex-shrink-0"
                      >
                        {item.done ? (
                          <CheckCircle2 size={18} className="text-green-500" />
                        ) : (
                          <Circle size={18} className="text-gray-300 hover:text-gray-400" />
                        )}
                      </button>

                      {/* Text */}
                      <input
                        type="text"
                        value={item.text}
                        onChange={e => updateActionItem(item.id, 'text', e.target.value)}
                        placeholder="待办内容"
                        className={`flex-1 px-2.5 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white ${
                          item.done ? 'line-through text-gray-400' : ''
                        }`}
                      />

                      {/* Assignee select */}
                      <div className="relative flex-shrink-0">
                        <select
                          value={item.assigneeId}
                          onChange={e => updateActionItem(item.id, 'assigneeId', e.target.value)}
                          className="pl-2 pr-6 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none min-w-[80px]"
                        >
                          <option value="">责任人</option>
                          {team.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                        <ChevronDown size={12} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>

                      {/* Due date */}
                      <input
                        type="date"
                        value={item.dueDate || ''}
                        onChange={e => updateActionItem(item.id, 'dueDate', e.target.value)}
                        className="px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white flex-shrink-0"
                      />

                      {/* Delete */}
                      <button
                        onClick={() => removeActionItem(item.id)}
                        className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Sub row: link task / create task */}
                    <div className="mt-2 ml-8 flex items-center gap-2">
                      {linkedTask ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-200">
                          <Link2 size={11} />
                          <span className="max-w-[200px] truncate">{linkedTask.title}</span>
                          <button
                            onClick={() => unlinkTask(item.id)}
                            className="ml-1 text-blue-400 hover:text-blue-600"
                          >
                            <X size={11} />
                          </button>
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => openTaskLinkDropdown(item.id)}
                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors ${
                              isLinking
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            <Link2 size={11} />
                            关联任务
                          </button>
                          <button
                            onClick={() => openCreateTaskForm(item.id)}
                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors ${
                              isCreating
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            <ListPlus size={11} />
                            创建新任务
                          </button>
                        </>
                      )}
                    </div>

                    {/* Task link search dropdown */}
                    {isLinking && (
                      <div className="mt-2 ml-8 border border-gray-200 rounded-lg bg-white shadow-sm">
                        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
                          <Search size={13} className="text-gray-400" />
                          <input
                            ref={taskSearchRef}
                            type="text"
                            value={taskSearchQuery}
                            onChange={e => setTaskSearchQuery(e.target.value)}
                            placeholder="搜索任务..."
                            autoFocus
                            className="flex-1 text-xs focus:outline-none"
                          />
                        </div>
                        <div className="max-h-36 overflow-y-auto">
                          {filteredTasks.length === 0 ? (
                            <p className="px-3 py-2 text-xs text-gray-400 text-center">没有匹配的任务</p>
                          ) : (
                            filteredTasks.map(t => (
                              <button
                                key={t.id}
                                onClick={() => linkTask(item.id, t.id)}
                                className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <span className="flex-1 truncate">{t.title}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                  t.status === '已完成' ? 'bg-green-50 text-green-600' :
                                  t.status === '进行中' ? 'bg-blue-50 text-blue-600' :
                                  'bg-gray-100 text-gray-500'
                                }`}>
                                  {t.status}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* Inline create task form */}
                    {isCreating && (
                      <div className="mt-2 ml-8 border border-green-200 rounded-lg bg-green-50/50 p-3 space-y-2">
                        <div>
                          <label className="text-[11px] font-medium text-gray-500 mb-0.5 block">任务标题</label>
                          <input
                            type="text"
                            value={newTaskTitle}
                            onChange={e => setNewTaskTitle(e.target.value)}
                            placeholder="输入任务标题"
                            autoFocus
                            className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <label className="text-[11px] font-medium text-gray-500 mb-0.5 block">负责人</label>
                            <div className="relative">
                              <select
                                value={newTaskAssignee}
                                onChange={e => setNewTaskAssignee(e.target.value)}
                                className="w-full pl-2 pr-6 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white appearance-none"
                              >
                                <option value="">选择负责人</option>
                                {team.map(m => (
                                  <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                              </select>
                              <ChevronDown size={12} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <label className="text-[11px] font-medium text-gray-500 mb-0.5 block">截止日期</label>
                            <input
                              type="date"
                              value={newTaskDueDate}
                              onChange={e => setNewTaskDueDate(e.target.value)}
                              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => submitCreateTask(item.id)}
                            disabled={!newTaskTitle.trim()}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            创建并关联
                          </button>
                          <button
                            onClick={() => setCreatingTaskForId(null)}
                            className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <div>
            {!isCreate && (
              <>
                {showDeleteConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-600">确认删除此会议纪要？</span>
                    <button
                      onClick={handleDelete}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                    >
                      确认删除
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                    删除
                  </button>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              {isCreate ? '创建纪要' : '保存更改'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
