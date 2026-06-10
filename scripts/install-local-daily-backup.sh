#!/bin/bash
# 安装本机每日备份 LaunchAgent（备份双层方案的第 2 层：异地副本）
#
# 第 1 层 = Vercel Cron 每日 Blob 内快照（/api/cron/backup，防误覆写/脏写）
# 第 2 层 = 本脚本：每天 09:30（本地时间）在这台 Mac 上跑 scripts/backup-data.mjs，
#           把全部集合拉到本地 backups/<时间戳>/ —— 防 Blob store 级灾难（token 泄露/误删 store）。
#           Mac 睡眠时错过的任务会在唤醒后补跑；关机则跳过当天。
#
# 用法：bash scripts/install-local-daily-backup.sh
# 卸载：launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/com.gwdz-pm.daily-backup.plist \
#       && rm ~/Library/LaunchAgents/com.gwdz-pm.daily-backup.plist
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
# 直接用安装时的 node 绝对路径：launchd 下 /bin/bash 包装脚本会被 macOS TCC 拦在 ~/Documents 外
# （实测 Operation not permitted），node 直跑有授权。
# ⚠️ 代价：nvm 升级/切换 node 版本后旧路径失效、备份会静默停 — 升级后重跑本脚本一次即可。
NODE_BIN="$(command -v node)"
LABEL="com.gwdz-pm.daily-backup"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"

mkdir -p "$HOME/Library/LaunchAgents" "$PROJECT_DIR/backups"

cat > "$PLIST" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>$NODE_BIN</string>
    <string>$PROJECT_DIR/scripts/backup-data.mjs</string>
  </array>
  <key>WorkingDirectory</key>
  <string>$PROJECT_DIR</string>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key>
    <integer>9</integer>
    <key>Minute</key>
    <integer>30</integer>
  </dict>
  <key>StandardOutPath</key>
  <string>$PROJECT_DIR/backups/launchd-backup.log</string>
  <key>StandardErrorPath</key>
  <string>$PROJECT_DIR/backups/launchd-backup.log</string>
</dict>
</plist>
EOF

# 重新加载（已存在则先卸载）
launchctl bootout "gui/$(id -u)" "$PLIST" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"

echo "✅ 已安装并加载 LaunchAgent: $LABEL"
echo "   计划：每天 09:30（本地时间）→ $NODE_BIN scripts/backup-data.mjs"
echo "   ⚠️ nvm 升级 node 后需重跑本脚本（plist 内是绝对路径）"
echo "   日志：$PROJECT_DIR/backups/launchd-backup.log"
echo "   立即试跑：launchctl kickstart gui/\$(id -u)/$LABEL"
