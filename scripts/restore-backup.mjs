/**
 * Restore user backup data to Vercel Blob server
 * Reads the export JSON and PUTs each collection to /api/data/[collection]
 */
import { put } from '@vercel/blob'
import { readFileSync } from 'fs'

// Load env
const envContent = readFileSync(new URL('../.env.local', import.meta.url).pathname, 'utf-8')
for (const line of envContent.split('\n')) {
  const m = line.match(/^(\w+)="?([^"]*)"?$/)
  if (m) process.env[m[1]] = m[2]
}

const data = JSON.parse(readFileSync('/Users/lipei/Downloads/gwdz-pm-export-2026-06-01 (1).json', 'utf-8'))

const mapping = {
  tasks: data.tasks,
  deliverables: data.deliverables,
  meetings: data.meetings,
  issues: data.issues,
  activities: data.activities,
  versions: data.deliverableVersions,
  files: data.files,
}

async function restore() {
  for (const [collection, items] of Object.entries(mapping)) {
    if (!items) { console.log(`Skip ${collection}: no data`); continue }
    const path = `db/${collection}.json`
    await put(path, JSON.stringify(items), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
    })
    console.log(`✅ ${collection}: ${Array.isArray(items) ? items.length : '?'} items restored`)
  }
  console.log('\nDone! All data restored to server.')
}

restore().catch(e => { console.error(e); process.exit(1) })
