import { type NextRequest } from 'next/server'
import { put, head } from '@vercel/blob'
import { validateCollection } from '@/lib/schemas'

const VALID_COLLECTIONS = new Set([
  'tasks', 'deliverables', 'meetings', 'issues',
  'activities', 'versions', 'files',
])

function blobPath(collection: string) {
  return `db/${collection}.json`
}

function checkAuth(request: NextRequest) {
  const auth = request.cookies.get('gwdz-auth')
  if (!auth || auth.value !== 'authenticated') {
    return Response.json({ error: '未授权' }, { status: 401 })
  }
  return null
}

// 版本号 = blob 的 uploadedAt（ISO）。blob 不存在则空串。
async function currentVersion(collection: string): Promise<string> {
  try {
    const info = await head(blobPath(collection))
    return info ? new Date(info.uploadedAt).toISOString() : ''
  } catch {
    return '' // blob 尚不存在
  }
}

// GET /api/data/[collection] — 读取集合，并经 X-Data-Version 头返回版本号
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ collection: string }> }
) {
  const authErr = checkAuth(request)
  if (authErr) return authErr

  const { collection } = await params
  if (!VALID_COLLECTIONS.has(collection)) {
    return Response.json({ error: '无效的数据集合' }, { status: 400 })
  }

  try {
    const blobInfo = await head(blobPath(collection))
    if (!blobInfo) {
      return Response.json([])
    }
    // no-store：blob 公开 URL 是固定路径会被 CDN 缓存，覆写后可能读到旧 JSON
    const res = await fetch(blobInfo.url, { cache: 'no-store' })
    const data = await res.json()
    return Response.json(data, {
      headers: { 'X-Data-Version': new Date(blobInfo.uploadedAt).toISOString() },
    })
  } catch {
    // blob 不存在 — 返回空数组
    return Response.json([])
  }
}

// PUT /api/data/[collection] — 整集合覆写（带 Zod 校验 + 乐观并发）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ collection: string }> }
) {
  const authErr = checkAuth(request)
  if (authErr) return authErr

  const { collection } = await params
  if (!VALID_COLLECTIONS.has(collection)) {
    return Response.json({ error: '无效的数据集合' }, { status: 400 })
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json({ error: '存储未配置' }, { status: 503 })
  }

  const data = await request.json()

  // A5: Zod 校验 — 挡住脏数据写入，否则下次全员加载崩溃
  const validation = validateCollection(collection, data)
  if (!validation.ok) {
    return Response.json({ error: `数据校验失败: ${validation.error}` }, { status: 422 })
  }

  // 乐观并发控制：比对客户端持有的版本号与服务器当前版本号
  // '*' = 强制覆写（种子初始化）；'' = 首次写入；否则必须匹配，不匹配返回 409
  const expected = request.headers.get('x-expected-version') ?? ''
  const current = await currentVersion(collection)
  if (expected !== '*' && expected !== '' && current !== '' && expected !== current) {
    return Response.json(
      { error: '数据已被他人更新，请刷新后重试', conflict: true, currentVersion: current },
      { status: 409 }
    )
  }

  await put(blobPath(collection), JSON.stringify(data), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  })

  // 返回写入后的新版本号，供客户端更新本地持有版本
  const newVersion = await currentVersion(collection)
  return Response.json({
    ok: true,
    count: Array.isArray(data) ? data.length : 0,
    version: newVersion,
  })
}
