'use client'

// "我是谁"选择器弹窗。首次访问自动弹出，也可从侧栏身份区手动唤起。
// 列出全部乙方成员 + "查看全部（全局视角）"。纯设备级偏好，见 current-member-context。

import { useData } from '@/lib/data-context'
import { useCurrentMember } from './current-member-context'
import { Users, Check, X } from 'lucide-react'
import type { TeamMember } from '@/lib/types'

export default function MemberPicker() {
  const { team } = useData()
  const { memberId, setMemberId, pickerOpen, closePicker } = useCurrentMember()

  if (!pickerOpen) return null

  const internal = team.filter((m): m is TeamMember => (m as TeamMember).organization === '乙方')

  function choose(id: string | null) {
    setMemberId(id)
    closePicker()
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4"
      onClick={closePicker}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">你是谁？</h2>
            <p className="text-xs text-gray-500 mt-1">
              选择本人后，系统会默认展示你的任务和场景。仅本设备生效，随时可切换。
            </p>
          </div>
          <button
            onClick={closePicker}
            className="p-1.5 -mr-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            aria-label="关闭"
          >
            <X size={18} />
          </button>
        </div>

        {/* Member grid */}
        <div className="px-6 py-4 max-h-[50vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-2">
            {internal.map(m => {
              const isCurrent = m.id === memberId
              return (
                <button
                  key={m.id}
                  onClick={() => choose(m.id)}
                  className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all ${
                    isCurrent
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: m.color }}
                  >
                    {m.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 truncate">{m.name}</div>
                    <div className="text-[11px] text-gray-500 truncate">{m.role}</div>
                  </div>
                  {isCurrent && <Check size={15} className="text-blue-600 shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Global view option */}
        <div className="border-t border-gray-100 px-6 py-3">
          <button
            onClick={() => choose(null)}
            className={`flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all ${
              memberId === null
                ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-600">
              <Users size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-gray-900">查看全部（全局视角）</div>
              <div className="text-[11px] text-gray-500">项目经理 / 不限定个人</div>
            </div>
            {memberId === null && <Check size={15} className="text-blue-600 shrink-0" />}
          </button>
        </div>
      </div>
    </div>
  )
}
