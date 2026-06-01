import type { ProjectFile } from '../types'

function mimeType(name: string): string {
  if (name.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  if (name.endsWith('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  if (name.endsWith('.pptx')) return 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  if (name.endsWith('.pdf')) return 'application/pdf'
  if (name.endsWith('.md')) return 'text/markdown'
  return 'application/octet-stream'
}

function scenarioFromName(name: string): string | undefined {
  const m = name.match(/S(\d+)/i)
  if (!m) return undefined
  const map: Record<string, string> = {
    '01': 's01', '02': 's02', '04': 's04', '06': 's06',
    '37': 's37', '38': 's38', '53': 's53', '95': 's95',
    '98': 's98', '99': 's99', '100': 's100', '101': 's101',
  }
  return map[m[1]] || undefined
}

function deliverableByCode(code: string): string | undefined {
  const map: Record<string, string> = {
    'P01': 'd078', 'P02': 'd079', 'P03': 'd080', 'P04': 'd081',
  }
  return map[code]
}

export function generateFileMetadata(): ProjectFile[] {
  const files: ProjectFile[] = []
  let idx = 1
  function add(
    name: string,
    path: string,
    category: ProjectFile['category'],
    opts?: { linkedDeliverableIds?: string[]; scenarioId?: string; tags?: string[] }
  ) {
    files.push({
      id: `f${String(idx++).padStart(3, '0')}`,
      name: name.replace(/\.[^.]+$/, ''),
      originalName: name,
      path,
      category,
      fileUrl: '',
      fileSize: 0,
      fileType: mimeType(name),
      uploadedAt: '2026-06-01',
      uploadedBy: 'm01',
      linkedDeliverableIds: opts?.linkedDeliverableIds || [],
      linkedTaskIds: [],
      linkedIssueIds: [],
      scenarioId: opts?.scenarioId,
      tags: opts?.tags || [],
    })
  }

  // === 01_合同与商务 ===
  add('AI Agent项目意向通知函v1.docx', '01_合同与商务', '合同与商务', { tags: ['合同'] })
  add('【火山引擎】私部产品售后服务说明v2.1.docx', '01_合同与商务', '合同与商务', { tags: ['火山'] })
  add('审-伊登悦智2026hiagent-合同20260509XJC.docx', '01_合同与商务', '合同与商务', { tags: ['合同', '已签约'] })
  add('审-国微伊登合同【20260509】XJC.docx', '01_合同与商务', '合同与商务', { tags: ['合同', '已签约'] })
  add('维保承诺对比分析-伊登 vs悦智-20260512.xlsx', '01_合同与商务', '合同与商务', { tags: ['维保'] })

  // === 02_需求与方案 ===
  add('IT技术架构_火山平台部署摘录_20260521.md', '02_需求与方案', '需求与方案', { tags: ['架构'] })
  add('确定版AI Agent开发管理平台需求V1.4-修改高亮.docx', '02_需求与方案', '需求与方案', { tags: ['需求', '定版'] })
  add('补充要求-伊登修改高亮041501.docx', '02_需求与方案', '需求与方案', { tags: ['需求'] })

  // === 03_项目计划与WBS ===
  add('P01-项目实施总体计划书-v1.2.docx', '03_项目计划与WBS', '项目计划', { linkedDeliverableIds: ['d078'], tags: ['P01', '已归档'] })
  add('P02-技术方案书-v1.3.docx', '03_项目计划与WBS', '项目计划', { linkedDeliverableIds: ['d079'], tags: ['P02'] })
  add('P03-项目WBS甘特图-v1.4.xlsx', '03_项目计划与WBS', '项目计划', { linkedDeliverableIds: ['d080'], tags: ['P03', '旧版本'] })
  add('P03-项目WBS甘特图-v1.5.xlsx', '03_项目计划与WBS', '项目计划', { linkedDeliverableIds: ['d080'], tags: ['P03', '已归档'] })
  add('P04-项目阶段交付物清单与模板要求-v1.4.xlsx', '03_项目计划与WBS', '项目计划', { linkedDeliverableIds: ['d081'], tags: ['P04', '已归档'] })
  add('国微电子AI项目启动会0521_v1.1.pptx', '03_项目计划与WBS', '项目计划', { tags: ['启动会'] })
  add('国微电子AI项目启动会052901.pptx', '03_项目计划与WBS', '项目计划', { tags: ['启动会', '最新'] })
  add('国微电子AI项目启动会草稿0519v1.pptx', '03_项目计划与WBS', '项目计划', { tags: ['启动会', '草稿'] })
  add('项目启动会PPT模板.pptx', '03_项目计划与WBS', '项目计划', { tags: ['模板'] })

  // === 04_交付物模板 ===
  add('Agent蓝图设计-空白模板-含编写指南.docx', '04_交付物模板', '交付物模板', { tags: ['模板', '蓝图'] })
  add('T01-业务调研模板-修改版.docx', '04_交付物模板', '交付物模板', { tags: ['T01', '模板'] })
  add('T02-Agent蓝图设计模板-修改版.docx', '04_交付物模板', '交付物模板', { tags: ['T02', '模板'] })
  add('T03-数据工程实施报告.docx', '04_交付物模板', '交付物模板', { tags: ['T03', '模板'] })
  add('T04-智能体操作手册.docx', '04_交付物模板', '交付物模板', { tags: ['T04', '模板'] })
  add('T05-UAT反馈报告.docx', '04_交付物模板', '交付物模板', { tags: ['T05', '模板'] })
  add('T06-智能体验收.docx', '04_交付物模板', '交付物模板', { tags: ['T06', '模板'] })
  add('T07-缺陷记录和跟踪文档.docx', '04_交付物模板', '交付物模板', { tags: ['T07', '模板'] })
  add('T08-需求变更登记表.docx', '04_交付物模板', '交付物模板', { tags: ['T08', '模板'] })
  add('T09-培训计划.docx', '04_交付物模板', '交付物模板', { tags: ['T09', '模板'] })
  add('T10-培训签到表.docx', '04_交付物模板', '交付物模板', { tags: ['T10', '模板'] })
  add('T11-项目日报.docx', '04_交付物模板', '交付物模板', { tags: ['T11', '模板'] })
  add('T12-项目周报.docx', '04_交付物模板', '交付物模板', { tags: ['T12', '模板'] })

  // === 05_内部管理 ===
  add('GWDZ内部任务分配表.xlsx', '05_内部管理', '内部管理', { tags: ['任务分配'] })
  add('HIAgent私有化部署问题清单.md', '05_内部管理', '内部管理', { tags: ['问题清单', '火山'] })
  add('工作记录检查表.xlsx', '05_内部管理', '内部管理', { tags: ['检查表'] })
  // 周报
  add('国微电子HiAgent智能体平台实施项目周报-W00-20260515.docx', '05_内部管理/周报', '内部管理', { tags: ['周报', 'W00'] })
  add('国微电子HiAgent智能体平台实施项目周报-W01-20260521.docx', '05_内部管理/周报', '内部管理', { tags: ['周报', 'W01'] })
  // 日报
  const dailyDates = ['20260513', '20260514', '20260515', '20260518', '20260519', '20260520', '20260521', '20260522', '20260525']
  for (const d of dailyDates) {
    add(`${d}.docx`, '05_内部管理/日报', '内部管理', { tags: ['日报'] })
  }

  // === 06_财务预算 ===
  add('国微电子预算清单0407.xlsx', '06_财务预算', '财务预算', { tags: ['预算'] })

  // === 07_方案蓝图/客户质量部 ===
  // 0426 调研表
  const kzScenarios = [
    { code: 'S01', name: '质量分析报告', sid: 's01' },
    { code: 'S02', name: '失效器件信息查询与追踪', sid: 's02' },
    { code: 'S04', name: '质量履历查询与智能总结', sid: 's04' },
    { code: 'S06', name: '失效分析知识库与语义搜索', sid: 's06' },
    { code: 'S98', name: '质量问题引发供货管控查询', sid: 's98' },
    { code: 'S100', name: '质量文档审核', sid: 's100' },
    { code: 'S101', name: '失效分析思路助手', sid: 's101' },
  ]
  for (const s of kzScenarios) {
    add(`${s.code}-${s.name}-场景调研表.md`, '07_方案蓝图/客户质量部/0426', '方案蓝图', { scenarioId: s.sid, tags: ['调研表', 'T01'] })
  }
  // 0519 统一结构蓝图
  const saMap = [
    { sa: 'SA-01', code: 'S01', name: '质量分析报告', sid: 's01' },
    { sa: 'SA-02', code: 'S02', name: '失效器件信息查询与追踪', sid: 's02' },
    { sa: 'SA-03', code: 'S04', name: '质量履历查询与智能总结', sid: 's04' },
    { sa: 'SA-04', code: 'S06', name: '失效分析知识库与语义搜索', sid: 's06' },
    { sa: 'SA-05', code: 'S98', name: '质量问题引发供货管控查询', sid: 's98' },
    { sa: 'SA-06', code: 'S100', name: '质量文档审核', sid: 's100' },
    { sa: 'SA-07', code: 'S101', name: '失效分析思路助手', sid: 's101' },
  ]
  for (const s of saMap) {
    add(`${s.sa}-${s.code}-${s.name}-统一结构.docx`, '07_方案蓝图/客户质量部/0519', '方案蓝图', { scenarioId: s.sid, tags: ['蓝图', 'v2', 'T02'] })
  }
  // 0521 蓝图（旧版，仍保留）
  for (const s of kzScenarios) {
    add(`智能体设计${s.code}-${s.name}0521.docx`, '07_方案蓝图/客户质量部/0521', '方案蓝图', { scenarioId: s.sid, tags: ['蓝图', '0521', '旧版'] })
  }
  // 0527 蓝图（待签字版）
  for (const s of kzScenarios) {
    const suffix = s.code === 'S02' ? '-0527' : '0527'
    add(`${s.code}-${s.name}${suffix}.docx`, '07_方案蓝图/客户质量部/0527', '方案蓝图', { scenarioId: s.sid, tags: ['蓝图', 'v2', '0527', '待签字', 'T02'] })
  }
  // 进度汇报 + 速查表
  add('客户质量部进度汇报_v0.5.pptx', '07_方案蓝图/客户质量部', '方案蓝图', { tags: ['进度汇报'] })
  add('客户质量部进度汇报模板.pptx', '07_方案蓝图/客户质量部', '方案蓝图', { tags: ['模板'] })
  add('客质部7Agent业务对齐速查表.md', '07_方案蓝图/客户质量部', '方案蓝图', { tags: ['速查表', '架构'] })

  // === 07_方案蓝图/测试一部 ===
  add('S37-ATE固化升级流程文档自动生成-Agent蓝图-v2.docx', '07_方案蓝图/测试一部/0520', '方案蓝图', { scenarioId: 's37', tags: ['蓝图', 'v2', 'T02'] })
  add('S38-测试知识助手-Agent蓝图设计-v2.docx', '07_方案蓝图/测试一部/0520', '方案蓝图', { scenarioId: 's38', tags: ['蓝图', 'v2', 'T02'] })
  add('S37-ATE测试报告-Agent蓝图-v2.2.docx', '07_方案蓝图/测试一部/0527', '方案蓝图', { scenarioId: 's37', tags: ['蓝图', 'v2.2', 'T02', '最新'] })
  add('S38-测试知识助手-Agent蓝图设计-v2.2.docx', '07_方案蓝图/测试一部/0527', '方案蓝图', { scenarioId: 's38', tags: ['蓝图', 'v2.2', 'T02', '最新'] })

  // === 07_方案蓝图/测试二部 ===
  add('S53-检查报告错别字优化行文流畅性-Agent蓝图设计-v2.docx', '07_方案蓝图/测试二部/0520', '方案蓝图', { scenarioId: 's53', tags: ['蓝图', 'v2', 'T02'] })
  add('S95-测试报告生成-Agent蓝图-v2.docx', '07_方案蓝图/测试二部/0520', '方案蓝图', { scenarioId: 's95', tags: ['蓝图', 'v2', 'T02'] })
  add('S99-QA问题记录检索-Agent蓝图-v2.docx', '07_方案蓝图/测试二部/0520', '方案蓝图', { scenarioId: 's99', tags: ['蓝图', 'v2', 'T02'] })
  add('S53-检查报告错别字优化行文流畅性-Agent蓝图设计-v2.2.docx', '07_方案蓝图/测试二部/0527', '方案蓝图', { scenarioId: 's53', tags: ['蓝图', 'v2.2', 'T02', '最新'] })
  add('S95-测试报告生成-Agent蓝图-v2.2.docx', '07_方案蓝图/测试二部/0527', '方案蓝图', { scenarioId: 's95', tags: ['蓝图', 'v2.2', 'T02', '最新'] })
  add('S99-QA问题记录检索-Agent蓝图-v2.2.docx', '07_方案蓝图/测试二部/0527', '方案蓝图', { scenarioId: 's99', tags: ['蓝图', 'v2.2', 'T02', '最新'] })

  return files
}
