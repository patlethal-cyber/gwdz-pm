import { type NextRequest } from 'next/server'
import { put } from '@vercel/blob'

export async function POST(request: NextRequest) {
  // Auth check
  const auth = request.cookies.get('gwdz-auth')
  if (!auth || auth.value !== 'authenticated') {
    return Response.json({ error: '未授权访问' }, { status: 401 })
  }

  // Token check
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json(
      { error: '文件存储未配置，请在 Vercel Dashboard 设置 BLOB_READ_WRITE_TOKEN' },
      { status: 503 }
    )
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return Response.json({ error: '缺少文件' }, { status: 400 })
  }

  const pathname = (formData.get('pathname') as string) || file.name

  const blob = await put(pathname, file, { access: 'public' })

  return Response.json({
    url: blob.url,
    pathname: blob.pathname,
    size: file.size,
    contentType: blob.contentType,
  })
}
