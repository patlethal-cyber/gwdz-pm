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
| 代码规模 | 49 个源文件，~20,400 行 |
| 版本 | **v6.5（2026-06-10）** |
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

### v6.5 — 采用率第一批：参与感 + IA 重组 ★ 当前版本（2026-06-10）

UX 审计（见 ../05_内部管理/gwdz-pm-UX审计报告-20260610.md）结论：团队只在周会用 = incentive-poor，打开看不到自己、更新无自利回报。本批解决"让成员愿意打开"：

- **设备级"我是谁"视角**（`current-member-context.tsx` + `MemberPicker.tsx`）：localStorage 存 memberId，首次访问自动弹选择器（11 个乙方成员 + 全局视角）。**非 A2**——纯设备偏好，不写服务器/不参与权限/不做操作归属，单账户共享密码不变。三态：undefined 未水合 / null 全局视角 / 'm0x' 指定人
- **首屏"我的工作台"**（dashboard）：选成员后总览顶部显示「XX 的工作台」——我的进行中/逾期(>0 标红)/本周到期/我的场景，点击直达对应筛选页。全局视角自动隐藏
- **侧栏 IA 重组**：导航加「场景」「文件」一级项（原来文件藏在 Header 抽屉三跳、场景只能从总览 tab 进）；新顺序 总览/任务/场景/交付物/文件/会议/问题/团队/报告；侧栏底部身份区从写死"李培嵩"改为当前视角（点击切换）
- **删 FileManagerPanel 抽屉**：双轨文件 UI 合一，Header 文件按钮移除，统一走 /files 页
- **建 /scenarios 列表页**：复用 ScenarioGrid（加 ownerFilter/title prop），带"我负责的/全部"切换；工作台"我的场景"→ `/scenarios?mine=1`
- **任务筛选 URL 持久化 + 默认我的**：筛选状态改为 URL 派生（刷新保留/可分享/后退保留），assignee 三态（无参=默认我的 / all=明确全部 / m0x=指定）；选了身份默认只看自己 + "默认显示你的任务"提示
- **看板已完成列可折叠**（KanbanBoard）：33/76 已完成可折叠成竖向窄条（仍是 drop 目标），偏好存 localStorage
- **校验**：tsc + build EXIT 0；桌面 1440 + 移动 375 双断点走查（工作台/切视角/新导航/筛选持久化/折叠全过）；**网络面板确认全程零 PUT，生产数据未写**；console 零错误
- 未做（审计第二/三批待排）：文件上传捕获关联、列表去噪、视觉 token 化、场景页就地创建任务

### v6.4 — F7 日志归档 + 备份自动化 + 小修打包（2026-06-10）

建设期 → 运营期第一轮：保数据 + 还卫生债。

**F7 活动日志归档（审计永不丢）：**
- 客户端 cap 200 不变；**服务端在 PUT activities 覆写前 diff 新旧数据**，被裁掉的条目自动追加进 `db/activities-archive.json`（append-only，按 id 去重）。纯函数在 `lib/activity-archive.ts`（7 单测全过）
- 归档写失败 → 整个 PUT 返 500（宁可客户端重试，不静默丢审计）；导入/种子重置被替换掉的条目也会进归档（over-archive 故意为之）
- `GET /api/data/activities-archive` 只读可查（PUT 被 400 拒）；backup/validate 脚本已纳入第 8 集合
- ⚠️ 残余风险（A1 类）：两客户端在 200 条满载时同 ~200ms 内保存且都过 409 检查，归档可能互相覆盖（Blob 无 compare-and-swap）。窗口极窄，Postgres 迁移时根除

**数据备份自动化（双层）：**
- **云端层**：`/api/cron/backup` + vercel.json cron（每天 19:00 UTC = 北京 03:00），8 集合快照到同 store `backups/daily/<北京日期>/` + manifest；保留近 14 天 + 每月 1 号永久；`?dry=1` 干跑。鉴权 = Bearer `CRON_SECRET`（**已生成并配进 Vercel Production**，本地留档 `.env.cron-secret` 已 gitignore）或 gwdz-auth cookie 手动触发。防误覆写/脏写
- **本机层**：`scripts/install-local-daily-backup.sh` 装 launchd agent（`com.gwdz-pm.daily-backup`），每天 09:30 本地跑 backup-data.mjs 到 `backups/`，防 store 级灾难。**已安装并 kickstart 实测成功**。⚠️ plist 焊死 node 绝对路径（/bin/bash wrapper 会被 macOS TCC 拦在 ~/Documents 外，实测 Operation not permitted）——nvm 升级 node 后重跑安装脚本一次
- 验证方式：云端看 Blob `backups/daily/` 是否有当天目录（或 Vercel runtime logs 搜 `[cron/backup]`）；本机看 `backups/launchd-backup.log`

**小修打包：**
- **U3 日期统一**：新 `lib/date.ts`（formatYMD/parseYMD/addDays/daysBetween/getMonday/getWeekEnd/getPrevWorkday/formatDate，全部本地时区安全），page/tasks/reports/NotificationPanel 4 处散落定义收敛。**附带修复真 bug**：reports 页旧 getMonday/addDays/getYesterday 用 `toISOString().slice(0,10)`，UTC+8 下回退一天 → 周报范围曾显示周日起，现已是周一—周五（实测 2026/06/08-2026/06/12）；tasks 页 getWeekEnd 周日语义统一为"当天"（旧代码周日会跨到下周日，属修复）
- **删死代码**：MilestoneTimeline.tsx / TeamDirectory.tsx（0 引用）
- **middleware → proxy**：Next 16 新约定（文件+函数重命名），废弃警告消除，build 显示 `ƒ Proxy`。publicPaths 加 `/api/cron/backup`（**故意精确路径**，未来 cron 路由必须逐个登记防裸奔）

**多代理对抗审查后的加固（17 findings → 12 confirmed → 修 5 / 误报 1 / 文档化 6）：**
- readBlobJson 加 `Array.isArray` 守卫（blob 损坏成非数组时不再 TypeError 炸 PUT）
- beforeunload 在 saveStatus='error' 时也拦截关页（改动滞留内存时关 tab 会丢）
- cron 路由在 CRON_SECRET 缺失时 console.error 喊话（否则 Vercel Cron 永久静默 401）
- 已知未修（低危/预存在）：保存失败后不自动重试（需用户再改一次才触发，v6.3 预存在）；prune 翻页在 >1000 blob 时才需要（约 9 年后）

**校验**：build + tsc EXIT 0 · 纯函数单测 7/7 · dev 只读浏览器全流程（零 PUT 生产）· cron dry-run 8 集合计数与备份基线一致 · 401/400/307 反向测试 · launchd 端到端实测

### v6.3 — A3 拆分 DataContext（usePersistedCollection）（2026-06-02）

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
| `CRON_SECRET` | ✅ 已设置（2026-06-10，仅 Production） | 每日备份 cron 鉴权；本地留档 .env.cron-secret（gitignored，600） |

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
| F7 | ~~Activity log 上限 200 条静默丢审计~~ | ✅ **v6.4**：服务端覆写前 diff，被裁条目自动归档到 activities-archive（只读 GET 可查） |
| F8 | ~~搜索 ?open= 深链接~~ | ✅ **已实现并验证**（tasks/deliverables/issues 三页均处理） |

### UX 级

| # | 问题 |
|---|---|
| U1 | ~~保存状态无 UI 指示器~~ ✅ **v6.1** Header 四态指示器（已同步/保存中/失败/冲突）|
| U2 | ~~StatsCards grid-cols-4 无响应式~~ ✅ **v6.2** 全站响应式（侧栏抽屉 + grid 断点 + header 降级）|
| U3 | ~~日期计算 4 处散落~~ ✅ **v6.4** 统一到 lib/date.ts，并修复 reports 页 UTC+8 回退一天 bug |
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

## 七、线上状态审查（2026-06-10）

**部署 / 运行时**
- production = v6.3（commit b346ac9）READY；**近 7 天运行时日志 error/warning/fatal 为 0**

**数据（vs 2026-06-02 备份基线 `backups/2026-06-02T06-28-44/`）**
- **工具被团队真实使用中**：tasks 12→**76**、meetings 4→**14**、issues 1→**4**、versions 10→**36**、files 488→**493**、activities 51→**90**；最后写入 2026-06-05
- 数据来源说明：增长 = 团队日常使用 + **2026-06-02 晚的一次性补录**（merge-batch1/2.mjs，dry-run + --commit 设计，已执行完毕；脚本归档于 `../_归档/_scripts/`，勿重跑——内含硬编码日期）
- 无任何集合缩水；写防护在生产生效（无 cookie→307、非法 body→422）；A4 公开 URL 现状不变（已接受）

**代码**
- 49 文件 / 20,417 行；TODO/FIXME = 0；'use client' 38/49
- **死代码 ×2**（0 引用）：`components/dashboard/MilestoneTimeline.tsx`、`components/team/TeamDirectory.tsx`
- U3 日期函数 3 处定义：`app/(app)/page.tsx` + `app/(app)/tasks/page.tsx` 的 getWeekEnd ×2、`app/(app)/reports/page.tsx` 的 getMonday
- `middleware.ts` 仍在（Next 16 废弃警告，待迁 proxy）

**文档**
- README 原为 create-next-app 模板 → **2026-06-10 已重写**（项目说明/数据架构/脚本/部署安全流程）；DEV_LOG 截至 v6.3 最新

---

## 八、下阶段方向（建设期 → 运营期）

状态审查的核心结论：工具已被团队真实采用，重心从"加功能"转向"**保数据 + 还卫生债**"。

| 优先级 | 方向 | 理由 |
|---|---|---|
| ~~P1~~ | ~~F7 活动日志上限~~ | ✅ **v6.4** 服务端归档 |
| ~~P1~~ | ~~数据备份自动化~~ | ✅ **v6.4** Vercel Cron（云端日快照）+ launchd（本机异地副本）双层 |
| ~~P2~~ | ~~小修打包~~ | ✅ **v6.4** lib/date.ts 统一 + 删死代码 + middleware→proxy |
| **P3** | F4 会议附件 / F5 场景页可操作 / F6 团队可编辑 | 等团队使用反馈再挑 |
| 观察 | A1 Postgres | 触发条件 = 409 冲突频发或实际数据丢失，当前无证据；归档并发窄窗竞态也由它根除 |
| 观察 | 云端 cron 首跑确认 | 部署后次日（北京 03:00 后）查 Blob `backups/daily/` 有无当天目录 |

---

## 九、下个 session 起始提示词

```
继续迭代 GWDZ PM 内部项目管理工具。

项目：/Users/lipei/Documents/Claude/Projects/GWDZ/gwdz-pm（Next.js 16 + Tailwind v4 + Vercel Blob）
线上：https://gwdz-pm.vercel.app（密码 gwdz2026）· push main 自动部署 · 15 人生产使用中
先读 DEV_LOG.md（重点 §七 2026-06-10 状态审查 + §八 下阶段方向），不要凭记忆动手。

硬约定：
- 动数据层先 node scripts/backup-data.mjs 备份 + npx tsx scripts/validate-data.mts <备份目录> 预检
- 验证期间禁写生产 Blob（.env.local 连的就是生产）；禁止裸 PUT /api/data/*（缺 X-Expected-Version 头会真实写入）
- push main 前向我确认

本期候选（v6.4 已清完 P1/P2，以下按需挑）：
1. 部署后确认：云端 cron 首跑（北京 03:00 后查 Blob backups/daily/ 当天目录）+ 生产首次活动归档触发（activities 满 200 后查 activities-archive 非空）
2. F4 会议真实附件 / F5 场景页可创建任务问题 / F6 团队成员可编辑 —— 与我确认范围后再做
3.（如团队反馈）S38 高命中文档榜（方案见 memory/s38-operation-feature-volcano-api.md）

不做（已拍板，别再提）：F2 评论、A2 用户身份、A4 文件私有化、a11y-B 键盘可达/focus trap。
A1 Postgres 维持缓做（触发条件 = 409 频发或数据丢失；迁移时一并根除归档窄窗竞态）。
```

---

*最后更新：2026-06-10 by Claude Fable 5 — v6.4：F7 服务端归档 + 双层备份自动化（Vercel Cron 已配 CRON_SECRET + launchd 已装机）+ U3/死代码/proxy 小修 + 21-agent 对抗审查加固*
