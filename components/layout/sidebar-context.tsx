'use client'

// 侧栏移动端抽屉的共享开关：Sidebar 在 layout 里、Header 在各页面内，
// 用 context 把 hamburger（Header）和抽屉（Sidebar）连起来。
import { createContext, useContext, useState, type ReactNode } from 'react'

interface SidebarCtx {
  mobileOpen: boolean
  setMobileOpen: (v: boolean) => void
}

const SidebarContext = createContext<SidebarCtx | null>(null)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <SidebarContext.Provider value={{ mobileOpen, setMobileOpen }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar(): SidebarCtx {
  const ctx = useContext(SidebarContext)
  // 容错：万一在 provider 外使用，返回 no-op 而非崩溃
  if (!ctx) return { mobileOpen: false, setMobileOpen: () => {} }
  return ctx
}
