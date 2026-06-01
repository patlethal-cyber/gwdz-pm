'use client'

import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import Header from '@/components/layout/Header'
import MeetingList from '@/components/meetings/MeetingList'
import MeetingModal from '@/components/meetings/MeetingModal'
import { useData } from '@/lib/data-context'
import type { Meeting } from '@/lib/types'

export default function MeetingsPage() {
  const { meetings, addMeeting, updateMeeting, deleteMeeting, ready } = useData()
  const [modalMeeting, setModalMeeting] = useState<Meeting | null | undefined>(undefined)
  // undefined = closed, null = create mode, Meeting = view/edit mode

  const sorted = useMemo(
    () => [...meetings].sort((a, b) => {
      const dateCmp = b.date.localeCompare(a.date)
      if (dateCmp !== 0) return dateCmp
      return (b.time || '').localeCompare(a.time || '')
    }),
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
      const { id, createdAt, updatedAt, ...rest } = meeting
      addMeeting(rest)
    }
    closeModal()
  }

  function handleDelete(id: string) {
    deleteMeeting(id)
    closeModal()
  }

  if (!ready) {
    return (
      <div className="flex flex-col h-screen">
        <div className="h-16 border-b border-gray-200 bg-white" />
        <div className="flex-1 px-6 py-6 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="会议纪要"
        subtitle={`共 ${meetings.length} 份纪要`}
        actions={
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
          >
            <Plus size={16} />
            新建会议纪要
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <MeetingList meetings={sorted} onSelect={openView} />
      </div>

      {modalMeeting !== undefined && (
        <MeetingModal
          meeting={modalMeeting}
          onClose={closeModal}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
