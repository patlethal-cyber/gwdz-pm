import { type NextRequest } from 'next/server'
import { put, head } from '@vercel/blob'

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

// GET /api/data/[collection] — read collection
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
    const res = await fetch(blobInfo.url)
    const data = await res.json()
    return Response.json(data)
  } catch {
    // Blob doesn't exist yet — return empty array
    return Response.json([])
  }
}

// PUT /api/data/[collection] — write entire collection
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

  await put(blobPath(collection), JSON.stringify(data), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
  })

  return Response.json({ ok: true, count: Array.isArray(data) ? data.length : 0 })
}
