// 统一日期工具（U3）—— 全站唯一的 YYYY-MM-DD 计算来源。
//
// 约定：一律基于**本地时区**计算和格式化。
// 禁止 `toISOString().slice(0, 10)`：`new Date('YYYY-MM-DDT00:00:00')` 解析为本地午夜，
// 在 UTC+8 下转 ISO 会回退到前一天（旧 reports 页的 getMonday/addDays/getYesterday 因此整体偏移一天）。

/** Date 对象 → 本地时区 YYYY-MM-DD */
export function formatYMD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

/** YYYY-MM-DD → 本地午夜的 Date */
export function parseYMD(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** 日期加 n 天（n 可为负） */
export function addDays(dateStr: string, days: number): string {
  const d = parseYMD(dateStr)
  d.setDate(d.getDate() + days)
  return formatYMD(d)
}

/** b - a 的天数差（同日 = 0） */
export function daysBetween(a: string, b: string): number {
  return Math.round((parseYMD(b).getTime() - parseYMD(a).getTime()) / (1000 * 60 * 60 * 24))
}

/** 所在周的周一 */
export function getMonday(dateStr: string): string {
  const d = parseYMD(dateStr)
  const day = d.getDay() // 0=Sun
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return formatYMD(d)
}

/** 所在周的周日（本周末） */
export function getWeekEnd(dateStr: string): string {
  const d = parseYMD(dateStr)
  const day = d.getDay() // 0=Sun
  d.setDate(d.getDate() + (day === 0 ? 0 : 7 - day))
  return formatYMD(d)
}

/** 上一个工作日：周一→上周五，周日→上周五，其余→昨天（早会日报口径） */
export function getPrevWorkday(dateStr: string): string {
  const d = parseYMD(dateStr)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 1 ? -3 : day === 0 ? -2 : -1))
  return formatYMD(d)
}

/** YYYY-MM-DD → YYYY/MM/DD（展示用） */
export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${y}/${m}/${d}`
}
