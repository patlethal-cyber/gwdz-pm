/**
 * Fix file-to-deliverable associations in files-seed.ts
 * Reads current seed, applies association rules, rewrites.
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const SEED_PATH = join(new URL('..', import.meta.url).pathname, 'lib/data/files-seed.ts')
const content = readFileSync(SEED_PATH, 'utf-8')

// Deliverable ID map (from seed-generator output: T01-T06 x 12 scenarios + T06-total + T07-T12 + P01-P04)
// Scenario order in seed-generator: s06, s100, s37, s53, s02, s01, s04, s98, s101, s38, s95, s99
const SCENARIO_ORDER = ['s06', 's100', 's37', 's53', 's02', 's01', 's04', 's98', 's101', 's38', 's95', 's99']
const TEMPLATE_CODES = ['T01', 'T02', 'T03', 'T04', 'T05', 'T06']

// Build deliverable ID map: d001-d072 = T01-T06 x 12 scenarios
const deliverableMap = {} // { 'T01-s06': 'd001', 'T01-s100': 'd002', ... }
let idx = 1
for (const tmpl of TEMPLATE_CODES) {
  for (const sid of SCENARIO_ORDER) {
    deliverableMap[`${tmpl}-${sid}`] = `d${String(idx).padStart(3, '0')}`
    idx++
  }
  if (tmpl === 'T06') {
    deliverableMap['T06-total'] = `d${String(idx).padStart(3, '0')}`
    idx++
  }
}
// T07-T12: d074-d079
const projectTemplates = ['T07', 'T08', 'T09', 'T10', 'T11', 'T12']
for (const code of projectTemplates) {
  deliverableMap[code] = `d${String(idx).padStart(3, '0')}`
  idx++
}
// P01-P04: d080-d083
deliverableMap['P01'] = `d${String(idx).padStart(3, '0')}`; idx++
deliverableMap['P02'] = `d${String(idx).padStart(3, '0')}`; idx++
deliverableMap['P03'] = `d${String(idx).padStart(3, '0')}`; idx++
deliverableMap['P04'] = `d${String(idx).padStart(3, '0')}`; idx++

console.log('Deliverable map sample:')
console.log('  T01-s02 =', deliverableMap['T01-s02'])
console.log('  T02-s02 =', deliverableMap['T02-s02'])
console.log('  T02-s37 =', deliverableMap['T02-s37'])
console.log('  P01 =', deliverableMap['P01'])
console.log('  P03 =', deliverableMap['P03'])
console.log('  T11 =', deliverableMap['T11'])
console.log('  T12 =', deliverableMap['T12'])
console.log('  Total entries:', Object.keys(deliverableMap).length)

// Scenario code → id mapping
const SCENARIO_CODES = {
  'S01': 's01', 'S02': 's02', 'S04': 's04', 'S06': 's06',
  'S37': 's37', 'S38': 's38', 'S53': 's53', 'S95': 's95',
  'S98': 's98', 'S99': 's99', 'S100': 's100', 'S101': 's101',
}

// Association rules based on file path and name
function getAssociations(name, path) {
  const ids = []
  const lower = name.toLowerCase()
  const pathLower = path.toLowerCase()

  // P01-P04 project docs
  if (name.startsWith('P01-') || name.includes('项目实施总体计划书')) ids.push(deliverableMap['P01'])
  if (name.startsWith('P02-') || name.includes('技术方案书')) ids.push(deliverableMap['P02'])
  if (name.startsWith('P03-') || name.includes('WBS甘特图') || name.includes('项目WBS')) ids.push(deliverableMap['P03'])
  if (name.startsWith('P04-') || name.includes('交付物清单')) ids.push(deliverableMap['P04'])

  // 启动会PPT → P01 (part of project plan)
  if (name.includes('启动会') && name.endsWith('.pptx')) ids.push(deliverableMap['P01'])

  // T01-T12 templates in 04_交付物模板
  if (path.startsWith('04_')) {
    for (const code of ['T01','T02','T03','T04','T05','T06','T07','T08','T09','T10','T11','T12']) {
      if (name.startsWith(code + '-') || name.startsWith(code + '—')) {
        if (['T07','T08','T09','T10','T11','T12'].includes(code)) {
          ids.push(deliverableMap[code])
        }
        // T01-T06 templates are project-level, link to all scenarios? No, just mark as template
        break
      }
    }
    if (name.includes('蓝图') && name.includes('模板')) ids.push(deliverableMap['T02-s01']) // link to one representative
  }

  // Weekly reports → T12
  if (path.includes('周报') && name.includes('周报')) ids.push(deliverableMap['T12'])

  // Daily reports → T11
  if (path.includes('日报')) ids.push(deliverableMap['T11'])

  // 07_方案蓝图 files → T02 per scenario
  if (path.includes('07_方案蓝图')) {
    // Find which scenario this blueprint belongs to
    for (const [code, sid] of Object.entries(SCENARIO_CODES)) {
      if (name.includes(code + '-') || name.includes(code + '—') || name.includes(code + '0') ||
          name.includes(code.toLowerCase() + '-')) {
        const key = `T02-${sid}`
        if (deliverableMap[key]) ids.push(deliverableMap[key])
        break
      }
    }
    // 0426 调研表 files → T01 per scenario
    if (path.includes('0426') && name.includes('调研表')) {
      for (const [code, sid] of Object.entries(SCENARIO_CODES)) {
        if (name.includes(code + '-')) {
          const key = `T01-${sid}`
          if (deliverableMap[key]) ids.push(deliverableMap[key])
          break
        }
      }
    }
  }

  // 08_样本数据/客户质量部 → link to relevant scenario's T03 (data engineering)
  if (path.includes('08_样本数据/客户质量部')) {
    // S02 sample data
    if (path.includes('S02') || path.includes('失效器件')) {
      ids.push(deliverableMap['T03-s02'])
    }
    if (path.includes('S04') || path.includes('质量履历') || path.includes('BI看板')) {
      ids.push(deliverableMap['T03-s04'])
    }
    if (path.includes('S100') || path.includes('审核')) {
      ids.push(deliverableMap['T03-s100'])
    }
    if (path.includes('S98') || path.includes('管控')) {
      ids.push(deliverableMap['T03-s98'])
    }
  }

  // 08_样本数据/测试一部 → S37/S38 data
  if (path.includes('08_样本数据/测试一部')) {
    if (path.includes('01-') || path.includes('02-') || path.includes('03-') || path.includes('04-') ||
        path.includes('ATE') || path.includes('报告')) {
      ids.push(deliverableMap['T03-s37'])
    }
    if (path.includes('07-') || path.includes('QA') || path.includes('知识库')) {
      ids.push(deliverableMap['T03-s38'])
    }
    // 测试规范文档 → S37 + S38
    if (path.includes('12-') || name.includes('规范') || name.includes('标准')) {
      if (!ids.includes(deliverableMap['T03-s37'])) ids.push(deliverableMap['T03-s37'])
      if (!ids.includes(deliverableMap['T03-s38'])) ids.push(deliverableMap['T03-s38'])
    }
  }

  // 08_样本数据/测试二部 → S53/S95/S99
  if (path.includes('08_样本数据/测试二部')) {
    if (path.includes('S53') || path.includes('指导书') || path.includes('checklist')) {
      ids.push(deliverableMap['T03-s53'])
    }
    if (path.includes('S95') || path.includes('验证') || path.includes('报告')) {
      ids.push(deliverableMap['T03-s95'])
    }
    if (path.includes('QA') || path.includes('S99')) {
      ids.push(deliverableMap['T03-s99'])
    }
  }

  // 工作记录/任务分配 → project-level deliverables
  if (name.includes('任务分配') || name.includes('工作记录')) ids.push(deliverableMap['T07'])
  if (name.includes('问题清单')) ids.push(deliverableMap['T07'])
  if (name.includes('预算')) ids.push(deliverableMap['P04'])

  return [...new Set(ids.filter(Boolean))]
}

// Process the file
let updated = content
let linkedCount = 0
let totalCount = 0

// Match each file entry and update linkedDeliverableIds
const filePattern = /name: ("(?:[^"\\]|\\.)*"),\s*\n\s*originalName: ("(?:[^"\\]|\\.)*"),\s*\n\s*path: ("(?:[^"\\]|\\.)*"),[\s\S]*?linkedDeliverableIds: \[\]/g

updated = content.replace(filePattern, (match, nameStr, origNameStr, pathStr) => {
  totalCount++
  const name = JSON.parse(origNameStr)
  const path = JSON.parse(pathStr)
  const associations = getAssociations(name, path)

  if (associations.length > 0) {
    linkedCount++
    const idsStr = associations.map(id => `'${id}'`).join(', ')
    return match.replace('linkedDeliverableIds: []', `linkedDeliverableIds: [${idsStr}]`)
  }
  return match
})

writeFileSync(SEED_PATH, updated)
console.log(`\nProcessed ${totalCount} files`)
console.log(`Linked ${linkedCount} files to deliverables`)
console.log(`Remaining unlinked: ${totalCount - linkedCount}`)
