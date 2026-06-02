# GWDZ PM 开发日志

> 供下个会话继续迭代使用。阅读本文件可以完整了解项目历史、当前状态、遗留问题和下一步方向。

---

## 一、项目概况

| 项目 | 值 |
|---|---|
| 名称 | GWDZ PM — 国微电子项目管理平台 |
| 用途 | 伊登软件 15 人团队内部使用的项目管理工具，跟踪 12 个 AI Agent 场景交付 |
| 线上地址 | https://gwdz-pm.vercel.app |
| GitHub | https://github.com/patlethal-cyber/gwdz-pm |
| 登录密码 | `gwdz2026`（环境变量 `SITE_PASSWORD`，共享密码） |
| 技术栈 | Next.js 16 + Tailwind CSS v4 + Recharts + Lucide React + Zod |
| 数据存储 | **Vercel Blob**（JSON 文档存储，db/*.json，多用户共享） |
| 文件存储 | **Vercel Blob**（488 项目文件，gwdz/ 前缀，public URL） |
| 代码规模 | 46 个源文件，~20,080 行代码 |
| 版本 | v6.0（2026-06-01） |
| 部署 | Vercel（自动从 GitHub main 分支部署） |

---

## 二、版本历史

### v1 — 初版 5 模块
5 个页面骨架 + 静态 JSON 种子数据

### v2 — 可视化 + 认证 + Issue
甘特图 + 密码保护 + Issue 跟踪

### v3 — 交互 + 持久化
localStorage + 拖拽看板 + 搜索 + 通知 + 报告

### v4 — 全面重构
29 条 UX 反馈全部重写，增强类型系统（14 interface + 9 enum）

### v5 — 文件管理 + 角色模型
- ProjectFile 实体 + Vercel Blob 文件上传/下载
- contactId（对接人 vs 负责人）
- 488 文件批量上传到 Blob
- WBS v1.5 对齐：人员分配 + 批次 + 日期

### v5.3 — 场景 Hub + Dashboard 重构
- /scenarios/[id] 场景聚合详情页
- Dashboard tab 化：甘特图 / 场景进度 / 团队负载 / 交付物管线
- 文件管理移至 Header 工具按钮

### v6.0 — 服务端持久化 + P0/P1 修复 ★ 当前版本

**数据架构迁移（localStorage → Vercel Blob API）：**
- /api/data/[collection] — GET/PUT 7 个数据集合
- 所有用户共享同一份服务器数据
- dirty flag 防止初始化回写
- saveStatus 状态跟踪（idle/saving/error）
- beforeunload 警告未保存变更
- 种子数据初始化改为设置页手动触发（永不自动推送）

**日报模板重写：**
- 对齐《项目早会指南 V1.5》4 板块：主计划 / 已办 / 待办 / 风险
- 按执行组分组，表格化展示

**通知 Badge 修复：**
- 通知铃铛：基于 lastReadTimestamp 的已读标记
- 文件按钮：移除永久计数 badge

**P0/P1 Bug 修复（10 项）：**
- genId 改用 crypto.randomUUID（防碰撞）
- DeliverableModal 可编辑负责人/日期（不仅是状态）
- 交付物关联计数动态计算（不再永远 0）
- TaskCard today 从 context 传入
- 搜索 ?open=id 深链接三页均处理
- Settings 信息更新 + 死代码清理

---

## 三、当前架构

### 数据流

```
用户浏览器 → React State → 500ms debounce → PUT /api/data/tasks → Vercel Blob db/tasks.json
                                                                        ↓
另一用户刷新 → GET /api/data/tasks → Vercel Blob → 最新数据
```

### 文件结构

```
gwdz-pm/
├── app/
│   ├── layout.tsx                    # Root layout
│   ├── login/page.tsx                # 登录页
│   ├── api/
│   │   ├── auth/route.ts             # 密码验证
│   │   ├── data/[collection]/route.ts # ★ 数据 CRUD（7 集合）
│   │   ├── upload/route.ts           # 文件上传到 Blob
│   │   └── files/route.ts            # 文件删除
│   └── (app)/                        # 需登录的页面
│       ├── layout.tsx                # Sidebar + DataProvider
│       ├── page.tsx                  # Dashboard（tab 化）
│       ├── tasks/page.tsx            # 任务（看板 + 列表）
│       ├── deliverables/page.tsx     # 交付物（分类 + 管线）
│       ├── files/page.tsx            # 文件管理（完整页）
│       ├── scenarios/[id]/page.tsx   # 场景聚合详情
│       ├── meetings/page.tsx         # 会议纪要
│       ├── issues/page.tsx           # 问题跟踪
│       ├── team/page.tsx             # 团队
│       ├── reports/page.tsx          # 报告（早会/周报/可视化）
│       └── settings/page.tsx         # 设置（导入导出 + 种子初始化）
├── components/
│   ├── layout/        Sidebar.tsx, Header.tsx
│   ├── dashboard/     StatsCards, GanttChart, ScenarioGrid, MilestoneTimeline
│   ├── tasks/         KanbanBoard, TaskCard, TaskList, TaskModal
│   ├── deliverables/  DeliverableList, DeliverablePipeline, DeliverableModal
│   ├── issues/        IssueList, IssueModal, IssueSummary
│   ├── meetings/      MeetingList, MeetingModal
│   ├── team/          MemberCard, TeamDirectory, PersonDetail
│   └── shared/        NotificationPanel, FileManagerPanel
├── lib/
│   ├── types.ts                # 全部类型（15 interface + 12 enum）
│   ├── data-context.tsx        # ★ 数据层（Blob API + CRUD + 查询，~500 行）
│   ├── seed-generator.ts       # 12 场景 + 83 交付物生成
│   ├── file-utils.ts           # 上传/删除/分类工具
│   └── data/                   # 种子 JSON + 文件/版本种子
└── scripts/
    ├── bulk-upload.mjs         # 批量文件上传脚本
    ├── fix-associations.mjs    # 文件-交付物关联修复
    ├── restore-backup.mjs      # 从 JSON 备份恢复数据
    └── upload-results.json     # 上传结果映射
```

### 实体关系

```
Scenario (12) ←── Task.scenarioId / .contactId
    ↑                 ↕ M:N
    ├── Deliverable.scenarioId    Issue.linkedTaskIds[]
    ├── Issue.scenarioId          
    ├── Meeting.scenarioId
    └── ProjectFile.scenarioId + .linkedDeliverableIds[]

Task.assigneeId ──→ TeamMember (乙方负责人)
Task.contactId ──→ TeamMember (甲方/火山对接人)
Deliverable ──→ DeliverableVersion[] (版本链)
Meeting ──→ MeetingActionItem[] → Task
```

### 环境变量

| 变量 | 状态 | 说明 |
|---|---|---|
| `SITE_PASSWORD` | ✅ 已设置 | gwdz2026 |
| `BLOB_READ_WRITE_TOKEN` | ✅ 已设置 | Vercel Blob 存储 |
| `BLOB_STORE_ID` | ✅ 已设置 | store_hW6hfp72n0WGTESQ |

---

## 四、已知问题 + 技术债

### 架构级

| # | 问题 | 影响 | 建议 |
|---|---|---|---|
| A1 | **并发写入覆盖** | 两人同时改同一集合 → last-write-wins | 迁移 Vercel Postgres + 行级更新 |
| A2 | **无用户身份** | 所有操作归属 m01，无法审计 | 登录时选"我是谁"+ 操作记录用户 ID |
| A3 | **DataContext 是 God Object** | 500 行，7 实体混在一起 | 拆分为 per-collection hooks/services |
| A4 | **数据 JSON 公开 URL** | db/*.json 用 access:public | 评估是否需改 private（当前可接受） |
| A5 | **无 Zod 校验** | API 接受任意 JSON | 在 PUT handler 加 schema 验证 |

### 功能级

| # | 问题 | 影响 |
|---|---|---|
| F1 | 实体无双向关联 | 任务↔交付物无法互查 |
| F2 | 无评论/讨论 | 上下文在微信里丢失 |
| F3 | 无批量操作 | 改 10 个任务状态要 30+ 次点击 |
| F4 | 会议文件上传是纯文本 URL | 需改成真实文件上传 |
| F5 | 场景详情页只读 | 无法从场景直接创建任务/问题 |
| F6 | 团队成员是只读种子数据 | 人员变动需改代码 |
| F7 | Activity log 上限 200 条 | 2 周后旧记录丢失 |
| F8 | 搜索 ?open= 深链接 | 已实现但需验证各页面是否正确打开 Modal |

### UX 级

| # | 问题 |
|---|---|
| U1 | 保存状态无 UI 指示器（saveStatus 已在 context 但未在 Header 展示）|
| U2 | StatsCards grid-cols-4 无响应式断点（小屏会挤压）|
| U3 | 多处日期计算不一致（getWeekEnd 两个版本）|
| U4 | MeetingModal 默认日期硬编码为 2026-06-01 |
| U5 | recharts 未 lazy load（每次加载报告页都下载全量库）|

---

## 五、下一步迭代清单（已确认）

按优先级排序：

| 优先级 | 需求 | 工作量 | 说明 |
|---|---|---|---|
| **高** | 保存状态指示器 | 1 天 | Header 展示 saving/saved/error 状态 |
| **高** | 迁移 Vercel Postgres | 3 天 | 行级更新、事务、并发安全 |
| **高** | 实体双向关联 | 2 天 | 任务↔交付物↔问题 |
| **中** | DataContext 拆分 | 2 天 | 拆为 useTasksStore / useFilesStore 等 |
| **中** | 评论/讨论功能 | 3 天 | Task/Issue/Deliverable 下的讨论串 |
| **中** | 批量操作 | 2 天 | 多选 + 批量改状态/重分配 |
| **低** | Zod API 校验 | 1 天 | PUT handler + importData 校验 |

已明确**不做**：
- ~~用户身份选择~~（当前共享密码足够）
- ~~文件私有化存储~~（public URL 可接受）

---

## 六、构建和部署

```bash
# 本地开发
cd /Users/lipei/Documents/Claude/Projects/GWDZ/gwdz-pm
npm run dev

# 构建
npm run build

# 部署（push 到 main 自动触发）
git push origin main

# 从备份恢复数据
node scripts/restore-backup.mjs

# 批量上传文件到 Blob
node scripts/bulk-upload.mjs
```

### 开发注意事项

- **Tailwind CSS v4**：不要创建 tailwind.config.ts
- **Next.js 16**：middleware.ts 已废弃（有警告但不影响）；params 是 Promise；读 node_modules/next/dist/docs/
- **数据安全**：代码部署**永不触碰**服务器数据。种子初始化只能通过设置页手动触发。
- **多用户**：Vercel Blob 是 last-write-wins，避免两人同时编辑同一数据集合。改完刷新确认。

---

*最后更新：2026-06-01 by Claude Opus 4.6*
