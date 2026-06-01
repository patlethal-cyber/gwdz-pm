'use client'

import { Clock, MapPin, ListChecks, CheckCircle2 } from 'lucide-react'
import type { Meeting } from '@/lib/types'
import { useData } from '@/lib/data-context'

type MeetingType = Meeting['type']

const typeBadgeColors: Record<MeetingType, string> = {
  '周会': 'bg-blue-50 text-blue-700 border-blue-200',
  '里程碑评审': 'bg-purple-50 text-purple-700 border-purple-200',
  '部门对接': 'bg-green-50 text-green-700 border-green-200',
  '日常沟通': 'bg-gray-100 text-gray-600 border-gray-200',
}

interface MeetingListProps {
  meetings: Meeting[]
  variant: 'upcoming' | 'past'
  onSelect: (meeting: Meeting) => void
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const month = d.getMonth() + 1
  const day = d.getDate()
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  const weekday = weekdays[d.getDay()]
  return `${month}月${day}日 周${weekday}`
}

export default function MeetingList({ meetings, variant, onSelect }: MeetingListProps) {
  const { getMember } = useData()

  if (meetings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <ListChecks size={40} className="mb-3 text-gray-300" />
        <p className="text-sm">
          {variant === 'upcoming' ? '暂无即将召开的会议' : '暂无历史会议'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {meetings.map(meeting => {
        const isPast = variant === 'past'
        const doneActions = meeting.actionItems.filter(a => a.done).length
        const totalActions = meeting.actionItems.length

        return (
          <button
            key={meeting.id}
            onClick={() => onSelect(meeting)}
            className={`w-full text-left bg-white rounded-xl shadow-sm p-5 transition-all hover:shadow-md hover:-translate-y-0.5 ${
              !isPast ? 'border-l-4 border-l-blue-500' : 'opacity-90'
            }`}
          >
            {/* Top row: title + type badge */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className={`text-sm font-semibold ${isPast ? 'text-gray-500' : 'text-gray-900'}`}>
                {meeting.title}
              </h3>
              <span
                className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${
                  typeBadgeColors[meeting.type]
                }`}
              >
                {meeting.type}
              </span>
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
              <span className="inline-flex items-center gap-1">
                <Clock size={12} />
                {formatDate(meeting.date)} {meeting.time}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock size={12} />
                {meeting.duration}分钟
              </span>
              {meeting.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={12} />
                  {meeting.location}
                </span>
              )}
            </div>

            {/* Bottom row: avatars + agenda count + action item ratio */}
            <div className="flex items-center justify-between">
              {/* Attendee avatars */}
              <div className="flex items-center">
                <div className="flex -space-x-2">
                  {meeting.attendeeIds.slice(0, 5).map(id => {
                    const m = getMember(id)
                    if (!m) return null
                    return (
                      <span
                        key={id}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-white"
                        style={{ backgroundColor: m.color }}
                        title={m.name}
                      >
                        {m.initials}
                      </span>
                    )
                  })}
                  {meeting.attendeeIds.length > 5 && (
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium text-gray-500 bg-gray-100 border-2 border-white">
                      +{meeting.attendeeIds.length - 5}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Agenda count */}
                {meeting.agendaItems.length > 0 && (
                  <span className="text-xs text-gray-400">
                    {meeting.agendaItems.length} 项议程
                  </span>
                )}

                {/* Action item completion (past only) */}
                {isPast && totalActions > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                    <CheckCircle2 size={12} className={doneActions === totalActions ? 'text-green-500' : 'text-gray-400'} />
                    {doneActions}/{totalActions} 已完成
                  </span>
                )}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
