'use client'

import { useState } from 'react'
import { Info, Shield, Database, HelpCircle, Eye, EyeOff, Download, ExternalLink, CheckSquare, FileText, Calendar, AlertTriangle, Users, Cpu } from 'lucide-react'
import Header from '@/components/layout/Header'
import { tasks, deliverables, meetings, issues, team, scenarios } from '@/lib/store'

function getDaysRemaining(target: string): number {
  const now = new Date('2026-05-31')
  const end = new Date(target)
  const diff = end.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const uatDays = getDaysRemaining('2026-06-30')

  function showToast(message: string) {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    showToast('功能开发中')
  }

  function handleExport() {
    showToast('功能开发中')
  }

  const projectInfo = [
    { label: '项目名称', value: '国微电子 HIAgent AI 智能体项目' },
    { label: '合同签订', value: '2026-05-15' },
    { label: 'UAT 截止', value: '2026-06-30', badge: `剩余 ${uatDays} 天` },
    { label: '初验', value: '2026-07-15' },
    { label: '终验', value: '2026-08-14' },
    { label: '平台', value: 'HIAgent v2.5.1' },
    { label: 'LLM', value: 'Qwen 3.5-397B-A17B' },
    { label: '总工作量', value: '326 人天' },
    { label: '交付物', value: '141 项' },
  ]

  const stats = [
    { label: '任务数', count: tasks.length, icon: CheckSquare, color: 'text-blue-600 bg-blue-50' },
    { label: '交付物数', count: deliverables.length, icon: FileText, color: 'text-emerald-600 bg-emerald-50' },
    { label: '会议数', count: meetings.length, icon: Calendar, color: 'text-violet-600 bg-violet-50' },
    { label: '问题数', count: issues.length, icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
    { label: '团队成员数', count: team.length, icon: Users, color: 'text-rose-600 bg-rose-50' },
    { label: '场景数', count: scenarios.length, icon: Cpu, color: 'text-cyan-600 bg-cyan-50' },
  ]

  return (
    <div className="flex flex-col h-screen">
      <Header title="设置" subtitle="项目配置与系统信息" />

      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* 项目信息 */}
          <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900 mb-5">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600">
                <Info size={18} />
              </span>
              项目信息
            </h3>
            <div className="grid gap-3">
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

          {/* 安全设置 */}
          <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900 mb-5">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600">
                <Shield size={18} />
              </span>
              安全设置
            </h3>
            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
              {/* Current password */}
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

              {/* New password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">新密码</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="输入新密码"
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

              {/* Confirm password */}
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

              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                保存密码
              </button>
            </form>
          </section>

          {/* 数据统计 */}
          <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900 mb-5">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-50 text-violet-600">
                <Database size={18} />
              </span>
              数据统计
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-5">
              {stats.map((stat) => {
                const Icon = stat.icon
                return (
                  <div
                    key={stat.label}
                    className="flex items-center gap-3 p-3.5 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
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
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
            >
              <Download size={16} />
              导出数据
            </button>
          </section>

          {/* 关于 */}
          <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900 mb-5">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-600">
                <HelpCircle size={18} />
              </span>
              关于
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-sm text-gray-500">版本</span>
                <span className="text-sm font-medium text-gray-900">v2.0.0</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-sm text-gray-500">技术栈</span>
                <span className="text-sm font-medium text-gray-900">Next.js 16 + Tailwind CSS v4 + Recharts</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-sm text-gray-500">部署</span>
                <span className="text-sm font-medium text-gray-900">Vercel</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-sm text-gray-500">源代码</span>
                <a href="#" className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                  GitHub
                  <ExternalLink size={14} />
                </a>
              </div>
              <div className="pt-3 mt-3 border-t border-gray-100 px-3">
                <p className="text-sm text-gray-400">伊登软件 × 火山引擎</p>
              </div>
            </div>
          </section>

        </div>
      </main>

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
