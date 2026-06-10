import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 备份 cron 不走 cookie 认证 — 由 Vercel Cron 触发，路由内部用 CRON_SECRET 鉴权。
  // 故意写精确路径而非 '/api/cron' 前缀：未来新增 cron 路由必须逐个在此登记，防止默认裸奔
  const publicPaths = ['/login', '/api/auth', '/api/cron/backup']
  if (publicPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next()
  }

  const token = request.cookies.get('gwdz-auth')?.value
  if (token !== 'authenticated') {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
