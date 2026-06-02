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
| 代码规模 | 47 个源文件（+lib/schemas.ts） |
| 版本 | **v6.3（2026-06-02）** |
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

### v6.1 — 数据防护层 + 双向关联 + 批量操作 ★ 当前版本（2026-06-02）

**批次 1 — 数据防护层：**
- **保存状态指示器（U1）**：Header 四态 — 已同步 / 保存中 / 保存失败 / 数据已被他人更新（saveStatus 之前已在 context 但无 UI 消费）
- **冲突检测（乐观并发）**：GET 经 `X-Data-Version` 头返回 Blob `uploadedAt` 版本号；PUT 比对 `X-Expected-Version`，不一致返回 **409**；前端置 conflict 态提示刷新。把 last-write-wins 静默覆盖变成**可见冲突**（A1 缓解）
- **API Zod 校验（A5）**：`lib/schemas.ts` looseObject schema，PUT + importData 拦截脏数据（缺 id / 非数组 → 422）。故意宽松，避免误拒合法数据
- **修复会议默认日期（U4）**：MeetingModal 硬编码 `2026-06-01` → 动态 `today`
- 顺带：blob 内容 fetch 加 `cache: no-store`（防 CDN 读到旧 JSON）

**批次 2 — 功能（A3 拆分推迟）：**
- **实体双向关联（F1）**：Task 加 `deliverableId` 字段；任务侧「关联交付物」选择器 + 交付物侧反向「关联任务」列表，双向点击跳转（复用 `?open=` 深链接）。替换了原来基于"同场景"的假关联计数
- **批量操作（F3）**：任务列表多选 checkbox + 批量改状态/重分配（`bulkUpdateTasks`，一次 setState + 一条聚合日志）
- **A3 拆分 DataContext 推迟**到独立会话（纯重构 + 回归风险，见 spawn task）

**校验**：`npm run build` + `tsc --noEmit` + 浏览器（U1/U4/F1/F3）+ curl（401/422/409）全过

### v6.2 — UI/UX 设计审查 + 响应式迭代 ★ 当前版本（2026-06-02）

先 design-critique + accessibility-review 双审查 → 与用户对齐范围 → 实现（B 键盘 a11y 本轮不做）：
- **A 响应式 shell**：新增 `SidebarContext`；侧栏 lg 以下 off-canvas 抽屉（hamburger + 背板 + 关闭），lg 以上静态可收起；Header 降级（标题 truncate / 搜索 md+ / 保存指示器小屏图标化 / hamburger）；StatsCards / 今日聚焦 / tab / 加载骨架全加断点。移动端从"侧栏占 60% 整页挤爆"→"干净可用"
- **C 对比度 + aria**：全站 `text-gray-400 → gray-500`（201 处，满足 4.5:1）；Header/Sidebar/3 Modal 图标按钮补 aria-label
- **D 去重 + 统一 Modal**：今日聚焦 bar 删逾期/严重（已在 StatsCards），只留 距M4 + 本周会议；MeetingModal 居中弹窗 → 右侧抽屉（与任务/交付物统一范式）
- **E recharts 懒加载**：抽 `VizCharts.tsx` + `next/dynamic(ssr:false)`，图表库移出首屏 bundle
- 新文件：`components/layout/sidebar-context.tsx`、`components/reports/VizCharts.tsx`
- **校验**：build + tsc + preview 多断点（375 抽屉 / 1280 静态侧栏 / MeetingModal 抽屉）+ 无 console 报错
- **未做（a11y review 发现的 2 个 blocker）**：B = 卡片/列表行是 `<div onClick>` 键盘打不开 + Modal 无 focus trap/return。~~建议下一轮~~ → **已决定不做**（用户拍板，移出 backlog）

### v6.3 — A3 拆分 DataContext（usePersistedCollection）★ 当前版本（2026-06-02）

纯内部重构，**零用户可见变化、零行为变化**：
- 抽取通用 hook **`usePersistedCollection<T>(name, ready, setSaveStatus)`**，收敛单集合的 state + 版本号(X-Data-Version 乐观并发) + dirty + debounced serverSave + forceSave。7 个集合各调一次
- DataProvider 用 `const { items: tasks, setItems: setTasks, load, forceSave } = usePersistedCollection(...)` 解构别名 → 下方 CRUD/查询/value 几乎零改动；删掉所有 `dirty.current.add` + 旧的 dirty/versions/saveTimers ref + 7 个手写 debounce effect + 手写 init
- **保持全局单一 saveStatus**（Header 四态指示器依赖）；**useData() 接口逐字不变**（46 个调用点零改动）
- initializeSeedData 用 forceSave（'*' 强制覆写），importData 用 setItems，行为不变
- 价值：持久化机制 DRY 化，加第 8 个集合从"复制 ~10 处"变成"调一次 hook"
- **零回归验证**：build + tsc EXIT 0；浏览器读路径正常 + 写路径（拦截 PUT 确认 setTasks→debounce→serverSave 带正确 X-Expected-Version 触发、走完 保存中→已同步，**生产零写入**）；API 401/422/409；saveStatus/种子/导入行为不变

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
| A1 | **并发写入覆盖** | 🟡 **v6.1 已缓解**：乐观并发冲突检测（409 + 提示刷新）把静默覆盖变可见。彻底解决仍需行级更新 | 迁移 Vercel Postgres（缓做） |
| A2 | **无用户身份** | 所有操作归属 m01，无法审计 | 登录时选"我是谁"（已决定不做） |
| A3 | ~~**DataContext 是 God Object**~~ | ✅ **v6.3**：抽取 usePersistedCollection hook 收敛持久化机制，useData() 接口不变，零回归 | — |
| A4 | **数据 JSON 公开 URL** | db/*.json 用 access:public | 评估是否需改 private（当前可接受） |
| A5 | ~~**无 Zod 校验**~~ | ✅ **v6.1 完成**：lib/schemas.ts，PUT + importData 校验 | — |

### 功能级

| # | 问题 | 影响 |
|---|---|---|
| F1 | ~~实体无双向关联~~ | ✅ **v6.1**：任务↔交付物双向关联+跳转（Task.deliverableId） |
| F2 | ~~无评论/讨论~~ | ❌ **已砍**（用户决定：没什么用） |
| F3 | ~~无批量操作~~ | ✅ **v6.1**：任务列表多选 + 批量改状态/重分配 |
| F4 | 会议文件上传是纯文本 URL | 需改成真实文件上传（未排期） |
| F5 | 场景详情页只读 | 无法从场景直接创建任务/问题（未排期） |
| F6 | 团队成员是只读种子数据 | 人员变动需改代码（未排期） |
| F7 | Activity log 上限 200 条 | 2 周后旧记录丢失（未排期） |
| F8 | ~~搜索 ?open= 深链接~~ | ✅ **已实现并验证**（tasks/deliverables/issues 三页均处理） |

### UX 级

| # | 问题 |
|---|---|
| U1 | ~~保存状态无 UI 指示器~~ ✅ **v6.1** Header 四态指示器（已同步/保存中/失败/冲突）|
| U2 | ~~StatsCards grid-cols-4 无响应式~~ ✅ **v6.2** 全站响应式（侧栏抽屉 + grid 断点 + header 降级）|
| U3 | 日期计算不一致：getWeekEnd **复制 2 份**（page.tsx + tasks/page.tsx）+ reports/MeetingList 内联逻辑 = **4 处散落**（DEV_LOG 原写"2 个版本"已校正）|
| U4 | ~~MeetingModal 默认日期硬编码为 2026-06-01~~ ✅ **v6.1** 改为动态 today |
| U5 | ~~recharts 未 lazy load~~ ✅ **v6.2** next/dynamic 懒加载（VizCharts）|

---

## 五、下一步迭代清单

**v6.1 本期已完成**（批次1 数据防护 + 批次2 功能）：
- ✅ 保存状态指示器（U1）/ 冲突检测 / Zod 校验（A5）/ 会议日期（U4）
- ✅ 实体双向关联（F1）/ 批量操作（F3）

**下一步**：

| 优先级 | 需求 | 状态 |
|---|---|---|
| ~~中~~ | DataContext 拆分（A3） | ✅ **v6.3 完成**：usePersistedCollection hook，零回归 |
| ~~后续~~ | UI/UX 设计审查与迭代升级 | ✅ **v6.2 完成**：响应式 / 对比度 / 去重 / 统一 Modal / recharts 懒加载 |
| **高** | 迁移 Vercel Postgres（A1） | 缓做：v6.1 冲突检测已缓解 last-write-wins；真出现数据丢失或并发常态化再上 |
| **中** | 功能补强 | F4 会议真实附件 / F5 场景页可操作 / F6 团队可编辑 / F7 日志上限 / U3 日期函数统一 |

已明确**不做**：
- ~~评论/讨论功能（F2）~~（用户决定：没什么用）
- ~~用户身份选择（A2）~~（共享密码足够；注：若重启 F2 评论需先做此项）
- ~~文件私有化存储（A4）~~（public URL 可接受）
- ~~a11y 键盘可达 + Modal focus trap（B）~~（用户决定：不做）

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

# 备份服务器数据到 backups/<时间戳>/（逐集合 + restore 兼容 export.json + manifest）
node scripts/backup-data.mjs

# 上线前预检：校验备份数据是否符合 Zod schema（防上线后首次保存 422）
npx tsx scripts/validate-data.mts backups/<时间戳>

# 从备份恢复数据
node scripts/restore-backup.mjs

# 批量上传文件到 Blob
node scripts/bulk-upload.mjs
```

### 开发注意事项

- **Tailwind CSS v4**：不要创建 tailwind.config.ts
- **Next.js 16**：middleware.ts 已废弃（有警告但不影响）；params 是 Promise；读 node_modules/next/dist/docs/
- **数据安全**：代码部署**永不触碰**服务器数据。种子初始化只能通过设置页手动触发。重大数据层改动上线前先 `node scripts/backup-data.mjs` 备份 + `validate-data.mts` 预检。
- **多用户**：Vercel Blob 是 last-write-wins，避免两人同时编辑同一数据集合。改完刷新确认。

---

*最后更新：2026-06-02 by Claude Opus 4.8 — v6.3（A3 拆分 DataContext：usePersistedCollection，零回归。a11y-B 已砍出 backlog）*
