'use client'

import { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/layout/Header'
import ScenarioGrid from '@/components/dashboard/ScenarioGrid'
import { useData } from '@/lib/data-context'
import { useCurrentMember } from '@/components/layout/current-member-context'

export default function ScenariosPage() {
  const { scenarios, getMember, ready } = useData()
  const { memberId } = useCurrentMember()
  const searchParams = useSearchParams()
  const [onlyMine, setOnlyMine] = useState(searchParams.get('mine') === '1')

  const me = memberId ? getMember(memberId) : undefined
  const myCount = useMemo(
    () => (memberId ? scenarios.filter(s => s.ownerId === memberId).length : 0),
    [scenarios, memberId]
  )

  const showMine = onlyMine && !!memberId
  const noMine = showMine && myCount === 0

  return (
    <>
      <Header title="场景" subtitle={`共 ${scenarios.length} 个 Agent 场景`} />

      <div className="p-6 space-y-4">
        {/* "我负责的 / 全部"切换 — 仅在选了具体成员时出现 */}
        {ready && memberId && me && (
          <div className="inline-flex items-center rounded-lg bg-gray-100 p-0.5">
            <button
              onClick={() => setOnlyMine(true)}
              className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                onlyMine ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              我负责的 <span className="text-gray-400">({myCount})</span>
            </button>
            <button
              onClick={() => setOnlyMine(false)}
              className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                !onlyMine ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              全部 <span className="text-gray-400">({scenarios.length})</span>
            </button>
          </div>
        )}

        {noMine ? (
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-12 text-center">
            <p className="text-sm text-gray-500">{me?.name ?? '你'}暂未负责任何场景</p>
            <button
              onClick={() => setOnlyMine(false)}
              className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              查看全部场景
            </button>
          </div>
        ) : (
          <ScenarioGrid ownerFilter={showMine ? memberId : undefined} title="" />
        )}
      </div>
    </>
  )
}
