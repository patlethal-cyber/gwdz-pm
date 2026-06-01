import { type NextRequest } from 'next/server'
import { del } from '@vercel/blob'

export async function DELETE(request: NextRequest) {
  // Auth check
  const auth = request.cookies.get('gwdz-auth')
  if (!auth || auth.value !== 'authenticated') {
    return Response.json({ error: '未授权访问' }, { status: 401 })
  }

  const { url } = (await request.json()) as { url: string }

  if (!url) {
    return Response.json({ error: '缺少 url 参数' }, { status: 400 })
  }

  await del(url)

  return Response.json({ success: true })
}
