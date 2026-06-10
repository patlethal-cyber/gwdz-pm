// F7 活动日志归档 — 纯函数部分（可离线测试，不依赖 Blob）。
//
// 背景：客户端 logActivity 把工作集裁剪到 200 条后整集合 PUT。被裁掉的旧条目
// 在服务端覆写前 diff 出来，追加进 db/activities-archive.json（append-only），
// 保证审计记录永不丢失，同时工作集 / 每次 PUT 的体积有上限。

interface HasId {
  id: string
}

/** 在 current 中、不在 incoming 中的条目 = 本次覆写将丢弃的条目 */
export function diffDropped<T extends HasId>(current: T[], incoming: T[]): T[] {
  const incomingIds = new Set(incoming.map(e => e.id))
  return current.filter(e => !incomingIds.has(e.id))
}

/** 追加进归档，按 id 去重（PUT 重试 / 409 后重发可能重复提交同一批） */
export function appendToArchive<T extends HasId>(archive: T[], dropped: T[]): T[] {
  const seen = new Set(archive.map(e => e.id))
  const fresh = dropped.filter(e => !seen.has(e.id))
  return fresh.length === 0 ? archive : [...archive, ...fresh]
}
