'use client'

import { useState } from 'react'
import {
  Info, Shield, Database, HelpCircle, Eye, EyeOff, Download, RefreshCcw,
  ExternalLink, CheckSquare, FileText, Calendar, AlertTriangle, Users, Cpu,
  Clock
} from 'lucide-react'
import Header from '@/components/layout/Header'
import { useData } from '@/lib/data-context'

export default function SettingsPage() {
  const {
    tasks, deliverables, meetings, issues, team, scenarios, milestones,
    externalContacts, activities, deliverableVersions,
    today, ready,
  } = useData()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  function getDaysRemaining(target: string): number {
    const todayDate = new Date(today)
    const end = new Date(target)
    const diff = end.getTime() - todayDate.getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  const uatDays = getDaysRemaining('2026-06-30')

  function showToast(message: string) {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPasswordMsg(null)

    if (!currentPassword.trim()) {
      setPasswordMsg({ type: 'error', text: '请输入当前密码' })
      return
    }
    if (!newPassword.trim()) {
      setPasswordMsg({ type: 'error', text: '请输入新密码' })
      return
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: '新密码至少需要 6 个字符' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: '两次输入的密码不一致' })
      return
    }

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (res.ok) {
        setPasswordMsg({ type: 'success', text: '密码修改成功' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const data = await res.json().catch(() => ({}))
        setPasswordMsg({ type: 'error', text: data.error || '密码修改失败，请检查当前密码是否正确' })
      }
    } catch {
      setPasswordMsg({ type: 'error', text: '网络错误，请稍后重试' })
    }
  }

  function handleExportJSON() {
    const data = {
      exportedAt: new Date().toISOString(),
      version: 'v4.0',
      tasks,
      deliverables,
      meetings,
      issues,
      team,
      scenarios,
      milestones,
      externalContacts,
      activities,
      deliverableVersions,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gwdz-pm-export-${today}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast('数据已导出')
  }

  function handleResetData() {
    // Clear all gwdz-v4 keys from localStorage
    const keys = Object.keys(localStorage).filter(k => k.startsWith('gwdz-v4'))
    for (const k of keys) {
      localStorage.removeItem(k)
    }
    window.location.reload()
  }

  if (!ready) {
    return (
      <div className="flex flex-col h-screen">
        <Header title="设置" subtitle="项目配置与系统信息" />
        <div className="flex items-center justify-center flex-1">
          <div className="text-sm text-gray-400">加载中...</div>
        </div>
      </div>
    )
  }

  const projectInfo = [
    { label: '项目名称', value: '国微电子 HIAgent AI 智能体项目' },
    { label: '合同签约', value: '2026-05-09' },
    { label: 'UAT 截止', value: '2026-06-30', badge: `剩余 ${uatDays} 天` },
    { label: '初验', value: '2026-07-15' },
    { label: '终验', value: '2026-08-14' },
    { label: '平台', value: 'HIAgent 私有化部署' },
    { label: 'LLM', value: 'Qwen 3.5-397B-A17B' },
    { label: '总工作量', value: '326 人天（含 20% buffer）' },
    { label: '硬件', value: '8x NVIDIA H20 GPU + K8s 集群' },
    { label: '交付场景', value: `${scenarios.length} 个 Agent 场景` },
    { label: '交付物', value: `${deliverables.length} 项` },
  ]

  const stats = [
    { label: '任务', count: tasks.length, icon: CheckSquare, color: 'text-blue-600 bg-blue-50' },
    { label: '交付物', count: deliverables.length, icon: FileText, color: 'text-emerald-600 bg-emerald-50' },
    { label: '会议', count: meetings.length, icon: Calendar, color: 'text-violet-600 bg-violet-50' },
    { label: '问题', count: issues.length, icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
    { label: '团队', count: team.length, icon: Users, color: 'text-rose-600 bg-rose-50' },
    { label: '场景', count: scenarios.length, icon: Cpu, color: 'text-cyan-600 bg-cyan-50' },
  ]

  // Find milestones for display
  const uatMilestone = milestones.find(m => m.code === 'M05' || m.name.includes('UAT'))
  const currentPhase = milestones.find(m => m.status === '进行中')

  return (
    <div className="flex flex-col h-screen">
      <Header title="设置" subtitle="项目配置与系统信息" />

      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* a) 项目信息 */}
          <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900 mb-5">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600">
                <Info size={18} />
              </span>
              项目信息
            </h3>

            {/* UAT Countdown */}
            <div className={`flex items-center gap-3 p-4 rounded-lg mb-4 ${
              uatDays <= 14 ? 'bg-red-50 border border-red-100' :
              uatDays <= 30 ? 'bg-amber-50 border border-amber-100' :
              'bg-blue-50 border border-blue-100'
            }`}>
              <Clock size={20} className={
                uatDays <= 14 ? 'text-red-500' :
                uatDays <= 30 ? 'text-amber-500' :
                'text-blue-500'
              } />
              <div>
                <p className={`text-sm font-semibold ${
                  uatDays <= 14 ? 'text-red-700' :
                  uatDays <= 30 ? 'text-amber-700' :
                  'text-blue-700'
                }`}>
                  UAT 截止倒计时
                </p>
                <p className={`text-2xl font-bold mt-0.5 ${
                  uatDays <= 14 ? 'text-red-800' :
                  uatDays <= 30 ? 'text-amber-800' :
                  'text-blue-800'
                }`}>
                  {uatDays} <span className="text-sm font-normal">天</span>
                </p>
              </div>
              {currentPhase && (
                <div className="ml-auto text-right">
                  <p className="text-[10px] text-gray-500">当前阶段</p>
                  <p className="text-sm font-medium text-gray-700">{currentPhase.name}</p>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              {projectInfo.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm text-gray-500">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{item.value}</span>
                    {item.badge && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        uatDays <= 14
                          ? 'bg-red-50 text-red-700'
                          : uatDays <= 30
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-green-50 text-green-700'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* b) 安全设置 */}
          <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900 mb-5">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600">
                <Shield size={18} />
              </span>
              安全设置
            </h3>
            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">当前密码</label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="输入当前密码"
                    className="w-full px-3 py-2 pr-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">新密码</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="输入新密码（至少 6 个字符）"
                    className="w-full px-3 py-2 pr-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">确认新密码</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="再次输入新密码"
                    className="w-full px-3 py-2 pr-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {passwordMsg && (
                <div className={`text-sm px-3 py-2 rounded-lg ${
                  passwordMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-red-50 text-red-700'
                }`}>
                  {passwordMsg.text}
                </div>
              )}

              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                保存密码
              </button>
            </form>
          </section>

          {/* c) 数据管理 */}
          <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900 mb-5">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-50 text-violet-600">
                <Database size={18} />
              </span>
              数据管理
            </h3>

            <div className="grid grid-cols-3 gap-3 mb-5">
              {stats.map((stat) => {
                const Icon = stat.icon
                return (
                  <div
                    key={stat.label}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                  >
                    <span className={`flex items-center justify-center w-9 h-9 rounded-lg ${stat.color}`}>
                      <Icon size={18} />
                    </span>
                    <div>
                      <p className="text-xl font-bold text-gray-900">{stat.count}</p>
                      <p className="text-xs text-gray-500">{stat.label}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExportJSON}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
              >
                <Download size={16} />
                导出 JSON 数据
              </button>
              <button
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
              >
                <RefreshCcw size={16} />
                重置数据
              </button>
            </div>
          </section>

          {/* d) 关于 */}
          <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900 mb-5">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-600">
                <HelpCircle size={18} />
              </span>
              关于
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-sm text-gray-500">版本</span>
                <span className="text-sm font-medium text-gray-900">v4.0</span>
              </div>
              <div className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-sm text-gray-500">技术栈</span>
                <span className="text-sm font-medium text-gray-900">Next.js + Tailwind CSS v4 + Recharts</span>
              </div>
              <div className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-sm text-gray-500">部署</span>
                <span className="text-sm font-medium text-gray-900">Vercel</span>
              </div>
              <div className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-sm text-gray-500">数据存储</span>
                <span className="text-sm font-medium text-gray-900">浏览器 localStorage</span>
              </div>
              <div className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-sm text-gray-500">源代码</span>
                <a href="#" className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                  GitHub
                  <ExternalLink size={14} />
                </a>
              </div>
              <div className="pt-3 mt-3 border-t border-gray-100 px-3">
                <p className="text-xs text-gray-400">
                  伊登软件 x 火山引擎 HIAgent | 国微电子 AI 智能体项目管理系统
                </p>
                <p className="text-xs text-gray-300 mt-1">
                  Built with Claude Code
                </p>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Reset confirmation dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">确认重置数据</h3>
            <p className="text-sm text-gray-500 mb-4">
              此操作将清除所有本地数据并恢复到初始状态。所有手动修改的任务、交付物、会议和问题记录都将丢失。
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleResetData}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                确认重置
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-[fadeInUp_0.3s_ease-out]">
          <div className="px-4 py-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg">
            {toast}
          </div>
        </div>
      )}
    </div>
  )
}
