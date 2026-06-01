'use client'

import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import Header from '@/components/layout/Header'
import MeetingList from '@/components/meetings/MeetingList'
import MeetingModal from '@/components/meetings/MeetingModal'
import { useData } from '@/lib/data-context'
import type { Meeting } from '@/lib/types'

type Tab = 'upcoming' | 'past'

export default function MeetingsPage() {
  const { meetings, addMeeting, updateMeeting, ready } = useData()
  const [activeTab, setActiveTab] = useState<Tab>('upcoming')
  const [modalMeeting, setModalMeeting] = useState<Meeting | null | undefined>(undefined)
  // undefined = closed, null = create mode, Meeting = view/edit mode

  const upcoming = useMemo(
    () => meetings.filter(m => m.status === '即将召开').sort((a, b) => a.date.localeCompare(b.date)),
    [meetings]
  )

  const past = useMemo(
    () => meetings.filter(m => m.status === '已结束').sort((a, b) => b.date.localeCompare(a.date)),
    [meetings]
  )

  function openCreate() {
    setModalMeeting(null)
  }

  function openView(meeting: Meeting) {
    setModalMeeting(meeting)
  }

  function closeModal() {
    setModalMeeting(undefined)
  }

  function handleSave(meeting: Meeting) {
    const exists = meetings.some(m => m.id === meeting.id)
    if (exists) {
      updateMeeting(meeting.id, meeting)
    } else {
      const { id, createdAt, ...rest } = meeting
      addMeeting(rest)
    }
    closeModal()
  }

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-sm text-gray-400">Loading...</div>
      </div>
    )
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'upcoming', label: '即将召开', count: upcoming.length },
    { key: 'past', label: '历史会议', count: past.length },
  ]

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="会议"
        subtitle={`共 ${upcoming.length + past.length} 场会议`}
        actions={
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
          >
            <Plus size={16} />
            新建会议
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Tab bar */}
        <div className="flex items-center gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              <span
                className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Meeting lists */}
        {activeTab === 'upcoming' && (
          <MeetingList meetings={upcoming} variant="upcoming" onSelect={openView} />
        )}
        {activeTab === 'past' && (
          <MeetingList meetings={past} variant="past" onSelect={openView} />
        )}
      </div>

      {/* Modal */}
      {modalMeeting !== undefined && (
        <MeetingModal
          meeting={modalMeeting}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
