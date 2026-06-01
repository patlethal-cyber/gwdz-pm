# GWDZ PM 开发日志

> 供下个会话继续迭代使用。阅读本文件可以完整了解项目历史、当前状态、遗留问题和下一步方向。

---

## 一、项目概况

| 项目 | 值 |
|---|---|
| 名称 | GWDZ PM — 国微电子项目管理平台 |
| 用途 | 伊登软件团队内部使用的项目管理工具，跟踪 12 个 AI Agent 场景交付 |
| 线上地址 | https://gwdz-pm.vercel.app |
| GitHub | https://github.com/patlethal-cyber/gwdz-pm |
| 登录密码 | `gwdz2026`（环境变量 `SITE_PASSWORD`） |
| 技术栈 | Next.js 16 + Tailwind CSS v4 + Recharts + Lucide React + Zod |
| 数据存储 | localStorage（v4 当前）→ 计划升级 Vercel Postgres |
| 文件存储 | @vercel/blob（已安装未接通，需 BLOB_READ_WRITE_TOKEN） |
| 代码规模 | 42 个源文件，8692 行代码 |
| 部署 | Vercel（自动从 GitHub main 分支部署） |

---

## 二、版本历史

### v1（commit 62e264e）— 初版 5 模块
- 5 个页面骨架：Dashboard、Tasks、Deliverables、Meetings、Team
- 静态 JSON 种子数据，无交互，纯展示
- 用 5 Agent Workflow 并行构建

### v2（commit 01c3812）— 可视化 + 认证 + Issue
- 新增：甘特图（recharts）、任务环形图、部门进度条形图
- 新增：密码保护（middleware + cookie）、登录页
- 新增：Issue 跟踪模块（7 条种子数据）
- 新增：Settings 页面（不再 404）
- 架构：route group (app)/ 分离 login

### v3（commit ec9cdff）— 交互 + 持久化
- localStorage 持久化（DataProvider Context）
- 任务看板真拖拽（HTML5 Drag & Drop）
- "我的任务"筛选（后来在 v4 删除）
- 全局搜索（Header 跨模块关键词匹配）
- 通知面板（自动生成逾期/到期/严重提醒）
- 报告页面（日报/周报文字生成 + 复制到剪贴板）
- Issue-Task 双向链接

### v4（commit bef01ca）— 全面重构 ★ 当前版本
基于逐页 UX 审查的 29 条反馈，完整重写：

**数据层：**
- 141 项交付物（程序化生成 lib/seed-generator.ts）
- 增强类型系统（14 interface + 9 enum）
- DeliverableVersion 版本管理模型
- Issue 增强：dueDate + linkedTaskIds M:N + category
- ActivityLog 自动记录（无用户归属）
- ExternalContact（甲方+火山 13 人合并）
- DashboardStats / PersonAggregation 聚合查询

**前端：**
- Dashboard：动态时间 + 4 可点击 KPI + 全宽甘特图 + 场景进度网格
- Tasks：紧凑卡片（人→场景→标题→优先级→deadline）+ 摘要条
- Deliverables：按分类折叠视图 + 版本管理 Modal
- Meetings：纪要管理导向 + Action Item→Task 关联
- Issues：分类 + 可点击状态 + 计划解决时间
- Team：紧凑一屏 + 人员聚合 + 外部团队合并
- Reports：日报(docx 格式) + 周报(Excel 格式) + 可视化周报
- Settings：JSON 导出 + 数据重置

---

## 三、文件结构

```
gwdz-pm/
├── app/
│   ├── layout.tsx                    # Root layout（不含 Sidebar）
│   ├── login/page.tsx                # 登录页
│   ├── api/auth/route.ts             # 密码验证 API
│   └── (app)/                        # 需登录的页面（含 Sidebar + DataProvider）
│       ├── layout.tsx                # AppLayout: DataProvider + Sidebar + Suspense
│       ├── page.tsx                  # Dashboard 总览
│       ├── tasks/page.tsx            # 任务管理
│       ├── deliverables/page.tsx     # 交付物管理
│       ├── meetings/page.tsx         # 会议纪要
│       ├── issues/page.tsx           # 问题跟踪
│       ├── team/page.tsx             # 团队
│       ├── reports/page.tsx          # 报告（日报/周报/可视化）
│       └── settings/page.tsx         # 设置
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx               # 侧边栏（7 导航项 + 设置 + 用户卡）
│   │   └── Header.tsx                # 顶栏（搜索 + 通知铃铛）
│   ├── dashboard/
│   │   ├── StatsCards.tsx            # 4 个 KPI 卡片
│   │   ├── GanttChart.tsx            # 全宽甘特图（纯 CSS，非 recharts）
│   │   ├── ScenarioGrid.tsx          # 场景进度卡片网格
│   │   ├── MilestoneTimeline.tsx     # 里程碑时间线
│   │   ├── RiskAlerts.tsx            # 风险预警（旧，Dashboard 内已内联）
│   │   ├── DepartmentProgress.tsx    # 部门进度条形图（旧）
│   │   ├── TaskDistribution.tsx      # 任务环形图（旧，v4 已删除引用）
│   │   └── ActivityFeed.tsx          # 动态流（旧，v4 已删除引用）
│   ├── tasks/
│   │   ├── KanbanBoard.tsx           # 看板（4 列 + 拖拽）
│   │   ├── TaskCard.tsx              # 任务卡片
│   │   ├── TaskList.tsx              # 列表视图
│   │   └── TaskModal.tsx             # 新建/编辑弹窗
│   ├── deliverables/
│   │   ├── DeliverableList.tsx       # 分类折叠列表
│   │   ├── DeliverablePipeline.tsx   # 状态流水线
│   │   └── DeliverableModal.tsx      # 详情/版本管理弹窗
│   ├── issues/
│   │   ├── IssueList.tsx             # 问题列表
│   │   ├── IssueModal.tsx            # 新建/编辑弹窗
│   │   └── IssueSummary.tsx          # 顶部汇总条
│   ├── meetings/
│   │   ├── MeetingList.tsx           # 会议纪要列表
│   │   └── MeetingModal.tsx          # 纪要编辑弹窗
│   ├── team/
│   │   ├── MemberCard.tsx            # 紧凑成员卡片
│   │   ├── TeamDirectory.tsx         # 团队目录
│   │   └── PersonDetail.tsx          # 人员聚合详情面板
│   └── shared/
│       └── NotificationPanel.tsx     # 通知下拉面板
├── lib/
│   ├── types.ts                      # ★ 全部 TypeScript 类型定义
│   ├── data-context.tsx              # ★ 全局数据 Provider（localStorage + CRUD + 查询）
│   ├── seed-generator.ts             # ★ 141 项交付物 + 场景 + 外部团队生成器
│   ├── store.ts                      # 已废弃（空文件，保留兼容性）
│   └── data/                         # 种子 JSON 数据
│       ├── tasks.json                # 15 条任务
│       ├── deliverables.json         # 35 条（旧，已被 seed-generator 替代）
│       ├── issues.json               # 7 条问题
│       ├── meetings.json             # 4 场会议
│       ├── team.json                 # 11 名伊登团队成员
│       └── milestones.json           # 7 个里程碑 M1-M7
├── middleware.ts                      # 密码保护（检查 cookie，重定向 /login）
├── package.json
└── DEV_LOG.md                        # 本文件
```

---

## 四、数据模型（核心）

### 实体关系

```
Scenario (12) ←── Task.scenarioId
    ↑                 ↕ M:N
    ├── Deliverable.scenarioId    IssueTaskLink
    ├── Issue.scenarioId          (issue.linkedTaskIds[])
    └── Meeting.scenarioId

Task.assigneeId ──→ TeamMember
Issue.assigneeId ──→ TeamMember
Issue.reporterId ──→ TeamMember
Deliverable.ownerId ──→ TeamMember
Scenario.ownerId ──→ TeamMember

Deliverable ──→ DeliverableVersion[] (版本链)
Meeting ──→ MeetingActionItem[] (Action Items)
MeetingActionItem.taskId ──→ Task (会议→任务关联)

ActivityLog: entityType + entityId (多态关联任何实体)
ExternalContact: 独立表（甲方+火山引擎 13 人）
```

### 关键类型（lib/types.ts）

- `Task`: id, title, description, status(待办/进行中/审核中/已完成), priority(紧急/高/中/低), **category**(scenario/project/support), assigneeId, scenarioId?, dueDate, tags[]
- `Deliverable`: id, name, code(T01-T12/P01-P04), **category**(模板类型名), scenarioId?, status(5级), **currentVersion?**, ownerId, department, dueDate
- `DeliverableVersion`: id, deliverableId, versionNumber, fileName, fileUrl, fileSize, fileType, notes
- `Issue`: id, title, status(5级), severity(4级), source(4类), **category**(scenario/project), **dueDate?**(计划解决), **linkedTaskIds[]**, resolution?
- `Meeting`: id, title, date, time, duration, location, type(4类), scenarioId?, attendeeIds[], **minutes**, **fileUrl?**, actionItems[]
- `MeetingActionItem`: id, text, assigneeId, **taskId?**, dueDate?, done
- `ActivityLog`: id, entityType, entityId, action, details(JSON), timestamp (无 userId)
- `DashboardStats`: tasksInProgress, tasksOverdue, issuesSevere, projectProgress(0-100), tasksByStatus, deliverablesByStatus, issuesByStatus
- `PersonAggregation`: memberId + 关联的 tasks/deliverables/issues/scenarios

### 种子数据

| 数据 | 数量 | 来源 |
|---|---|---|
| 场景 | 12 | seed-generator.ts（含 startDate/endDate） |
| 任务 | 15 | data/tasks.json |
| 交付物 | 83 | seed-generator.ts 程序化生成 |
| 问题 | 7 | data/issues.json |
| 会议 | 4 | data/meetings.json |
| 伊登团队 | 11 | data/team.json |
| 外部团队 | 13 | seed-generator.ts |
| 里程碑 | 7 | data/milestones.json |

---

## 五、已知遗留问题

### P1（影响使用）

| # | 问题 | 详情 | 建议修复方式 |
|---|---|---|---|
| 1 | **交付物只有 83 项，非 141** | T01-T06 × 12 + T06总体 + T07-T12 + P01-P04 = 83。缺日报周报的按日/周滚动生成 + T06 额外的场景级计数 | 修正 seed-generator 的计数逻辑，将 T11/T12 改为按时间区间批量生成 |
| 2 | **数据不跨设备** | localStorage 仅存浏览器本地 | 升级 Vercel Postgres |
| 3 | **文件上传未接通** | @vercel/blob 已安装，DeliverableModal 有 UI，但未配置 BLOB_READ_WRITE_TOKEN | 用户在 Vercel Dashboard 创建 Blob Store，设置环境变量，代码中接通 /api/upload |
| 4 | **"开发中"残留** | settings 页密码修改后端未实现（前端 UI 有了） | /api/auth 需增加 PUT 方法支持密码更新 |

### P2（体验优化）

| # | 问题 | 详情 |
|---|---|---|
| 5 | 甘特图进度全部 17% | 正确反映数据（每场景 6 交付物仅 T01 已归档），但视觉上看不出差异。可考虑加任务进度维度 |
| 6 | 旧组件未清理 | ActivityFeed.tsx, DepartmentProgress.tsx, TaskDistribution.tsx, RiskAlerts.tsx 不再被导入，但文件仍存在 |
| 7 | 会议 Modal 纪要编辑 | 当前是 textarea 纯文本，计划中有富文本但未实现 |
| 8 | 人员聚合面板 | PersonDetail.tsx 已创建，需验证点击团队成员是否正常弹出 |
| 9 | 通知面板内容 | 依赖 ActivityLog，新安装时日志为空，需要操作一些数据后才有通知 |
| 10 | 周报可视化 tab | recharts 图表在 SSG 时可能有宽高警告（不影响运行时渲染） |

### P3（未来升级）

| # | 方向 | 说明 |
|---|---|---|
| 11 | Vercel Postgres | Prisma schema 已设计好（见 v4 计划文件），等用户创建 DB 后一键切换 |
| 12 | 文件上传/下载/预览 | Vercel Blob 集成 + 交付物版本管理完整链路 |
| 13 | 实体间超链接 | Dashboard KPI 点击已实现 URL 参数传递，但目标页面的 URL 参数筛选需验证 |
| 14 | 移动端适配 | 侧边栏可折叠，但甘特图和表格在小屏需更多优化 |
| 15 | 数据导入 | 从项目文件夹（01_-08_）扫描文件元数据批量导入交付物版本 |

---

## 六、数据库升级路径（Prisma + Vercel Postgres）

v4 计划文件中已完成 Prisma Schema 设计（/Users/lipei/.claude/plans/zazzy-skipping-sutherland.md §2.3）。

升级步骤：
1. `npm install prisma @prisma/client`
2. `npx prisma init` → 编辑 prisma/schema.prisma（从计划文件复制）
3. 用户在 Vercel Dashboard 创建 Postgres 数据库
4. 设置 `DATABASE_URL` 环境变量
5. `npx prisma db push`
6. 编写 prisma/seed.ts 从 seed-generator.ts 导入数据
7. 修改 data-context.tsx：API fetch 替换 localStorage
8. 编写 app/api/ 下的 17 个 CRUD route

---

## 七、构建和部署

```bash
# 本地开发
npm run dev -- -p 3456

# 构建检查
npm run build

# 部署
vercel --yes --prod

# Git
git add -A && git commit -m "描述" && git push origin main
```

### 环境变量（Vercel Dashboard 设置）

| 变量 | 值 | 说明 |
|---|---|---|
| `SITE_PASSWORD` | gwdz2026 | 登录密码 |
| `BLOB_READ_WRITE_TOKEN` | (未设置) | Vercel Blob 文件存储 |
| `DATABASE_URL` | (未设置) | Vercel Postgres 连接串 |

---

## 八、开发方法说明

本项目使用 **Claude Code + Workflow 多 Agent 并行**构建：

- v1: 5 Agent 并行构建 5 个模块页面（191 秒）
- v2: 3 Agent 并行（Issue + 可视化 + Settings）
- v3: 4 Agent 并行（Dashboard修复 + 页面改造 + 交互 + 功能）
- v4: 8 Agent 并行（Dashboard + Gantt + Tasks + Deliverables + Meetings + Issues + Team+Settings + Reports+Shared）

每次并行后由主 Agent 做合并审查 + 编译修复 + 截图验证。

### Tailwind CSS v4 注意事项
- **不要**创建 tailwind.config.ts（v4 不需要）
- 使用 `@import "tailwindcss"` 在 globals.css
- 所有标准 utility class 正常工作

### Next.js 16 注意事项
- middleware.ts 已废弃（会有警告，不影响功能）
- useSearchParams 需要 Suspense boundary（已在 (app)/layout.tsx 处理）
- App Router: 所有页面在 app/ 目录下
- 'use client' 用于交互组件

---

*最后更新：2026-06-01 by Claude Opus 4.6*
