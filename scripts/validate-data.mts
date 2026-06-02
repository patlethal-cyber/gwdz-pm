/**
 * 用真实的 validateCollection（lib/schemas.ts）校验本地备份的 7 个集合。
 * 确认现有生产数据全部通过 Zod —— 否则上线后该集合首次保存会 422。
 * 用法：npx tsx scripts/validate-data.mts <backup-dir>
 */
import { validateCollection } from '../lib/schemas'
import { readFileSync } from 'fs'

const dir = process.argv[2]
if (!dir) { console.error('用法: npx tsx scripts/validate-data.mts <backup-dir>'); process.exit(2) }

const COLLECTIONS = ['tasks', 'deliverables', 'meetings', 'issues', 'activities', 'versions', 'files']
let allPass = true

for (const c of COLLECTIONS) {
  const data = JSON.parse(readFileSync(`${dir}/${c}.json`, 'utf-8'))
  const result = validateCollection(c, data)
  if (result.ok) {
    console.log(`✅ ${c.padEnd(13)} ${String(data.length).padStart(4)} 条 — PASS`)
  } else {
    allPass = false
    console.log(`❌ ${c.padEnd(13)} FAIL — ${result.error}`)
  }
}

console.log(allPass ? '\n✅ 全部通过：现有生产数据符合新 Zod schema，上线安全' : '\n❌ 有集合不通过：需先放宽 schema 再上线')
process.exit(allPass ? 0 : 1)
