'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import {
  Upload, Search, List, LayoutGrid, ChevronDown, ChevronRight,
  FolderOpen, FileText, FileSpreadsheet, FileImage, File, Presentation,
  X, Download, Trash2, Tag, Link2, Plus, ExternalLink,
  CheckSquare, Bug, Calendar, Cpu,
} from 'lucide-react'
import Header from '@/components/layout/Header'
import { useData } from '@/lib/data-context'
import { uploadFile } from '@/lib/file-utils'
import type { ProjectFile, FileCategory } from '@/lib/types'

// ===== Constants =====

const ALL_CATEGORIES: FileCategory[] = [
  '合同与商务', '需求与方案', '项目计划', '交付物模板',
  '内部管理', '财务预算', '方案蓝图', '样本数据', '会议纪要', '其他',
]

const CATEGORY_ICONS: Record<FileCategory, typeof FolderOpen> = {
  '合同与商务': FileText,
  '需求与方案': FileText,
  '项目计划': Calendar,
  '交付物模板': File,
  '内部管理': CheckSquare,
  '财务预算': FileSpreadsheet,
  '方案蓝图': Cpu,
  '样本数据': FileImage,
  '会议纪要': Calendar,
  '其他': FolderOpen,
}

const CATEGORY_COLORS: Record<FileCategory, string> = {
  '合同与商务': 'text-amber-600 bg-amber-50',
  '需求与方案': 'text-blue-600 bg-blue-50',
  '项目计划': 'text-violet-600 bg-violet-50',
  '交付物模板': 'text-gray-600 bg-gray-100',
  '内部管理': 'text-teal-600 bg-teal-50',
  '财务预算': 'text-green-600 bg-green-50',
  '方案蓝图': 'text-indigo-600 bg-indigo-50',
  '样本数据': 'text-orange-600 bg-orange-50',
  '会议纪要': 'text-pink-600 bg-pink-50',
  '其他': 'text-gray-500 bg-gray-50',
}

// ===== Helpers =====

function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '--'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(fileType: string) {
  if (fileType.includes('word') || fileType.includes('document')) return FileText
  if (fileType.includes('sheet') || fileType.includes('excel')) return FileSpreadsheet
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) return Presentation
  if (fileType.includes('image')) return FileImage
  if (fileType.includes('pdf')) return FileText
  if (fileType.includes('markdown')) return FileText
  return File
}

function getFileIconColor(fileType: string): string {
  if (fileType.includes('word') || fileType.includes('document')) return 'text-blue-500'
  if (fileType.includes('sheet') || fileType.includes('excel')) return 'text-green-500'
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) return 'text-orange-500'
  if (fileType.includes('image')) return 'text-purple-500'
  if (fileType.includes('pdf')) return 'text-red-500'
  if (fileType.includes('markdown')) return 'text-gray-600'
  return 'text-gray-400'
}

function categorizeByPath(path: string): FileCategory {
  if (path.startsWith('01')) return '合同与商务'
  if (path.startsWith('02')) return '需求与方案'
  if (path.startsWith('03')) return '项目计划'
  if (path.startsWith('04')) return '交付物模板'
  if (path.startsWith('05')) return '内部管理'
  if (path.startsWith('06')) return '财务预算'
  if (path.startsWith('07')) return '方案蓝图'
  if (path.startsWith('08')) return '样本数据'
  return '其他'
}

// ===== Sub-components =====

function FileTree({
  categories,
  selectedCategory,
  onSelect,
}: {
  categories: Record<string, ProjectFile[]>
  selectedCategory: FileCategory | null
  onSelect: (cat: FileCategory | null) => void
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    ALL_CATEGORIES.forEach(c => { init[c] = true })
    return init
  })

  const totalCount = Object.values(categories).reduce((s, arr) => s + arr.length, 0)

  function toggleExpand(cat: string) {
    setExpanded(prev => ({ ...prev, [cat]: !prev[cat] }))
  }

  // Group sub-paths within each category
  function getSubPaths(files: ProjectFile[]): Record<string, number> {
    const paths: Record<string, number> = {}
    for (const f of files) {
      const parts = f.path.split('/')
      if (parts.length > 1) {
        const sub = parts.slice(1).join('/')
        paths[sub] = (paths[sub] || 0) + 1
      }
    }
    return paths
  }

  return (
    <div className="w-[250px] shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">文件分类</h3>
      </div>

      {/* All files */}
      <button
        onClick={() => onSelect(null)}
        className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
          selectedCategory === null
            ? 'bg-blue-50 text-blue-700 font-medium'
            : 'text-gray-700 hover:bg-gray-50'
        }`}
      >
        <FolderOpen size={16} className="shrink-0" />
        <span className="flex-1 text-left">全部文件</span>
        <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{totalCount}</span>
      </button>

      <div className="py-1">
        {ALL_CATEGORIES.map(cat => {
          const files = categories[cat] || []
          if (files.length === 0) return null
          const CatIcon = CATEGORY_ICONS[cat]
          const isSelected = selectedCategory === cat
          const isExpanded = expanded[cat]
          const subPaths = getSubPaths(files)
          const hasSubPaths = Object.keys(subPaths).length > 1

          return (
            <div key={cat}>
              <div className="flex items-center">
                {hasSubPaths && (
                  <button
                    onClick={() => toggleExpand(cat)}
                    className="pl-2 pr-0 py-2.5 text-gray-400 hover:text-gray-600"
                  >
                    <ChevronRight
                      size={12}
                      className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    />
                  </button>
                )}
                <button
                  onClick={() => onSelect(isSelected ? null : cat)}
                  className={`flex-1 flex items-center gap-2 py-2.5 text-sm transition-colors ${
                    hasSubPaths ? 'pr-4' : 'px-4'
                  } ${!hasSubPaths ? 'pl-4' : 'pl-1'} ${
                    isSelected
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <CatIcon size={15} className="shrink-0" />
                  <span className="flex-1 text-left truncate">{cat}</span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{files.length}</span>
                </button>
              </div>

              {hasSubPaths && isExpanded && (
                <div className="ml-7 border-l border-gray-100">
                  {Object.entries(subPaths).sort(([a], [b]) => a.localeCompare(b)).map(([sub, count]) => (
                    <div
                      key={sub}
                      className="flex items-center gap-2 pl-3 pr-4 py-1.5 text-xs text-gray-500"
                    >
                      <span className="truncate flex-1">{sub}</span>
                      <span className="text-gray-300">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FileRow({
  file,
  onSelect,
  getMember,
  getScenario,
  deliverables,
}: {
  file: ProjectFile
  onSelect: (f: ProjectFile) => void
  getMember: (id: string) => { name: string; initials: string; color: string } | undefined
  getScenario: (id: string) => { code: string; name: string } | undefined
  deliverables: { id: string; name: string; code: string }[]
}) {
  const Icon = getFileIcon(file.fileType)
  const iconColor = getFileIconColor(file.fileType)
  const uploader = getMember(file.uploadedBy)
  const scenario = file.scenarioId ? getScenario(file.scenarioId) : undefined
  const linkedDeliverables = file.linkedDeliverableIds
    .map(did => deliverables.find(d => d.id === did))
    .filter(Boolean)

  return (
    <button
      onClick={() => onSelect(file)}
      className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-sm transition-all text-left group"
    >
      {/* Icon */}
      <div className={`w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-gray-100 transition-colors`}>
        <Icon size={18} className={iconColor} />
      </div>

      {/* Name + path */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">{file.name}</div>
        <div className="text-xs text-gray-400 truncate mt-0.5">{file.path}/{file.originalName}</div>
      </div>

      {/* Entity chips */}
      <div className="hidden lg:flex items-center gap-1.5 shrink-0">
        {scenario && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-medium">
            <Cpu size={10} />
            {scenario.code}
          </span>
        )}
        {linkedDeliverables.map(d => d && (
          <span key={d.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 text-[10px] font-medium">
            <FileText size={10} />
            {d.code}
          </span>
        ))}
      </div>

      {/* Tags */}
      <div className="hidden xl:flex items-center gap-1 shrink-0 max-w-[180px] overflow-hidden">
        {file.tags.slice(0, 3).map(tag => (
          <span key={tag} className="px-1.5 py-0.5 rounded bg-gray-100 text-[10px] text-gray-500 font-medium whitespace-nowrap">
            {tag}
          </span>
        ))}
        {file.tags.length > 3 && (
          <span className="text-[10px] text-gray-400">+{file.tags.length - 3}</span>
        )}
      </div>

      {/* Size */}
      <div className="w-16 text-right shrink-0">
        <span className="text-xs text-gray-400">{formatFileSize(file.fileSize)}</span>
      </div>

      {/* Date */}
      <div className="w-24 text-right shrink-0">
        <span className="text-xs text-gray-400">{file.uploadedAt}</span>
      </div>

      {/* Upload status */}
      <div className="w-8 shrink-0 flex justify-center">
        {file.fileUrl ? (
          <div className="w-2 h-2 rounded-full bg-green-400" title="已上传" />
        ) : (
          <div className="w-2 h-2 rounded-full bg-gray-300" title="未上传" />
        )}
      </div>
    </button>
  )
}

function FileGridCard({
  file,
  onSelect,
  getScenario,
}: {
  file: ProjectFile
  onSelect: (f: ProjectFile) => void
  getScenario: (id: string) => { code: string; name: string } | undefined
}) {
  const Icon = getFileIcon(file.fileType)
  const iconColor = getFileIconColor(file.fileType)
  const scenario = file.scenarioId ? getScenario(file.scenarioId) : undefined
  const catColor = CATEGORY_COLORS[file.category] || CATEGORY_COLORS['其他']

  return (
    <button
      onClick={() => onSelect(file)}
      className="flex flex-col p-4 bg-white border border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-sm transition-all text-left group"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-gray-100 transition-colors">
          <Icon size={20} className={iconColor} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 line-clamp-2">{file.name}</div>
          <div className="text-[11px] text-gray-400 truncate mt-0.5">{file.originalName}</div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap mt-auto">
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${catColor}`}>
          {file.category}
        </span>
        {scenario && (
          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-medium">
            {scenario.code}
          </span>
        )}
        {file.tags.slice(0, 2).map(tag => (
          <span key={tag} className="px-1.5 py-0.5 rounded bg-gray-100 text-[10px] text-gray-500">
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
        <span className="text-[11px] text-gray-400">{file.uploadedAt}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-gray-400">{formatFileSize(file.fileSize)}</span>
          {file.fileUrl ? (
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
          )}
        </div>
      </div>
    </button>
  )
}

function FileDetailPanel({
  file,
  onClose,
  onUpdate,
  onDelete,
  getMember,
  getScenario,
  deliverables,
  tasks,
  issues,
}: {
  file: ProjectFile
  onClose: () => void
  onUpdate: (id: string, u: Partial<ProjectFile>) => void
  onDelete: (id: string) => void
  getMember: (id: string) => { name: string; initials: string; color: string } | undefined
  getScenario: (id: string) => { code: string; name: string } | undefined
  deliverables: { id: string; name: string; code: string }[]
  tasks: { id: string; title: string }[]
  issues: { id: string; title: string }[]
}) {
  const [notes, setNotes] = useState(file.notes || '')
  const [tagInput, setTagInput] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    setNotes(file.notes || '')
    setShowDeleteConfirm(false)
    setTagInput('')
  }, [file.id, file.notes])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const Icon = getFileIcon(file.fileType)
  const iconColor = getFileIconColor(file.fileType)
  const uploader = getMember(file.uploadedBy)
  const scenario = file.scenarioId ? getScenario(file.scenarioId) : undefined
  const linkedDeliverables = file.linkedDeliverableIds
    .map(did => deliverables.find(d => d.id === did))
    .filter(Boolean)
  const linkedTasks = file.linkedTaskIds
    .map(tid => tasks.find(t => t.id === tid))
    .filter(Boolean)
  const linkedIssues = file.linkedIssueIds
    .map(iid => issues.find(i => i.id === iid))
    .filter(Boolean)

  function handleSaveNotes() {
    onUpdate(file.id, { notes: notes.trim() || undefined })
  }

  function handleAddTag() {
    const tag = tagInput.trim()
    if (tag && !file.tags.includes(tag)) {
      onUpdate(file.id, { tags: [...file.tags, tag] })
    }
    setTagInput('')
  }

  function handleRemoveTag(tag: string) {
    onUpdate(file.id, { tags: file.tags.filter(t => t !== tag) })
  }

  function handleDelete() {
    onDelete(file.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col" style={{ animation: 'slideIn 0.25s ease-out' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
              <Icon size={18} className={iconColor} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-gray-900 truncate">{file.name}</h2>
              <p className="text-xs text-gray-400 truncate">{file.originalName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ml-3"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Category badge */}
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${CATEGORY_COLORS[file.category]}`}>
            {(() => { const C = CATEGORY_ICONS[file.category]; return <C size={13} /> })()}
            {file.category}
          </div>

          {/* Info fields */}
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
              <span className="text-sm text-gray-500">路径</span>
              <span className="text-sm font-mono text-gray-700 truncate ml-4">{file.path}</span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
              <span className="text-sm text-gray-500">文件类型</span>
              <span className="text-sm text-gray-700">{file.fileType.split('/').pop()}</span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
              <span className="text-sm text-gray-500">文件大小</span>
              <span className="text-sm text-gray-700">{formatFileSize(file.fileSize)}</span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
              <span className="text-sm text-gray-500">上传日期</span>
              <span className="text-sm text-gray-700">{file.uploadedAt}</span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
              <span className="text-sm text-gray-500">上传人</span>
              <div className="flex items-center gap-2">
                {uploader && (
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ backgroundColor: uploader.color }}
                  >
                    {uploader.initials[0]}
                  </span>
                )}
                <span className="text-sm text-gray-700">{uploader?.name || '--'}</span>
              </div>
            </div>
            {scenario && (
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                <span className="text-sm text-gray-500">关联场景</span>
                <span className="text-sm font-medium text-blue-600 flex items-center gap-1">
                  <Cpu size={12} />
                  {scenario.code} {scenario.name}
                </span>
              </div>
            )}
          </div>

          {/* Upload status / download */}
          <div className="p-3 rounded-lg border border-gray-200">
            {file.fileUrl ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-sm text-green-700 font-medium">已上传到 Blob</span>
                </div>
                <a
                  href={file.fileUrl}
                  download={file.originalName}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  onClick={e => e.stopPropagation()}
                >
                  <Download size={14} />
                  下载
                </a>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-300" />
                  <span className="text-sm text-gray-500">尚未上传文件</span>
                </div>
                <span className="text-xs text-gray-400">仅元数据</span>
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">标签</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {file.tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 text-xs font-medium text-gray-600 group/tag">
                  <Tag size={10} />
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover/tag:opacity-100"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
              {file.tags.length === 0 && (
                <span className="text-xs text-gray-400">暂无标签</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag() } }}
                placeholder="添加标签..."
                className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-30"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Linked entities */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">关联项</label>
            <div className="space-y-1.5">
              {linkedDeliverables.map(d => d && (
                <div key={d.id} className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-violet-50 text-sm">
                  <FileText size={13} className="text-violet-500 shrink-0" />
                  <span className="font-mono text-xs text-violet-600">{d.code}</span>
                  <span className="text-violet-700 truncate">{d.name}</span>
                </div>
              ))}
              {linkedTasks.map(t => t && (
                <div key={t.id} className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-blue-50 text-sm">
                  <CheckSquare size={13} className="text-blue-500 shrink-0" />
                  <span className="text-blue-700 truncate">{t.title}</span>
                </div>
              ))}
              {linkedIssues.map(i => i && (
                <div key={i.id} className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-red-50 text-sm">
                  <Bug size={13} className="text-red-500 shrink-0" />
                  <span className="text-red-700 truncate">{i.title}</span>
                </div>
              ))}
              {linkedDeliverables.length === 0 && linkedTasks.length === 0 && linkedIssues.length === 0 && (
                <p className="text-xs text-gray-400 py-2 text-center">暂无关联项</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">备注</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="添加备注..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            {notes !== (file.notes || '') && (
              <button
                onClick={handleSaveNotes}
                className="mt-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                保存备注
              </button>
            )}
          </div>

          {/* Delete zone */}
          <div className="pt-2 border-t border-gray-100">
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Trash2 size={14} />
                删除文件记录
              </button>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <span className="text-sm text-red-700 flex-1">确认删除此文件记录?</span>
                <button
                  onClick={handleDelete}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  确认
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  取消
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            关闭
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}

type UploadFileStatus = 'pending' | 'uploading' | 'done' | 'error'

interface UploadFileEntry {
  file: File
  status: UploadFileStatus
  error?: string
}

function UploadZone({
  isOpen,
  onClose,
  onFileUploaded,
}: {
  isOpen: boolean
  onClose: () => void
  onFileUploaded: (file: File, category: FileCategory, url: string, size: number) => void
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [entries, setEntries] = useState<UploadFileEntry[]>([])
  const [uploading, setUploading] = useState(false)
  const [category, setCategory] = useState<FileCategory>('其他')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) {
      setEntries([])
      setUploading(false)
      setCategory('其他')
    }
  }, [isOpen])

  const completedCount = entries.filter(e => e.status === 'done').length
  const errorCount = entries.filter(e => e.status === 'error').length
  const progress = entries.length > 0 ? Math.round(((completedCount + errorCount) / entries.length) * 100) : 0

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    setEntries(prev => [...prev, ...droppedFiles.map(f => ({ file: f, status: 'pending' as UploadFileStatus }))])
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setEntries(prev => [...prev, ...newFiles.map(f => ({ file: f, status: 'pending' as UploadFileStatus }))])
    }
  }

  function removeFile(idx: number) {
    setEntries(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleUpload() {
    if (entries.length === 0) return
    setUploading(true)

    // Upload each file sequentially via the real API
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]

      // Mark as uploading
      setEntries(prev => prev.map((e, j) => j === i ? { ...e, status: 'uploading' } : e))

      const pathname = `gwdz/${category}/${entry.file.name}`

      try {
        const result = await uploadFile(entry.file, pathname)

        // Mark as done
        setEntries(prev => prev.map((e, j) => j === i ? { ...e, status: 'done' } : e))

        // Create the file record with the real URL
        onFileUploaded(entry.file, category, result.url, result.size)
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : '上传失败'

        // Mark as error
        setEntries(prev => prev.map((e, j) => j === i ? { ...e, status: 'error', error: errMsg } : e))

        // Still create the record but with empty fileUrl
        onFileUploaded(entry.file, category, '', entry.file.size)
      }
    }

    // Brief pause so user can see the final state
    await new Promise(r => setTimeout(r, 600))

    setUploading(false)
    setEntries([])
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={uploading ? undefined : onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-bold text-gray-900">上传文件</h2>
          <button
            onClick={onClose}
            disabled={uploading}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {/* Category selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">文件分类</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as FileCategory)}
              disabled={uploading}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {ALL_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              uploading ? 'cursor-default opacity-60' : 'cursor-pointer'
            } ${
              isDragging
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Upload size={32} className={`mx-auto mb-3 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
            <p className="text-sm font-medium text-gray-700">
              {isDragging ? '松开以添加文件' : '拖拽文件到此处，或点击选择'}
            </p>
            <p className="text-xs text-gray-400 mt-1">支持 Word / Excel / PDF / PPT / 图片等格式</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Selected files with per-file status */}
          {entries.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {uploading
                  ? `上传中 ${completedCount}/${entries.length}${errorCount > 0 ? ` (${errorCount} 失败)` : ''}`
                  : `已选择 ${entries.length} 个文件`
                }
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1.5">
                {entries.map((entry, idx) => {
                  const FIcon = getFileIcon(entry.file.type)
                  return (
                    <div key={`${entry.file.name}-${idx}`} className="flex items-center gap-3 py-2 px-3 bg-gray-50 rounded-lg">
                      <FIcon size={14} className="text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-700 flex-1 truncate">{entry.file.name}</span>
                      <span className="text-xs text-gray-400">{formatFileSize(entry.file.size)}</span>
                      {entry.status === 'pending' && !uploading && (
                        <button
                          onClick={() => removeFile(idx)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      )}
                      {entry.status === 'pending' && uploading && (
                        <span className="text-xs text-gray-400">等待中</span>
                      )}
                      {entry.status === 'uploading' && (
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      )}
                      {entry.status === 'done' && (
                        <div className="w-2 h-2 rounded-full bg-green-400" title="上传成功" />
                      )}
                      {entry.status === 'error' && (
                        <span className="text-xs text-red-500" title={entry.error}>失败</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Overall progress bar */}
          {uploading && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">上传进度</span>
                <span className="text-xs font-medium text-blue-600">{progress}%</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-30"
          >
            取消
          </button>
          <button
            onClick={handleUpload}
            disabled={entries.length === 0 || uploading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {uploading ? '上传中...' : `上传 ${entries.length > 0 ? `(${entries.length})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ===== Main Page =====

export default function FilesPage() {
  const {
    files, addFile, updateFile, deleteFile,
    getFilesByCategory, getFilesByEntity,
    getMember, getScenario,
    deliverables, tasks, issues,
    ready,
  } = useData()

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<FileCategory | null>(null)
  const [categoryFilter, setCategoryFilter] = useState('全部')
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  const categorized = useMemo(() => {
    if (!ready) return {} as Record<string, ProjectFile[]>
    return getFilesByCategory()
  }, [getFilesByCategory, ready])

  // Filter + search
  const filteredFiles = useMemo(() => {
    let result = files

    // Category filter (from sidebar or dropdown)
    const activeCat = selectedCategory || (categoryFilter !== '全部' ? categoryFilter as FileCategory : null)
    if (activeCat) {
      result = result.filter(f => f.category === activeCat)
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.originalName.toLowerCase().includes(q) ||
        f.path.toLowerCase().includes(q) ||
        f.tags.some(t => t.toLowerCase().includes(q))
      )
    }

    // Sort by uploadedAt desc
    return [...result].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
  }, [files, selectedCategory, categoryFilter, searchQuery])

  const uploadedCount = useMemo(() => files.filter(f => f.fileUrl).length, [files])

  // Drag over entire page
  function handlePageDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(true)
  }

  function handlePageDragLeave(e: React.DragEvent) {
    // Only set false if leaving the page container
    if (e.currentTarget === e.target) {
      setIsDragOver(false)
    }
  }

  function handlePageDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files.length > 0) {
      setShowUpload(true)
    }
  }

  const handleFileUploaded = useCallback((file: File, category: FileCategory, url: string, size: number) => {
    addFile({
      name: file.name.replace(/\.[^.]+$/, ''),
      originalName: file.name,
      path: category,
      category: category,
      fileUrl: url,
      fileSize: size || file.size,
      fileType: file.type || 'application/octet-stream',
      uploadedBy: 'm01',
      linkedDeliverableIds: [],
      linkedTaskIds: [],
      linkedIssueIds: [],
      tags: [],
    })
  }, [addFile])

  function handleSelectCategory(cat: FileCategory | null) {
    setSelectedCategory(cat)
    setCategoryFilter('全部')
  }

  if (!ready) {
    return (
      <div className="flex flex-col h-screen">
        <div className="h-16 border-b border-gray-200 bg-white" />
        <div className="flex-1 p-6 space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
              <div className="space-y-2">
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const CATEGORY_OPTIONS = ['全部', ...ALL_CATEGORIES] as const

  const headerActions = (
    <div className="flex items-center gap-2">
      {/* Upload button */}
      <button
        onClick={() => setShowUpload(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
      >
        <Upload size={14} />
        上传
      </button>

      {/* View toggle */}
      <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
        <button
          onClick={() => setViewMode('list')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-all ${
            viewMode === 'list'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <List size={14} />
        </button>
        <button
          onClick={() => setViewMode('grid')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-all ${
            viewMode === 'grid'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <LayoutGrid size={14} />
        </button>
      </div>

      {/* Category filter dropdown (mobile/alternative to sidebar) */}
      <div className="relative lg:hidden">
        <select
          value={selectedCategory || categoryFilter}
          onChange={e => {
            const v = e.target.value
            if (v === '全部') {
              setSelectedCategory(null)
              setCategoryFilter('全部')
            } else {
              setSelectedCategory(v as FileCategory)
            }
          }}
          className="appearance-none pl-3 pr-8 py-1.5 text-sm bg-white border border-gray-200 rounded-lg text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
        >
          {CATEGORY_OPTIONS.map(opt => (
            <option key={opt} value={opt}>
              {opt === '全部' ? '分类: 全部' : opt}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="搜索文件..."
          className="pl-8 pr-4 py-1.5 w-48 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div
      className="flex flex-col h-screen"
      onDragOver={handlePageDragOver}
      onDragLeave={handlePageDragLeave}
      onDrop={handlePageDrop}
    >
      <Header
        title="文件管理"
        subtitle={`共 ${files.length} 个文件, ${uploadedCount} 个已上传`}
        actions={headerActions}
      />

      {/* Active filter indicator */}
      {(selectedCategory || searchQuery) && (
        <div className="flex items-center gap-2 px-6 py-2 bg-white border-b border-gray-100">
          <span className="text-xs text-gray-400">筛选:</span>
          {selectedCategory && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium">
              {selectedCategory}
              <button onClick={() => setSelectedCategory(null)} className="ml-1 text-blue-400 hover:text-blue-600">
                <X size={10} />
              </button>
            </span>
          )}
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium">
              &quot;{searchQuery}&quot;
              <button onClick={() => setSearchQuery('')} className="ml-1 text-gray-400 hover:text-gray-600">
                <X size={10} />
              </button>
            </span>
          )}
          <span className="text-xs text-gray-400 ml-auto">{filteredFiles.length} 个结果</span>
        </div>
      )}

      {/* Body: sidebar + main */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar tree (desktop only) */}
        <div className="hidden lg:block">
          <FileTree
            categories={categorized}
            selectedCategory={selectedCategory}
            onSelect={handleSelectCategory}
          />
        </div>

        {/* Main file area */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <FolderOpen size={48} className="text-gray-300 mb-4" />
              <h3 className="text-sm font-medium text-gray-500 mb-1">没有找到文件</h3>
              <p className="text-xs text-gray-400">
                {searchQuery ? '尝试调整搜索关键词' : '点击上传按钮添加文件'}
              </p>
            </div>
          ) : viewMode === 'list' ? (
            <div className="space-y-1.5">
              {/* List header */}
              <div className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                <div className="w-9" />
                <div className="flex-1">文件名</div>
                <div className="hidden lg:block w-32">关联</div>
                <div className="hidden xl:block w-[180px]">标签</div>
                <div className="w-16 text-right">大小</div>
                <div className="w-24 text-right">日期</div>
                <div className="w-8 text-center">状态</div>
              </div>
              {filteredFiles.map(file => (
                <FileRow
                  key={file.id}
                  file={file}
                  onSelect={setSelectedFile}
                  getMember={getMember as (id: string) => { name: string; initials: string; color: string } | undefined}
                  getScenario={getScenario as (id: string) => { code: string; name: string } | undefined}
                  deliverables={deliverables}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
              {filteredFiles.map(file => (
                <FileGridCard
                  key={file.id}
                  file={file}
                  onSelect={setSelectedFile}
                  getScenario={getScenario as (id: string) => { code: string; name: string } | undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Drag overlay */}
      {isDragOver && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-blue-500/10 border-2 border-dashed border-blue-400 pointer-events-none">
          <div className="bg-white rounded-2xl shadow-2xl px-8 py-6 text-center">
            <Upload size={40} className="mx-auto mb-3 text-blue-500" />
            <p className="text-sm font-medium text-gray-900">松开以上传文件</p>
          </div>
        </div>
      )}

      {/* Upload modal */}
      <UploadZone
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onFileUploaded={handleFileUploaded}
      />

      {/* Detail panel */}
      {selectedFile && (
        <FileDetailPanel
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
          onUpdate={updateFile}
          onDelete={deleteFile}
          getMember={getMember as (id: string) => { name: string; initials: string; color: string } | undefined}
          getScenario={getScenario as (id: string) => { code: string; name: string } | undefined}
          deliverables={deliverables}
          tasks={tasks}
          issues={issues}
        />
      )}
    </div>
  )
}
