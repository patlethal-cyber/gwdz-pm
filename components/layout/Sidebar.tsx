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
  ChevronsUpDown,
  Cpu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useSidebar } from './sidebar-context'
import { useData } from '@/lib/data-context'
import { useCurrentMember } from './current-member-context'
import type { TeamMember } from '@/lib/types'

const navItems = [
  { href: '/', label: '总览', icon: LayoutDashboard },
  { href: '/tasks', label: '任务', icon: CheckSquare },
  { href: '/scenarios', label: '场景', icon: Cpu },
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
  const { mobileOpen, setMobileOpen } = useSidebar()
  const { getMember } = useData()
  const { memberId, openPicker } = useCurrentMember()
  const currentMember = memberId ? (getMember(memberId) as TeamMember | undefined) : undefined

  // 桌面 collapsed 时隐藏文字（lg:hidden）；移动端抽屉始终展开显示文字
  const labelCls = collapsed ? 'lg:hidden' : ''
  const close = () => setMobileOpen(false)

  return (
    <>
      {/* 移动端背板 */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <aside
        className={`bg-[#1a2332] text-white flex flex-col z-50 transition-transform duration-300
          fixed inset-y-0 left-0 w-[240px] ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:translate-x-0 lg:flex-shrink-0 ${collapsed ? 'lg:w-[68px]' : 'lg:w-[240px]'}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-white/10">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Cpu size={18} />
          </div>
          <div className={`overflow-hidden ${labelCls}`}>
            <div className="text-sm font-bold tracking-wide">GWDZ PM</div>
            <div className="text-[10px] text-white/50">国微电子项目管理</div>
          </div>
          {/* 移动端关闭 */}
          <button
            onClick={close}
            className="lg:hidden ml-auto p-1.5 text-white/60 hover:text-white"
            aria-label="关闭菜单"
          >
            <X size={18} />
          </button>
        </div>

        {/* Main nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                    : 'text-white/60 hover:text-white hover:bg-white/8'
                }`}
              >
                <Icon size={20} className="flex-shrink-0" />
                <span className={labelCls}>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Settings at bottom */}
        <div className="px-3 pb-2">
          <Link
            href="/settings"
            onClick={close}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
              pathname === '/settings'
                ? 'bg-white/10 text-white/80'
                : 'text-white/40 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            <Settings size={20} className="flex-shrink-0" />
            <span className={labelCls}>设置</span>
          </Link>
        </div>

        {/* 当前视角（设备级"我是谁"）— 点击切换 */}
        <button
          onClick={openPicker}
          className="group border-t border-white/10 px-4 py-3 flex items-center gap-3 w-full text-left hover:bg-white/5 transition-colors"
          title="切换当前视角"
        >
          {currentMember ? (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
              style={{ backgroundColor: currentMember.color }}
            >
              {currentMember.initials}
            </div>
          ) : (
            <div className="w-8 h-8 bg-white/15 rounded-full flex items-center justify-center flex-shrink-0">
              <Users size={15} className="text-white/70" />
            </div>
          )}
          <div className={`flex-1 min-w-0 ${labelCls}`}>
            <div className="text-xs font-medium truncate">{currentMember?.name ?? '全局视角'}</div>
            <div className="text-[10px] text-white/40 truncate">{currentMember?.role ?? '查看全部 · 点击切换'}</div>
          </div>
          <ChevronsUpDown size={14} className={`text-white/30 group-hover:text-white/60 flex-shrink-0 ${labelCls}`} />
        </button>

        {/* Collapse toggle — desktop only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-[#1a2332] border border-white/20 rounded-full items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition-all"
          aria-label={collapsed ? '展开侧栏' : '收起侧栏'}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>
    </>
  )
}
