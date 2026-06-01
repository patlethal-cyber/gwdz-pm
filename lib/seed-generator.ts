/**
 * 种子数据生成器 — 生成完整 141 项交付物 + 外部团队 + 增强场景
 * 运行方式：在 data-context.tsx 初始化时调用
 */

import type { Deliverable, ExternalContact, Scenario } from './types'

// 12 个场景的完整信息（含时间范围）
export const SCENARIOS: Scenario[] = [
  { id: 's02', code: 'S02', name: '失效器件信息查询与追踪', department: '客户质量部', type: '知识检索', batch: '一批', executionGroup: '第二执行组', blueprintVersion: 'v2 (0527)', dataReadiness: 'green', dataNote: '20文件 14.5MB，最充分', ownerId: 'm06', startDate: '2026-05-25', endDate: '2026-06-18' },
  { id: 's100', code: 'S100', name: '质量文档审核', department: '客户质量部', type: '审核校验', batch: '一批', executionGroup: '第二执行组', blueprintVersion: 'v2 (0527)', dataReadiness: 'red', dataNote: '1文件 18KB，严重缺样本', ownerId: 'm07', startDate: '2026-05-25', endDate: '2026-06-18' },
  { id: 's04', code: 'S04', name: '质量履历查询与智能总结', department: '客户质量部', type: '知识检索', batch: '一批', executionGroup: '第二执行组', blueprintVersion: 'v2 (0527)', dataReadiness: 'amber', dataNote: '2文件 426KB', ownerId: 'm02', startDate: '2026-05-29', endDate: '2026-06-18' },
  { id: 's06', code: 'S06', name: '失效分析知识库与语义搜索', department: '客户质量部', type: '知识检索', batch: '一批', executionGroup: '第二执行组', blueprintVersion: 'v2 (0527)', dataReadiness: 'red', dataNote: '卡客户首批入库清单', ownerId: 'm06', startDate: '2026-05-29', endDate: '2026-06-18' },
  { id: 's01', code: 'S01', name: '质量分析报告生成', department: '客户质量部', type: '文档生成', batch: '二批（提前）', executionGroup: '第二执行组', blueprintVersion: 'v2 (0527)', dataReadiness: 'green', dataNote: '10文件 41MB', ownerId: 'm04', startDate: '2026-06-01', endDate: '2026-06-30' },
  { id: 's101', code: 'S101', name: '失效分析思路助手', department: '客户质量部', type: '知识推理', batch: '二批', executionGroup: '第二执行组', blueprintVersion: 'v2 (0527)', dataReadiness: 'amber', dataNote: '共享库 A1/A2/A3', ownerId: 'm06', startDate: '2026-06-08', endDate: '2026-06-30' },
  { id: 's98', code: 'S98', name: '质量问题引发供货管控查询', department: '客户质量部', type: '知识推理', batch: '二批', executionGroup: '第二执行组', blueprintVersion: 'v2 (0527)', dataReadiness: 'amber', dataNote: '1文件 15KB，缺批次编码', ownerId: 'm07', startDate: '2026-06-15', endDate: '2026-06-30' },
  { id: 's37', code: '37', name: 'ATE固化升级流程文档自动生成', department: '测试一部', type: '文档生成', batch: '待定', executionGroup: '第一执行组', blueprintVersion: 'v2.2 (0527)', dataReadiness: 'green', dataNote: '已就绪', ownerId: 'm04', startDate: '2026-06-03', endDate: '2026-06-30' },
  { id: 's38', code: '38', name: '测试知识助手', department: '测试一部', type: '知识检索', batch: '待定', executionGroup: '第一执行组', blueprintVersion: 'v2.2 (0527)', dataReadiness: 'green', dataNote: '200+文档', ownerId: 'm04', startDate: '2026-06-03', endDate: '2026-06-30' },
  { id: 's53', code: '53', name: '检查报告错别字优化行文流畅性', department: '测试二部', type: '审核校验', batch: '待定', executionGroup: '第一执行组', blueprintVersion: 'v2.2 (0527)', dataReadiness: 'green', dataNote: '已就绪', ownerId: 'm04', startDate: '2026-06-03', endDate: '2026-06-30' },
  { id: 's95', code: '95', name: '测试报告AI生成', department: '测试二部', type: '文档生成', batch: '待定', executionGroup: '第一执行组', blueprintVersion: 'v2.2 (0527)', dataReadiness: 'green', dataNote: '已就绪，蓝图待评审', ownerId: 'm05', startDate: '2026-06-03', endDate: '2026-06-30' },
  { id: 's99', code: '99', name: 'QA问题记录检索', department: '测试二部', type: '知识检索', batch: '待定', executionGroup: '第一执行组', blueprintVersion: 'v2.2 (0527)', dataReadiness: 'green', dataNote: '1000+条QA记录', ownerId: 'm05', startDate: '2026-06-03', endDate: '2026-06-30' },
]

// 甲方 + 火山引擎外部团队
export const EXTERNAL_CONTACTS: ExternalContact[] = [
  { id: 'ext01', name: '江冰桂', role: '项目管理小组组长', organization: '甲方', department: '项目管理', contactFor: '项目整体统筹、验收签字' },
  { id: 'ext02', name: '朱国鹏', role: '项目管理小组副组长', organization: '甲方', department: '项目管理', contactFor: '项目协调' },
  { id: 'ext03', name: '冯悦', role: '项目经理', organization: '甲方', department: '项目管理', contactFor: '日常对接、进度跟踪' },
  { id: 'ext04', name: '林俊逸', role: 'IT资源保障', organization: '甲方', department: 'IT运维', contactFor: '服务器/网络/权限/环境' },
  { id: 'ext05', name: '龚源', role: '业务接口人', organization: '甲方', department: '客户质量部', contactFor: '客质部7场景需求对接、UAT验收' },
  { id: 'ext06', name: '陈云', role: '业务接口人', organization: '甲方', department: '客户质量部', contactFor: '客质部数据提供、蓝图签字' },
  { id: 'ext07', name: '宦承永', role: '业务接口人', organization: '甲方', department: '测试一部', contactFor: '测试一部S37/S38需求、验收' },
  { id: 'ext08', name: '李昊宸', role: '业务接口人', organization: '甲方', department: '测试一部', contactFor: '测试一部数据提供' },
  { id: 'ext09', name: '李宪全', role: '业务接口人', organization: '甲方', department: '测试二部', contactFor: '测试二部S53/S95/S99需求、验收' },
  { id: 'ext10', name: '李煜', role: '业务接口人', organization: '甲方', department: '测试二部', contactFor: '测试二部数据提供' },
  { id: 'ext11', name: '龚钰凰', role: '项目经理', organization: '火山引擎', contactFor: '平台部署协调、技术支撑' },
  { id: 'ext12', name: '符胜军', role: '技术支持组长', organization: '火山引擎', contactFor: 'HIAgent平台技术问题' },
  { id: 'ext13', name: '沈杰', role: '实施部署组长', organization: '火山引擎', contactFor: 'K8s集群部署、环境运维' },
]

// 交付物模板定义
const TEMPLATE_DEFS: { code: string; name: string; perScenario: boolean; defaultStatus: string; duePhase: string }[] = [
  { code: 'T01', name: '业务调研表', perScenario: true, defaultStatus: '已归档', duePhase: '2026-04-29' },
  { code: 'T02', name: '蓝图设计文档', perScenario: true, defaultStatus: '待签字', duePhase: '2026-05-22' },
  { code: 'T03', name: '数据工程实施报告', perScenario: true, defaultStatus: '待编制', duePhase: '2026-06-18' },
  { code: 'T04', name: '智能体操作手册', perScenario: true, defaultStatus: '待编制', duePhase: '2026-06-30' },
  { code: 'T05', name: 'UAT反馈报告', perScenario: true, defaultStatus: '待编制', duePhase: '2026-06-30' },
  { code: 'T06', name: '智能体验收确认表', perScenario: true, defaultStatus: '待编制', duePhase: '2026-07-15' },
  { code: 'T07', name: '缺陷记录和跟踪文档', perScenario: false, defaultStatus: '编制中', duePhase: '2026-08-14' },
  { code: 'T08', name: '需求变更登记表', perScenario: false, defaultStatus: '编制中', duePhase: '2026-08-14' },
  { code: 'T09', name: '培训计划', perScenario: false, defaultStatus: '待编制', duePhase: '2026-07-01' },
  { code: 'T10', name: '培训签到表', perScenario: false, defaultStatus: '待编制', duePhase: '2026-07-05' },
  { code: 'T11', name: '项目日报', perScenario: false, defaultStatus: '编制中', duePhase: '2026-08-14' },
  { code: 'T12', name: '项目周报', perScenario: false, defaultStatus: '编制中', duePhase: '2026-08-14' },
]

const PROJECT_DOCS: { code: string; name: string; status: string; version: string; dueDate: string }[] = [
  { code: 'P01', name: '项目实施总体计划书', status: '已归档', version: 'v1.2', dueDate: '2026-05-15' },
  { code: 'P02', name: '技术方案书', status: '编制中', version: 'v1.3', dueDate: '2026-06-08' },
  { code: 'P03', name: 'WBS甘特图', status: '已归档', version: 'v1.5', dueDate: '2026-05-26' },
  { code: 'P04', name: '交付物清单', status: '已归档', version: 'v1.4', dueDate: '2026-05-15' },
]

// 场景对应的负责人 + 蓝图状态覆盖
const SCENARIO_OVERRIDES: Record<string, { t02Status: string; t02Version: string; t03Status: string }> = {
  's02': { t02Status: '待签字', t02Version: 'v2', t03Status: '编制中' },
  's04': { t02Status: '待签字', t02Version: 'v2', t03Status: '编制中' },
  's06': { t02Status: '待签字', t02Version: 'v2', t03Status: '待编制' },
  's100': { t02Status: '待签字', t02Version: 'v2', t03Status: '待编制' },
  's01': { t02Status: '待签字', t02Version: 'v2', t03Status: '待编制' },
  's98': { t02Status: '待签字', t02Version: 'v2', t03Status: '待编制' },
  's101': { t02Status: '待签字', t02Version: 'v2', t03Status: '待编制' },
  's37': { t02Status: '待审核', t02Version: 'v2.2', t03Status: '待编制' },
  's38': { t02Status: '待审核', t02Version: 'v2.2', t03Status: '待编制' },
  's53': { t02Status: '待审核', t02Version: 'v2.2', t03Status: '待编制' },
  's95': { t02Status: '待审核', t02Version: 'v2.2', t03Status: '待编制' },
  's99': { t02Status: '待审核', t02Version: 'v2.2', t03Status: '待编制' },
}

export function generateDeliverables(): Deliverable[] {
  const deliverables: Deliverable[] = []
  let idx = 1

  // 场景级交付物（T01-T06 × 12 = 72）+ T06 总体 1 项
  for (const tmpl of TEMPLATE_DEFS) {
    if (tmpl.perScenario) {
      for (const sc of SCENARIOS) {
        const override = SCENARIO_OVERRIDES[sc.id]
        let status = tmpl.defaultStatus
        let version = ''

        if (tmpl.code === 'T01') {
          status = '已归档'
          version = 'v1.0'
        } else if (tmpl.code === 'T02' && override) {
          status = override.t02Status
          version = override.t02Version
        } else if (tmpl.code === 'T03' && override) {
          status = override.t03Status
        }

        deliverables.push({
          id: `d${String(idx).padStart(3, '0')}`,
          name: `${tmpl.name}-${sc.code}`,
          code: tmpl.code,
          category: tmpl.name,
          scenarioId: sc.id,
          scenarioCode: sc.code,
          status: status as Deliverable['status'],
          currentVersion: version || undefined,
          ownerId: sc.ownerId,
          department: sc.department,
          dueDate: tmpl.duePhase,
          createdAt: '2026-04-20',
          updatedAt: '2026-05-31',
        })
        idx++
      }
      // T06 额外加一个总体
      if (tmpl.code === 'T06') {
        deliverables.push({
          id: `d${String(idx).padStart(3, '0')}`,
          name: '验收确认表-总体',
          code: 'T06',
          category: tmpl.name,
          status: '待编制',
          ownerId: 'm01',
          department: '项目级',
          dueDate: '2026-07-15',
          createdAt: '2026-04-20',
          updatedAt: '2026-05-31',
        })
        idx++
      }
    } else {
      // 项目级交付物（T07-T12）
      deliverables.push({
        id: `d${String(idx).padStart(3, '0')}`,
        name: tmpl.name,
        code: tmpl.code,
        category: tmpl.name,
        status: tmpl.defaultStatus as Deliverable['status'],
        ownerId: 'm01',
        department: '项目级',
        dueDate: tmpl.duePhase,
        createdAt: '2026-04-20',
        updatedAt: '2026-05-31',
      })
      idx++
    }
  }

  // P01-P04 项目级文档
  for (const pd of PROJECT_DOCS) {
    deliverables.push({
      id: `d${String(idx).padStart(3, '0')}`,
      name: pd.name,
      code: pd.code,
      category: '项目级文档',
      status: pd.status as Deliverable['status'],
      currentVersion: pd.version,
      ownerId: 'm01',
      department: '项目级',
      dueDate: pd.dueDate,
      createdAt: '2026-04-20',
      updatedAt: '2026-05-31',
    })
    idx++
  }

  return deliverables
}

// 生成统计：按模板分组
export function getDeliverableStats(deliverables: Deliverable[]) {
  const byCategory: Record<string, Deliverable[]> = {}
  for (const d of deliverables) {
    const cat = d.category
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(d)
  }
  return byCategory
}
