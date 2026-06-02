/**
 * 备份 Vercel Blob 上全部 7 个系统数据集合到本地时间戳目录。
 * 产出：backups/<ts>/<collection>.json（逐集合）+ export.json（restore 兼容）+ manifest.json（条数+版本号）
 * 用法：node scripts/backup-data.mjs
 */
import { head } from '@vercel/blob'
import { writeFileSync, mkdirSync, readFileSync } from 'fs'

// Load .env.local
const envContent = readFileSync(new URL('../.env.local', import.meta.url).pathname, 'utf-8')
for (const line of envContent.split('\n')) {
  const m = line.match(/^(\w+)="?([^"]*)"?$/)
  if (m) process.env[m[1]] = m[2]
}

const COLLECTIONS = ['tasks', 'deliverables', 'meetings', 'issues', 'activities', 'versions', 'files']

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const dir = new URL(`../backups/${stamp}/`, import.meta.url).pathname
mkdirSync(dir, { recursive: true })

const combined = {}
const manifest = []

for (const c of COLLECTIONS) {
  try {
    const info = await head(`db/${c}.json`)
    const res = await fetch(info.url, { cache: 'no-store' })
    const data = await res.json()
    writeFileSync(`${dir}${c}.json`, JSON.stringify(data, null, 2))
    // export.json 用 restore-backup.mjs 的键名（versions -> deliverableVersions）
    combined[c === 'versions' ? 'deliverableVersions' : c] = data
    manifest.push({
      collection: c,
      count: Array.isArray(data) ? data.length : 'NOT_ARRAY',
      version: new Date(info.uploadedAt).toISOString(),
      bytes: JSON.stringify(data).length,
    })
  } catch (e) {
    // blob 不存在 = 该集合为空
    writeFileSync(`${dir}${c}.json`, '[]')
    combined[c === 'versions' ? 'deliverableVersions' : c] = []
    manifest.push({ collection: c, count: 0, version: '(blob 不存在)', bytes: 2 })
  }
}

writeFileSync(`${dir}export.json`, JSON.stringify(combined, null, 2))
writeFileSync(`${dir}manifest.json`, JSON.stringify(manifest, null, 2))

console.table(manifest)
console.log('\n✅ 备份目录:', dir)
console.log('   - 逐集合 7 份 + export.json（restore 兼容）+ manifest.json')
