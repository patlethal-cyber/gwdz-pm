'use client'

import { useState } from 'react'
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Plus,
  Trash2,
  GripVertical,
  CheckCircle2,
  Circle,
  ChevronDown,
  Users,
} from 'lucide-react'
import type { Meeting, AgendaItem, ActionItem, MeetingStatus } from '@/lib/types'
import { team, getMember } from '@/lib/store'

type MeetingType = Meeting['type']

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
    agendaItems: [],
    minutes: '',
    actionItems: [],
    status: '即将召开' as MeetingStatus,
    type: '周会',
    createdAt: new Date().toISOString().slice(0, 10),
  }
}

export default function MeetingModal({ meeting, onClose, onSave }: MeetingModalProps) {
  const isCreate = !meeting
  const [form, setForm] = useState<Meeting>(meeting ? { ...meeting } : emptyMeeting())
  const [showAttendeeDropdown, setShowAttendeeDropdown] = useState(false)

  function updateField<K extends keyof Meeting>(key: K, value: Meeting[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  // --- Agenda helpers ---
  function addAgendaItem() {
    const item: AgendaItem = { id: generateId(), text: '', duration: 10, presenter: '' }
    updateField('agendaItems', [...form.agendaItems, item])
  }

  function updateAgendaItem(id: string, field: keyof AgendaItem, value: string | number) {
    updateField(
      'agendaItems',
      form.agendaItems.map(a => (a.id === id ? { ...a, [field]: value } : a))
    )
  }

  function removeAgendaItem(id: string) {
    updateField('agendaItems', form.agendaItems.filter(a => a.id !== id))
  }

  function moveAgendaItem(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= form.agendaItems.length) return
    const items = [...form.agendaItems]
    ;[items[index], items[target]] = [items[target], items[index]]
    updateField('agendaItems', items)
  }

  // --- Action Item helpers ---
  function addActionItem() {
    const item: ActionItem = { id: generateId(), text: '', assigneeId: '', dueDate: '', done: false }
    updateField('actionItems', [...form.actionItems, item])
  }

  function updateActionItem(id: string, field: keyof ActionItem, value: string | boolean) {
    updateField(
      'actionItems',
      form.actionItems.map(a => (a.id === id ? { ...a, [field]: value } : a))
    )
  }

  function removeActionItem(id: string) {
    updateField('actionItems', form.actionItems.filter(a => a.id !== id))
  }

  // --- Attendee helpers ---
  function toggleAttendee(id: string) {
    const ids = form.attendeeIds.includes(id)
      ? form.attendeeIds.filter(a => a !== id)
      : [...form.attendeeIds, id]
    updateField('attendeeIds', ids)
  }

  function handleSave() {
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto">
      {/* overlay */}
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />

      {/* modal */}
      <div className="relative w-full max-w-3xl mx-4 my-8 bg-white rounded-2xl shadow-2xl">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {isCreate ? '新建会议' : '会议详情'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6 max-h-[calc(100vh-180px)] overflow-y-auto">
          {/* ---- Section A: Basic info ---- */}
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

            {/* Date / Time / Duration row */}
            <div className="grid grid-cols-3 gap-4">
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
            </div>

            {/* Location / Type row */}
            <div className="grid grid-cols-2 gap-4">
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
                      <span className="text-xs text-gray-400">{m.organization} &middot; {m.role}</span>
                      {selected && <CheckCircle2 size={14} className="text-blue-600 flex-shrink-0" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* ---- Section C: Agenda ---- */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">议程</label>
              <button
                onClick={addAgendaItem}
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <Plus size={14} />添加议题
              </button>
            </div>

            {form.agendaItems.length === 0 && (
              <p className="text-sm text-gray-400 py-3 text-center border border-dashed border-gray-200 rounded-lg">
                暂无议程，点击"添加议题"开始
              </p>
            )}

            <div className="space-y-2">
              {form.agendaItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg group"
                >
                  {/* Reorder handle + number */}
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <button
                      onClick={() => moveAgendaItem(idx, -1)}
                      className="text-gray-300 hover:text-gray-500 disabled:opacity-30"
                      disabled={idx === 0}
                    >
                      <GripVertical size={14} />
                    </button>
                    <span className="text-xs font-bold text-gray-400 w-5 text-center">{idx + 1}</span>
                    <button
                      onClick={() => moveAgendaItem(idx, 1)}
                      className="text-gray-300 hover:text-gray-500 disabled:opacity-30"
                      disabled={idx === form.agendaItems.length - 1}
                    >
                      <GripVertical size={14} />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={item.text}
                      onChange={e => updateAgendaItem(item.id, 'text', e.target.value)}
                      placeholder="议题内容"
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    />
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Clock size={12} className="text-gray-400" />
                        <input
                          type="number"
                          min={5}
                          step={5}
                          value={item.duration}
                          onChange={e => updateAgendaItem(item.id, 'duration', Number(e.target.value))}
                          className="w-16 px-2 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        />
                        <span className="text-xs text-gray-400">分钟</span>
                      </div>
                      <div className="flex items-center gap-1 flex-1">
                        <span className="text-xs text-gray-400">汇报人</span>
                        <input
                          type="text"
                          value={item.presenter}
                          onChange={e => updateAgendaItem(item.id, 'presenter', e.target.value)}
                          placeholder="姓名"
                          className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => removeAgendaItem(item.id)}
                    className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ---- Section D: Minutes ---- */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">会议纪要</label>
            <textarea
              value={form.minutes}
              onChange={e => updateField('minutes', e.target.value)}
              placeholder="记录会议要点..."
              rows={4}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            />
          </div>

          {/* ---- Section E: Action Items ---- */}
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
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group"
                  >
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
                      value={item.dueDate}
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
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
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
            {isCreate ? '创建会议' : '保存更改'}
          </button>
        </div>
      </div>
    </div>
  )
}
