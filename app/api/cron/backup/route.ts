// 每日数据快照（Vercel Cron，见 vercel.json）—— Blob 内 db/*.json → backups/daily/<北京日期>/
//
// 防护目标：误覆写 / 脏写 / 人为删除后可回滚到任意一天。
// 保留策略：近 14 天全保留；每月 1 号的快照永久保留；其余自动清理。
// 同日重复触发只会覆写当日快照目录，存储用量有上界。
//
// 鉴权：Vercel Cron 自动带 `Authorization: Bearer ${CRON_SECRET}`（需在 Vercel 环境变量配置）；
// 登录用户也可带 gwdz-auth cookie 手动触发（浏览器访问 /api/cron/backup）。
// ?dry=1 = 只计算不写入（本地验证用）。
import { type NextRequest } from 'next/server'
import { put, head, list, del } from '@vercel/blob'
import { addDays } from '@/lib/date'

export const maxDuration = 60

const COLLECTIONS = [
  'tasks', 'deliverables', 'meetings', 'issues',
  'activities', 'versions', 'files', 'activities-archive',
]
const RETAIN_DAYS = 14

// 北京时间（UTC+8，无夏令时）的今天 —— 快照目录按团队认知的"哪一天"命名
function beijingToday(): string {
  return new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10)
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  const bearerOk = !!cronSecret && authHeader === `Bearer ${cronSecret}`
  const cookieOk = request.cookies.get('gwdz-auth')?.value === 'authenticated'
  if (!bearerOk && !cookieOk) {
    if (!cronSecret) {
      // 没配 CRON_SECRET 时 Vercel Cron 的调用会永远 401 静默失败 — 在运行时日志里喊出来
      console.error('[cron/backup] CRON_SECRET 未配置，定时备份无法鉴权 — 请在 Vercel 环境变量中设置后 redeploy')
    }
    return new Response('Unauthorized', { status: 401 })
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json({ error: '存储未配置' }, { status: 503 })
  }

  const dry = request.nextUrl.searchParams.get('dry') === '1'
  const date = beijingToday()
  const prefix = `backups/daily/${date}/`
  const blobOpts = {
    access: 'public' as const,
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  }

  // 1) 快照 8 个集合
  const snapshot: Array<Record<string, unknown>> = []
  for (const c of COLLECTIONS) {
    try {
      const info = await head(`db/${c}.json`)
      const res = await fetch(info.url, { cache: 'no-store' })
      const text = await res.text()
      const parsed = JSON.parse(text)
      if (!dry) await put(`${prefix}${c}.json`, text, blobOpts)
      snapshot.push({
        collection: c,
        count: Array.isArray(parsed) ? parsed.length : 'NOT_ARRAY',
        bytes: text.length,
        sourceVersion: new Date(info.uploadedAt).toISOString(),
      })
    } catch {
      snapshot.push({ collection: c, count: 0, note: 'blob 不存在' })
    }
  }
  if (!dry) {
    await put(
      `${prefix}manifest.json`,
      JSON.stringify({ date, createdAt: new Date().toISOString(), collections: snapshot }),
      blobOpts,
    )
  }

  // 2) 清理过期快照：早于 cutoff 且不是每月 1 号的删除
  const cutoff = addDays(date, -RETAIN_DAYS)
  let pruned = 0
  let cursor: string | undefined
  do {
    const page = await list({ prefix: 'backups/daily/', cursor, limit: 1000 })
    for (const b of page.blobs) {
      const m = b.pathname.match(/^backups\/daily\/(\d{4}-\d{2}-\d{2})\//)
      if (m && m[1] < cutoff && !m[1].endsWith('-01')) {
        if (!dry) await del(b.url)
        pruned++
      }
    }
    cursor = page.cursor
  } while (cursor)

  return Response.json({ ok: true, dry, date, snapshot, pruned, retainDays: RETAIN_DAYS })
}
