// Zod 校验 schema —— 防脏数据写入 Blob 导致全员加载崩溃 (A5)
//
// 设计原则：**故意宽松**。只校验"是数组 + 每条是带 string id 的对象 + 核心识别字段类型对"，
// 其余字段一律 passthrough。枚举值用 z.string() 而非字面量联合，避免枚举漂移时误拒合法数据
// —— 误拒会反过来造成数据丢失，比放过脏数据更糟。目标是挡住灾难性损坏（非数组 / null / 缺 id），
// 不是强制业务规则。
import { z } from 'zod'

const task = z.looseObject({ id: z.string(), title: z.string(), status: z.string() })
const deliverable = z.looseObject({ id: z.string(), name: z.string(), status: z.string() })
const issue = z.looseObject({ id: z.string(), title: z.string(), status: z.string() })
const meeting = z.looseObject({ id: z.string(), title: z.string() })
const version = z.looseObject({ id: z.string(), deliverableId: z.string() })
const file = z.looseObject({ id: z.string(), name: z.string() })
const activity = z.looseObject({ id: z.string(), entityType: z.string(), action: z.string() })

export const COLLECTION_SCHEMAS = {
  tasks: z.array(task),
  deliverables: z.array(deliverable),
  meetings: z.array(meeting),
  issues: z.array(issue),
  versions: z.array(version),
  files: z.array(file),
  activities: z.array(activity),
} as const

export type CollectionName = keyof typeof COLLECTION_SCHEMAS

export function validateCollection(collection: string, data: unknown) {
  const schema = COLLECTION_SCHEMAS[collection as CollectionName]
  if (!schema) return { ok: false as const, error: '无效的数据集合' }
  const result = schema.safeParse(data)
  if (!result.success) {
    return { ok: false as const, error: result.error.issues.slice(0, 3).map(i => `${i.path.join('.')}: ${i.message}`).join('; ') }
  }
  return { ok: true as const, data: result.data }
}
