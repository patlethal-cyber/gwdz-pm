# GWDZ PM — 国微电子项目管理平台

伊登软件 15 人交付团队的内部 PM 工具，跟踪国微电子 HIAgent 项目 **12 个 AI Agent 场景**的任务、交付物、会议、问题与项目文件。

- **线上**：https://gwdz-pm.vercel.app（团队共享密码，见 Vercel 环境变量 `SITE_PASSWORD`）
- **交接/开发文档**：[DEV_LOG.md](./DEV_LOG.md)（版本史、架构、已知问题、backlog——新接手先读这个）
- **当前版本**：v6.3（2026-06-02）

## 快速开始

```bash
npm install
# .env.local 需要三个变量（从 Vercel Dashboard 拉取）：
#   SITE_PASSWORD / BLOB_READ_WRITE_TOKEN / BLOB_STORE_ID
npm run dev      # http://localhost:3000
npm run build    # 上线前必须通过
```

技术栈：**Next.js 16**（App Router + Turbopack）+ **Tailwind CSS v4** + Recharts + Lucide + Zod。

两条硬约定：
- Tailwind v4 **不要**创建 `tailwind.config.ts`
- Next.js 16 有 breaking changes，写代码前读 `node_modules/next/dist/docs/`（另见 [AGENTS.md](./AGENTS.md)）

## 数据架构（一页纸）

```
浏览器 React state ──debounce 500ms──▶ PUT /api/data/[collection] ──▶ Vercel Blob db/*.json
        ▲                                      │
        └────── GET（页面加载时全量拉取一次）◀──┘
```

- **7 个集合**（tasks/deliverables/meetings/issues/activities/versions/files）各存为 Blob 上**一个整体 JSON 数组**，写入 = 整个数组覆写
- **乐观并发**：GET 经 `X-Data-Version` 头下发版本号（= Blob uploadedAt），PUT 带 `X-Expected-Version` 比对，不匹配返回 **409** → 前端提示"数据已被他人更新，请刷新"
- **Zod 校验**（`lib/schemas.ts`）：PUT 与导入拒绝坏形状数据（422），故意宽松、只挡灾难性损坏
- 数据层核心：`lib/data-context.tsx` 的 `usePersistedCollection<T>(name)` hook（state + 版本号 + dirty + debounced 保存，7 集合复用）
- 项目文件（488+）是独立 Blob（`gwdz/` 前缀，public URL），与集合 JSON 互不影响

> ⚠️ **写入陷阱**：带合法 body 但**缺 `X-Expected-Version` 头**的 PUT 会被当作首次写入直接落库。任何脚本/调试**禁止裸 PUT** 生产接口。

## 脚本

| 脚本 | 用途 |
|---|---|
| `node scripts/backup-data.mjs` | 备份 7 集合到 `backups/<时间戳>/`（含 restore 兼容 export.json + manifest） |
| `npx tsx scripts/validate-data.mts backups/<时间戳>` | 用线上同一套 Zod schema 预检备份数据 |
| `node scripts/restore-backup.mjs` | 从 JSON 备份恢复数据到 Blob |
| `node scripts/bulk-upload.mjs` | 批量上传项目文件到 Blob |

## 部署

`git push origin main` → Vercel 自动构建部署（~25s）。

**涉及数据层（`lib/data-context.tsx`、`lib/schemas.ts`、`app/api/data/`）的改动，上线前必须：**
1. `node scripts/backup-data.mjs` 备份
2. `npx tsx scripts/validate-data.mts <备份目录>` 确认现有生产数据通过新 schema（否则上线后首次保存 422）
3. 验证期间不写生产库（`.env.local` 连的就是生产 Blob）：写路径用浏览器 fetch 拦截验证，拒绝路径用 curl 401/422/409

代码部署**永不触碰**服务器数据；种子初始化只能通过设置页手动触发。
