'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CheckSquare,
  FileBox,
  FolderOpen,
  Calendar,
  Users,
  Bug,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Cpu,
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/', label: '总览', icon: LayoutDashboard },
  { href: '/tasks', label: '任务', icon: CheckSquare },
  { href: '/deliverables', label: '交付物', icon: FileBox },
  { href: '/files', label: '文件', icon: FolderOpen },
  { href: '/meetings', label: '会议', icon: Calendar },
  { href: '/issues', label: '问题', icon: Bug },
  { href: '/team', label: '团队', icon: Users },
  { href: '/reports', label: '报告', icon: FileText },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-[#1a2332] text-white flex flex-col z-50 transition-all duration-300 ${
        collapsed ? 'w-[68px]' : 'w-[240px]'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/10">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Cpu size={18} />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="text-sm font-bold tracking-wide">GWDZ PM</div>
            <div className="text-[10px] text-white/50">国微电子项目管理</div>
          </div>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'text-white/60 hover:text-white hover:bg-white/8'
              }`}
            >
              <Icon size={20} className="flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Settings at bottom */}
      <div className="px-3 pb-2">
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
            pathname === '/settings'
              ? 'bg-white/10 text-white/80'
              : 'text-white/40 hover:text-white/70 hover:bg-white/5'
          }`}
        >
          <Settings size={20} className="flex-shrink-0" />
          {!collapsed && <span>设置</span>}
        </Link>
      </div>

      {/* User info card */}
      <div className="border-t border-white/10 px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
          LP
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">李培嵩</div>
            <div className="text-[10px] text-white/40 truncate">项目经理</div>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-[#1a2332] border border-white/20 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition-all"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  )
}
