/**
 * Upload archive (_归档/) files to Vercel Blob
 * Run AFTER bulk-upload.mjs completes.
 * Merges results into upload-results.json.
 */

import { put } from '@vercel/blob'
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs'
import { join, basename, extname, relative } from 'path'

const envPath = new URL('../.env.local', import.meta.url).pathname
const envContent = readFileSync(envPath, 'utf-8')
for (const line of envContent.split('\n')) {
  const m = line.match(/^(\w+)="?([^"]*)"?$/)
  if (m) process.env[m[1]] = m[2]
}

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('Missing BLOB_READ_WRITE_TOKEN'); process.exit(1)
}

const GWDZ_ROOT = new URL('../../', import.meta.url).pathname
const ARCHIVE_DIR = join(GWDZ_ROOT, '_归档')
const SKIP_PATTERNS = ['.DS_Store', '~$', 'Thumbs.db']

function mimeType(name) {
  const ext = extname(name).toLowerCase()
  const map = {
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.pdf': 'application/pdf', '.md': 'text/markdown', '.txt': 'text/plain',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
  }
  return map[ext] || 'application/octet-stream'
}

function walkDir(dir, depth = 0) {
  const results = []
  if (depth > 8) return results
  try {
    for (const entry of readdirSync(dir)) {
      if (SKIP_PATTERNS.some(p => entry.includes(p))) continue
      const full = join(dir, entry)
      const stat = statSync(full)
      if (stat.isDirectory()) results.push(...walkDir(full, depth + 1))
      else results.push({ fullPath: full, size: stat.size })
    }
  } catch (e) { console.warn(`Skip: ${dir}`) }
  return results
}

// Deliverable version mappings for archive files
const P_MAP = { 'P01': 'd078', 'P02': 'd079', 'P03': 'd080', 'P04': 'd081' }
const SCENARIO_MAP = {
  'S01': 's01', 'S02': 's02', 'S04': 's04', 'S06': 's06',
  'S98': 's98', 'S100': 's100', 'S101': 's101',
  'S37': 's37', 'S38': 's38', 'S53': 's53', 'S95': 's95', 'S99': 's99',
  '37': 's37', '38': 's38', '53': 's53', '95': 's95', '99': 's99',
}
const T02_MAP = {
  's02': 'd013', 's100': 'd014', 's04': 'd015', 's06': 'd016',
  's01': 'd017', 's101': 'd018', 's98': 'd019',
  's37': 'd020', 's38': 'd021', 's53': 'd022', 's95': 'd023', 's99': 'd024',
}

function detectVersion(name) {
  const m = name.match(/[vV](\d+(?:\.\d+)?)/i)
  return m ? `v${m[1]}` : null
}

function detectLinks(name, relPath) {
  const links = { deliverableId: null, version: null, scenarioId: null, isArchive: true }

  // P01-P04 old versions (e.g. "文件1-项目实施总体计划书-v1.1.docx" or "P03-项目WBS甘特图-v1.2.xlsx")
  for (const [code, id] of Object.entries(P_MAP)) {
    if (name.includes(code + '-') || name.includes(code + '—')) {
      links.deliverableId = id
      links.version = detectVersion(name)
      break
    }
  }
  // Also match "文件1-项目实施总体计划书" → P01, "文件4-项目阶段交付物清单" → P04
  if (!links.deliverableId) {
    if (name.includes('项目实施总体计划书') || name.startsWith('文件1-')) { links.deliverableId = 'd078'; links.version = detectVersion(name) || 'v1.0' }
    if (name.includes('技术方案书') || name.startsWith('文件2-')) { links.deliverableId = 'd079'; links.version = detectVersion(name) || 'v1.0' }
    if (name.includes('交付物清单') || name.startsWith('文件4-')) { links.deliverableId = 'd081'; links.version = detectVersion(name) || 'v1.0' }
  }

  // T02 blueprints (archived versions)
  if (relPath.includes('07_方案蓝图') || relPath.includes('蓝图')) {
    for (const [code, sid] of Object.entries(SCENARIO_MAP)) {
      const patterns = [code + '-', code + '—', '场景' + code.replace('S', '') + '-', 'S' + code.replace('S', '') + '-']
      if (patterns.some(p => name.includes(p))) {
        links.scenarioId = sid
        // Archive blueprints are older versions
        if (relPath.includes('初稿') || name.includes('初稿')) {
          links.deliverableId = T02_MAP[sid]; links.version = 'v1-初稿'
        } else if (relPath.includes('2026-04-30') || relPath.includes('0430')) {
          links.deliverableId = T02_MAP[sid]; links.version = 'v1'
        } else if (relPath.includes('0519') || relPath.includes('S01_工作中')) {
          links.deliverableId = T02_MAP[sid]; links.version = detectVersion(name) || 'v2-draft'
        }
        break
      }
    }
  }

  // 启动会 PPT versions
  if (name.includes('启动会') || name.includes('slide')) {
    links.version = detectVersion(name)
  }

  // 方案汇报 old versions
  if (name.includes('方案汇报') && relPath.includes('02_需求与方案')) {
    links.deliverableId = 'd079' // maps to P02 技术方案书
    links.version = detectVersion(name) || (name.match(/(\d{8})/)?.[1] ? `draft-${name.match(/(\d{8})/)[1]}` : null)
  }

  return links
}

async function main() {
  console.log(`Scanning: ${ARCHIVE_DIR}\n`)
  const allFiles = walkDir(ARCHIVE_DIR)
  console.log(`Found ${allFiles.length} archive files.\n`)

  const results = []
  const versions = []
  let uploaded = 0, failed = 0

  for (const { fullPath, size } of allFiles) {
    if (size > 50 * 1024 * 1024) { console.log(`Skip >50MB: ${basename(fullPath)}`); continue }

    const relPath = relative(GWDZ_ROOT, fullPath)
    const name = basename(fullPath)
    const blobPath = `gwdz/${relPath}`

    try {
      const fileBuffer = readFileSync(fullPath)
      const blob = await put(blobPath, fileBuffer, {
        access: 'public',
        contentType: mimeType(name),
        addRandomSuffix: false,
      })

      uploaded++
      const links = detectLinks(name, relPath)

      results.push({
        originalName: name,
        path: relPath,
        category: '归档',
        fileUrl: blob.url,
        fileSize: size,
        fileType: mimeType(name),
        deliverableId: links.deliverableId,
        version: links.version,
        scenarioId: links.scenarioId,
        isArchive: true,
      })

      if (links.deliverableId && links.version) {
        versions.push({
          deliverableId: links.deliverableId,
          versionNumber: links.version,
          fileName: name,
          fileUrl: blob.url,
          fileSize: size,
          fileType: mimeType(name),
          notes: '归档版本',
        })
      }

      const pct = Math.round(uploaded / allFiles.length * 100)
      process.stdout.write(`\r[${pct}%] ${uploaded}/${allFiles.length} — ${name.slice(0, 60).padEnd(60)}`)
    } catch (e) {
      failed++
      console.error(`\nFailed: ${relPath} — ${e.message}`)
    }
  }

  console.log(`\n\n=== Archive Upload Summary ===`)
  console.log(`Uploaded: ${uploaded}`)
  console.log(`Failed:   ${failed}`)
  console.log(`Versions: ${versions.length} deliverable version links`)

  // Merge with existing results if available
  const mainResultsPath = join(new URL('.', import.meta.url).pathname, 'upload-results.json')
  let merged = { files: [], versions: [] }
  if (existsSync(mainResultsPath)) {
    merged = JSON.parse(readFileSync(mainResultsPath, 'utf-8'))
    console.log(`\nMerging with existing results (${merged.files.length} files, ${merged.versions.length} versions)`)
  }

  merged.files.push(...results)
  merged.versions.push(...versions)

  writeFileSync(mainResultsPath, JSON.stringify(merged, null, 2))
  console.log(`Total: ${merged.files.length} files, ${merged.versions.length} versions`)
  console.log(`Saved: ${mainResultsPath}`)
}

main().catch(e => { console.error(e); process.exit(1) })
