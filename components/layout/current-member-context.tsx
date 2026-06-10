'use client'

// 设备级"我是谁"视角（device-local，非账户身份）
// ——————————————————————————————————————————————————————————————
// 单账户共享密码不变（A2 否决的是"操作归属审计"）。这里只存一个 localStorage 偏好：
// 当前设备的使用者是谁，用来决定默认筛选 / 首屏个人工作台 / 侧栏显示的名字。
// 不写服务器、不影响任何数据归属、不参与权限。换人或清缓存即重置。
//
// memberId 三态：
//   undefined = 尚未水合（SSR / 首帧），消费者应等 hydrated 再决定 UI
//   null      = 已明确选择"全局视角"（看全部，PM 默认）
//   'm0x'     = 选定了某个成员

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

const STORAGE_KEY = 'gwdz-current-member-id'
const CHOSEN_KEY = 'gwdz-member-chosen' // '1' = 用户已做过选择（含选"全局"），不再自动弹

interface CurrentMemberCtx {
  memberId: string | null
  setMemberId: (id: string | null) => void
  hydrated: boolean
  chosen: boolean              // 是否已做过首次选择
  pickerOpen: boolean
  openPicker: () => void
  closePicker: () => void
}

const Ctx = createContext<CurrentMemberCtx | null>(null)

export function CurrentMemberProvider({ children }: { children: ReactNode }) {
  const [memberId, setMemberIdState] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [chosen, setChosen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  // 水合：从 localStorage 读取（仅客户端）
  useEffect(() => {
    try {
      const storedChosen = localStorage.getItem(CHOSEN_KEY) === '1'
      const storedId = localStorage.getItem(STORAGE_KEY)
      setChosen(storedChosen)
      setMemberIdState(storedId && storedId !== '' ? storedId : null)
      // 从未选过 → 首次访问自动弹选择器
      if (!storedChosen) setPickerOpen(true)
    } catch { /* SSR / 隐私模式 */ }
    setHydrated(true)
  }, [])

  const setMemberId = useCallback((id: string | null) => {
    setMemberIdState(id)
    setChosen(true)
    try {
      localStorage.setItem(STORAGE_KEY, id ?? '')
      localStorage.setItem(CHOSEN_KEY, '1')
    } catch { /* ignore */ }
  }, [])

  const openPicker = useCallback(() => setPickerOpen(true), [])
  const closePicker = useCallback(() => setPickerOpen(false), [])

  return (
    <Ctx.Provider value={{ memberId, setMemberId, hydrated, chosen, pickerOpen, openPicker, closePicker }}>
      {children}
    </Ctx.Provider>
  )
}

export function useCurrentMember(): CurrentMemberCtx {
  const ctx = useContext(Ctx)
  if (!ctx) {
    // 容错：provider 外使用返回 no-op，不崩溃
    return { memberId: null, setMemberId: () => {}, hydrated: false, chosen: true, pickerOpen: false, openPicker: () => {}, closePicker: () => {} }
  }
  return ctx
}
