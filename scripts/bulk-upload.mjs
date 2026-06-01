/**
 * Bulk upload — uploads ALL project documents to Vercel Blob
 * Scans entire GWDZ directory, excluding code/archive/system dirs.
 *
 * Usage: node scripts/bulk-upload.mjs
 */

import { put } from '@vercel/blob'
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, basename, extname, relative } from 'path'

// Load .env.local
const envPath = new URL('../.env.local', import.meta.url).pathname
const envContent = readFileSync(envPath, 'utf-8')
for (const line of envContent.split('\n')) {
  const m = line.match(/^(\w+)="?([^"]*)"?$/)
  if (m) process.env[m[1]] = m[2]
}

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('Missing BLOB_READ_WRITE_TOKEN in .env.local')
  process.exit(1)
}

// Scan from GWDZ root (parent of gwdz-pm)
const GWDZ_ROOT = new URL('../../', import.meta.url).pathname
const SKIP_DIRS = new Set(['gwdz-pm', '_归档', '.git', '.claude', 'node_modules', '.next', '.vercel'])
const SKIP_PATTERNS = ['.DS_Store', '~$', 'Thumbs.db']
const ALLOWED_EXTS = new Set([
  '.docx', '.xlsx', '.pptx', '.pdf', '.md', '.txt',
  '.png', '.jpg', '.jpeg', '.gif', '.bmp',
  '.csv', '.json', '.xml', '.html',
  '.py', '.yaml', '.yml',
])

function mimeType(name) {
  const ext = extname(name).toLowerCase()
  const map = {
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.pdf': 'application/pdf',
    '.md': 'text/markdown', '.txt': 'text/plain', '.csv': 'text/csv',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.gif': 'image/gif', '.bmp': 'image/bmp',
    '.json': 'application/json', '.xml': 'application/xml', '.html': 'text/html',
    '.py': 'text/x-python', '.yaml': 'text/yaml', '.yml': 'text/yaml',
  }
  return map[ext] || 'application/octet-stream'
}

function walkDir(dir, depth = 0) {
  const results = []
  if (depth > 8) return results
  try {
    const entries = readdirSync(dir)
    for (const entry of entries) {
      if (SKIP_PATTERNS.some(p => entry.includes(p))) continue
      if (depth === 0 && SKIP_DIRS.has(entry)) continue
      const full = join(dir, entry)
      const stat = statSync(full)
      if (stat.isDirectory()) {
        results.push(...walkDir(full, depth + 1))
      } else if (ALLOWED_EXTS.has(extname(entry).toLowerCase())) {
        results.push({ fullPath: full, size: stat.size })
      }
    }
  } catch (e) {
    console.warn(`Skip: ${dir} — ${e.message}`)
  }
  return results
}

// Deliverable mappings
const P_MAP = { 'P01': 'd078', 'P02': 'd079', 'P03': 'd080', 'P04': 'd081' }
const SCENARIO_MAP = {
  'S01': 's01', 'S02': 's02', 'S04': 's04', 'S06': 's06',
  'S98': 's98', 'S100': 's100', 'S101': 's101',
  'S37': 's37', 'S38': 's38', 'S53': 's53', 'S95': 's95', 'S99': 's99',
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
  const links = { deliverableId: null, version: null, scenarioId: null }

  // P01-P04
  for (const [code, id] of Object.entries(P_MAP)) {
    if (name.startsWith(code + '-') || name.startsWith(code + '—')) {
      links.deliverableId = id
      links.version = detectVersion(name)
      break
    }
  }

  // T02 blueprints — 0527 = latest
  if (relPath.includes('07_方案蓝图') && relPath.includes('0527')) {
    for (const [code, sid] of Object.entries(SCENARIO_MAP)) {
      if (name.includes(code + '-') || name.includes(code + '—') || name.includes(code + '0527')) {
        links.scenarioId = sid
        links.deliverableId = T02_MAP[sid]
        links.version = detectVersion(name) || 'v2'
        break
      }
    }
  }

  // Scenario detection from name
  if (!links.scenarioId) {
    for (const [code, sid] of Object.entries(SCENARIO_MAP)) {
      if (name.includes(code + '-') || name.includes(code + '—') || name.includes(code + '0')) {
        links.scenarioId = sid
        break
      }
    }
  }

  return links
}

function categorize(relPath) {
  if (relPath.startsWith('01_')) return '合同与商务'
  if (relPath.startsWith('02_')) return '需求与方案'
  if (relPath.startsWith('03_')) return '项目计划'
  if (relPath.startsWith('04_')) return '交付物模板'
  if (relPath.startsWith('05_')) return '内部管理'
  if (relPath.startsWith('06_')) return '财务预算'
  if (relPath.startsWith('07_')) return '方案蓝图'
  if (relPath.startsWith('08_')) return '样本数据'
  return '其他'
}

async function main() {
  console.log(`Scanning: ${GWDZ_ROOT}`)
  console.log(`Skipping: ${[...SKIP_DIRS].join(', ')}\n`)

  const allFiles = walkDir(GWDZ_ROOT)
  console.log(`Found ${allFiles.length} files to upload.\n`)

  const results = []
  const versions = []
  let uploaded = 0, failed = 0, skipped = 0

  for (const { fullPath, size } of allFiles) {
    const relPath = relative(GWDZ_ROOT, fullPath)
    const name = basename(fullPath)

    // Skip very large files (>50MB)
    if (size > 50 * 1024 * 1024) {
      console.log(`\nSkip (>50MB): ${relPath} (${(size / 1024 / 1024).toFixed(1)}MB)`)
      skipped++
      continue
    }

    const blobPath = `gwdz/${relPath}`

    try {
      const fileBuffer = readFileSync(fullPath)
      const blob = await put(blobPath, fileBuffer, {
        access: 'public',
        contentType: mimeType(name),
      })

      uploaded++
      const links = detectLinks(name, relPath)

      results.push({
        originalName: name,
        path: relPath,
        category: categorize(relPath),
        fileUrl: blob.url,
        fileSize: size,
        fileType: mimeType(name),
        deliverableId: links.deliverableId,
        version: links.version,
        scenarioId: links.scenarioId,
      })

      if (links.deliverableId && links.version) {
        versions.push({
          deliverableId: links.deliverableId,
          versionNumber: links.version,
          fileName: name,
          fileUrl: blob.url,
          fileSize: size,
          fileType: mimeType(name),
        })
      }

      const total = allFiles.length - skipped
      const pct = Math.round((uploaded + failed) / total * 100)
      process.stdout.write(`\r[${pct}%] ${uploaded}/${total} — ${name.slice(0, 60).padEnd(60)}`)
    } catch (e) {
      failed++
      console.error(`\nFailed: ${relPath} — ${e.message}`)
    }
  }

  console.log(`\n\n=== Summary ===`)
  console.log(`Uploaded: ${uploaded}`)
  console.log(`Failed:   ${failed}`)
  console.log(`Skipped:  ${skipped}`)
  console.log(`Versions: ${versions.length} deliverable version links detected`)

  const outputPath = join(new URL('.', import.meta.url).pathname, 'upload-results.json')
  writeFileSync(outputPath, JSON.stringify({ files: results, versions }, null, 2))
  console.log(`\nResults: ${outputPath}`)
}

main().catch(e => { console.error(e); process.exit(1) })
