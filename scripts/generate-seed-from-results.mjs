/**
 * Reads upload-results.json and generates:
 * 1. Updated files-seed.ts with real Blob URLs
 * 2. versions-seed data for DeliverableVersions
 *
 * Run: node scripts/generate-seed-from-results.mjs
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const SCRIPTS_DIR = new URL('.', import.meta.url).pathname
const LIB_DIR = join(SCRIPTS_DIR, '..', 'lib')

const results = JSON.parse(readFileSync(join(SCRIPTS_DIR, 'upload-results.json'), 'utf-8'))
console.log(`Loaded: ${results.files.length} files, ${results.versions.length} versions`)

// Category mapping from path
function categorize(path) {
  if (path.startsWith('01_')) return '合同与商务'
  if (path.startsWith('02_')) return '需求与方案'
  if (path.startsWith('03_')) return '项目计划'
  if (path.startsWith('04_')) return '交付物模板'
  if (path.startsWith('05_')) return '内部管理'
  if (path.startsWith('06_')) return '财务预算'
  if (path.startsWith('07_')) return '方案蓝图'
  if (path.startsWith('08_')) return '样本数据'
  if (path.startsWith('平台')) return '其他'
  return '其他'
}

// Scenario detection
function detectScenario(name, path) {
  const scenarioMap = {
    'S01': 's01', 'S02': 's02', 'S04': 's04', 'S06': 's06',
    'S98': 's98', 'S100': 's100', 'S101': 's101',
    'S37': 's37', 'S38': 's38', 'S53': 's53', 'S95': 's95', 'S99': 's99',
  }
  for (const [code, sid] of Object.entries(scenarioMap)) {
    if (name.includes(code + '-') || name.includes(code + '0') || name.includes(code + '—')) {
      return sid
    }
  }
  // Check path for scenario folders
  if (path.includes('客户质量部')) {
    for (const [code, sid] of Object.entries(scenarioMap)) {
      if (path.includes(code)) return sid
    }
  }
  return null
}

// Deliverable linking
const P_MAP = { 'P01': 'd078', 'P02': 'd079', 'P03': 'd080', 'P04': 'd081' }
const T02_MAP = {
  's02': 'd013', 's100': 'd014', 's04': 'd015', 's06': 'd016',
  's01': 'd017', 's101': 'd018', 's98': 'd019',
  's37': 'd020', 's38': 'd021', 's53': 'd022', 's95': 'd023', 's99': 'd024',
}

function detectDeliverableIds(name, path, scenarioId) {
  const ids = []
  // P01-P04
  for (const [code, id] of Object.entries(P_MAP)) {
    if (name.startsWith(code + '-') || name.startsWith(code + '—')) ids.push(id)
  }
  // Alternate names
  if (name.includes('项目实施总体计划书')) ids.push('d078')
  if (name.includes('技术方案书') && !name.includes('模板')) ids.push('d079')
  if (name.includes('交付物清单') && path.startsWith('03_')) ids.push('d081')

  // T02 blueprints in 07_/0527
  if (path.includes('07_方案蓝图') && path.includes('0527') && scenarioId && T02_MAP[scenarioId]) {
    ids.push(T02_MAP[scenarioId])
  }
  return [...new Set(ids)]
}

// Generate files-seed.ts
let fileEntries = ''
let idx = 1

for (const f of results.files) {
  const cat = f.category || categorize(f.path)
  const sid = f.scenarioId || detectScenario(f.originalName, f.path)
  const delIds = detectDeliverableIds(f.originalName, f.path, sid)
  const tags = []

  // Auto-tag
  if (f.path.includes('0527')) tags.push('0527')
  if (f.path.includes('0519')) tags.push('0519')
  if (f.path.includes('0521')) tags.push('0521')
  if (f.path.includes('0426')) tags.push('调研表')
  if (f.path.includes('周报')) tags.push('周报')
  if (f.path.includes('日报')) tags.push('日报')
  if (f.originalName.includes('模板')) tags.push('模板')
  if (f.originalName.match(/[vV]\d/)) tags.push(f.originalName.match(/[vV](\d+(?:\.\d+)?)/)?.[0] || '')

  const id = `f${String(idx++).padStart(3, '0')}`

  fileEntries += `  {
    id: '${id}',
    name: ${JSON.stringify(f.originalName.replace(/\.[^.]+$/, ''))},
    originalName: ${JSON.stringify(f.originalName)},
    path: ${JSON.stringify(f.path)},
    category: ${JSON.stringify(cat)} as FileCategory,
    fileUrl: ${JSON.stringify(f.fileUrl)},
    fileSize: ${f.fileSize},
    fileType: ${JSON.stringify(f.fileType)},
    uploadedAt: '2026-06-01',
    uploadedBy: 'm01',
    linkedDeliverableIds: ${JSON.stringify(delIds)},
    linkedTaskIds: [],
    linkedIssueIds: [],
    ${sid ? `scenarioId: '${sid}',` : ''}
    tags: ${JSON.stringify(tags.filter(Boolean))},
  },\n`
}

const filesSeedContent = `import type { ProjectFile, FileCategory } from '../types'

export function generateFileMetadata(): ProjectFile[] {
  return [
${fileEntries}  ]
}
`

writeFileSync(join(LIB_DIR, 'data', 'files-seed.ts'), filesSeedContent)
console.log(`Written files-seed.ts with ${results.files.length} entries (all with real Blob URLs)`)

// Generate versions seed
const versionEntries = []
let vidx = 1

for (const v of results.versions) {
  if (!v.deliverableId || !v.version) continue
  versionEntries.push({
    id: `dv${String(vidx++).padStart(3, '0')}`,
    deliverableId: v.deliverableId,
    versionNumber: v.version,
    fileName: v.fileName,
    fileUrl: v.fileUrl,
    fileSize: v.fileSize,
    fileType: v.fileType,
    uploadedAt: '2026-06-01',
  })
}

// Also scan files for additional version links
for (const f of results.files) {
  const sid = f.scenarioId || detectScenario(f.originalName, f.path)
  const delIds = detectDeliverableIds(f.originalName, f.path, sid)
  if (delIds.length === 0) continue

  const ver = f.originalName.match(/[vV](\d+(?:\.\d+)?)/)?.[0]
  if (!ver) continue

  // Check we don't already have this version entry
  const alreadyHas = versionEntries.some(v => v.deliverableId === delIds[0] && v.versionNumber === ver)
  if (alreadyHas) continue

  versionEntries.push({
    id: `dv${String(vidx++).padStart(3, '0')}`,
    deliverableId: delIds[0],
    versionNumber: ver,
    fileName: f.originalName,
    fileUrl: f.fileUrl,
    fileSize: f.fileSize,
    fileType: f.fileType,
    uploadedAt: '2026-06-01',
  })
}

const versionsSeedContent = `import type { DeliverableVersion } from '../types'

export function generateVersions(): DeliverableVersion[] {
  return ${JSON.stringify(versionEntries, null, 2)}
}
`

writeFileSync(join(LIB_DIR, 'data', 'versions-seed.ts'), versionsSeedContent)
console.log(`Written versions-seed.ts with ${versionEntries.length} deliverable version entries`)

console.log('\nDone! Next: update data-context.tsx to import versions-seed and load as default versions.')
