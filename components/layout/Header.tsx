'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { Search, Bell, FolderOpen, FileText, CheckSquare, Bug, Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useData } from '@/lib/data-context'
import NotificationPanel from '@/components/shared/NotificationPanel'
import FileManagerPanel from '@/components/shared/FileManagerPanel'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

interface SearchResult {
  id: string
  title: string
  group: 'tasks' | 'deliverables' | 'issues' | 'meetings'
  href: string
}

const groupLabels: Record<SearchResult['group'], string> = {
  tasks: '任务',
  deliverables: '交付物',
  issues: '问题',
  meetings: '会议',
}

const groupIcons: Record<SearchResult['group'], React.ReactNode> = {
  tasks: <CheckSquare size={13} className="text-blue-500" />,
  deliverables: <FileText size={13} className="text-violet-500" />,
  issues: <Bug size={13} className="text-red-500" />,
  meetings: <Calendar size={13} className="text-green-500" />,
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  const router = useRouter()
  const { tasks, deliverables, issues, meetings, activities, ready } = useData()

  const [query, setQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showFileManager, setShowFileManager] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bellRef = useRef<HTMLDivElement>(null)

  const NOTIF_READ_KEY = 'gwdz-v5-notif-read-at'

  const [lastReadAt, setLastReadAt] = useState<string>('')

  // Load lastReadAt from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(NOTIF_READ_KEY)
      if (stored) setLastReadAt(stored)
    } catch { /* SSR / private browsing */ }
  }, [])

  // When notification panel opens, save current timestamp
  useEffect(() => {
    if (showNotifications) {
      const now = new Date().toISOString()
      setLastReadAt(now)
      try { localStorage.setItem(NOTIF_READ_KEY, now) } catch { /* ignore */ }
    }
  }, [showNotifications])

  // Count activities newer than lastReadAt
  const unreadCount = useMemo(() => {
    if (!ready) return 0
    if (!lastReadAt) return activities.length
    return activities.filter(a => a.timestamp > lastReadAt).length
  }, [activities, ready, lastReadAt])

  // Callback for "mark all as read" from NotificationPanel
  const handleMarkAllRead = useCallback(() => {
    const now = new Date().toISOString()
    setLastReadAt(now)
    try { localStorage.setItem(NOTIF_READ_KEY, now) } catch { /* ignore */ }
  }, [])

  const results = useMemo(() => {
    if (!query.trim() || !ready) return []
    const q = query.trim().toLowerCase()
    const out: SearchResult[] = []

    let count = 0
    for (const t of tasks) {
      if (count >= 5) break
      if (t.title.toLowerCase().includes(q)) {
        out.push({ id: t.id, title: t.title, group: 'tasks', href: `/tasks?open=${t.id}` })
        count++
      }
    }

    count = 0
    for (const d of deliverables) {
      if (count >= 5) break
      if (d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q)) {
        out.push({ id: d.id, title: `${d.code} ${d.name}`, group: 'deliverables', href: `/deliverables?open=${d.id}` })
        count++
      }
    }

    count = 0
    for (const i of issues) {
      if (count >= 5) break
      if (i.title.toLowerCase().includes(q)) {
        out.push({ id: i.id, title: i.title, group: 'issues', href: `/issues?open=${i.id}` })
        count++
      }
    }

    count = 0
    for (const m of meetings) {
      if (count >= 5) break
      if (m.title.toLowerCase().includes(q)) {
        out.push({ id: m.id, title: m.title, group: 'meetings', href: '/meetings' })
        count++
      }
    }

    return out
  }, [query, tasks, deliverables, issues, meetings, ready])

  const grouped = useMemo(() => {
    const map = new Map<SearchResult['group'], SearchResult[]>()
    for (const r of results) {
      const arr = map.get(r.group) || []
      arr.push(r)
      map.set(r.group, arr)
    }
    return map
  }, [results])

  const flatResults = results

  const handleSelect = useCallback((result: SearchResult) => {
    router.push(result.href)
    setQuery('')
    setShowDropdown(false)
    setActiveIndex(-1)
  }, [router])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setShowDropdown(false)
      setActiveIndex(-1)
      inputRef.current?.blur()
      return
    }
    if (!showDropdown || flatResults.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(prev => (prev + 1) % flatResults.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(prev => (prev - 1 + flatResults.length) % flatResults.length)
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      handleSelect(flatResults[activeIndex])
    }
  }

  function handleBlur() {
    blurTimer.current = setTimeout(() => {
      setShowDropdown(false)
      setActiveIndex(-1)
    }, 200)
  }

  function handleFocus() {
    if (blurTimer.current) {
      clearTimeout(blurTimer.current)
      blurTimer.current = null
    }
    if (query.trim()) {
      setShowDropdown(true)
    }
  }

  useEffect(() => {
    setShowDropdown(results.length > 0 && query.trim().length > 0)
    setActiveIndex(-1)
  }, [results, query])

  useEffect(() => {
    return () => {
      if (blurTimer.current) clearTimeout(blurTimer.current)
    }
  }, [])

  // Close notification panel on outside click
  useEffect(() => {
    if (!showNotifications) return
    function handleClickOutside(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showNotifications])

  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6">
      <div>
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="搜索任务、交付物、问题..."
            className="pl-9 pr-4 py-2 w-64 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {showDropdown && (
            <div
              ref={dropdownRef}
              className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50 max-h-[400px] overflow-y-auto"
            >
              {results.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-gray-400">
                  没有匹配结果
                </div>
              ) : (
                Array.from(grouped.entries()).map(([group, items]) => (
                  <div key={group}>
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border-b border-gray-100">
                      {groupIcons[group]}
                      <span className="text-xs font-semibold text-gray-500">{groupLabels[group]}</span>
                      <span className="text-[10px] text-gray-400 ml-auto">{items.length}</span>
                    </div>
                    {items.map(item => {
                      const idx = flatResults.indexOf(item)
                      return (
                        <button
                          key={item.id}
                          onMouseDown={e => { e.preventDefault(); handleSelect(item) }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                            idx === activeIndex
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span className="line-clamp-1">{item.title}</span>
                        </button>
                      )
                    })}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* File manager button */}
        <button
          onClick={() => setShowFileManager(prev => !prev)}
          className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FolderOpen size={18} />
        </button>
        <FileManagerPanel
          isOpen={showFileManager}
          onClose={() => setShowFileManager(false)}
        />

        {/* Notification bell */}
        <div ref={bellRef} className="relative">
          <button
            onClick={() => setShowNotifications(prev => !prev)}
            className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <NotificationPanel onClose={() => setShowNotifications(false)} onMarkAllRead={handleMarkAllRead} />
          )}
        </div>
      </div>
    </header>
  )
}
