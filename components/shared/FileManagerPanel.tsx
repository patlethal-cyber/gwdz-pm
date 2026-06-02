'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  X, Search, Upload, Download, ExternalLink,
  FileText, Table2, Presentation, FileImage, File,
} from 'lucide-react'
import { useData } from '@/lib/data-context'
import { uploadFile, formatFileSize } from '@/lib/file-utils'
import type { FileCategory } from '@/lib/types'

interface FileManagerPanelProps {
  isOpen: boolean
  onClose: () => void
}

const ALL_CATEGORIES: Array<{ label: string; value: FileCategory | null }> = [
  { label: '全部', value: null },
  { label: '合同与商务', value: '合同与商务' },
  { label: '需求与方案', value: '需求与方案' },
  { label: '项目计划', value: '项目计划' },
  { label: '交付物模板', value: '交付物模板' },
  { label: '内部管理', value: '内部管理' },
  { label: '财务预算', value: '财务预算' },
  { label: '方案蓝图', value: '方案蓝图' },
  { label: '样本数据', value: '样本数据' },
  { label: '其他', value: '其他' },
]

const CATEGORY_COLORS: Record<string, string> = {
  '合同与商务': 'bg-blue-50 text-blue-600',
  '需求与方案': 'bg-violet-50 text-violet-600',
  '项目计划': 'bg-green-50 text-green-600',
  '交付物模板': 'bg-amber-50 text-amber-600',
  '内部管理': 'bg-gray-100 text-gray-600',
  '财务预算': 'bg-rose-50 text-rose-600',
  '方案蓝图': 'bg-cyan-50 text-cyan-600',
  '样本数据': 'bg-orange-50 text-orange-600',
  '会议纪要': 'bg-teal-50 text-teal-600',
  '其他': 'bg-gray-50 text-gray-500',
}

function getFileTypeIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  switch (ext) {
    case 'doc':
    case 'docx':
      return <FileText size={16} className="text-blue-500" />
    case 'xls':
    case 'xlsx':
    case 'csv':
      return <Table2 size={16} className="text-green-600" />
    case 'ppt':
    case 'pptx':
      return <Presentation size={16} className="text-orange-500" />
    case 'pdf':
      return <FileText size={16} className="text-red-500" />
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'webp':
      return <FileImage size={16} className="text-purple-500" />
    default:
      return <File size={16} className="text-gray-400" />
  }
}

export default function FileManagerPanel({ isOpen, onClose }: FileManagerPanelProps) {
  const { files, addFile } = useData()

  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<FileCategory | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setSearch('')
      setActiveCategory(null)
      setShowUpload(false)
      setUploadMsg('')
    }
  }, [isOpen])

  // Filtered files
  const filtered = useMemo(() => {
    let list = files
    if (activeCategory) {
      list = list.filter(f => f.category === activeCategory)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(f =>
        f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q)
      )
    }
    return list
  }, [files, activeCategory, search])

  // Upload handler
  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    setUploading(true)
    setUploadMsg('')

    let successCount = 0
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      try {
        const result = await uploadFile(file)
        addFile({
          name: file.name,
          originalName: file.name,
          path: file.name,
          category: '其他',
          fileUrl: result.url,
          fileSize: result.size,
          fileType: result.contentType,
          uploadedBy: 'member-lipeisong',
          linkedDeliverableIds: [],
          linkedTaskIds: [],
          linkedIssueIds: [],
          tags: [],
        })
        successCount++
      } catch {
        setUploadMsg(`上传 "${file.name}" 失败`)
      }
    }

    if (successCount > 0) {
      setUploadMsg(`成功上传 ${successCount} 个文件`)
    }
    setUploading(false)
    setShowUpload(false)
  }

  // Drag & drop handlers
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragging(true)
  }
  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed top-0 right-0 h-full w-[480px] max-w-[calc(100vw-60px)] bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-gray-900">文件管理</h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {files.length} 个文件
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/files"
              onClick={onClose}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              打开完整页面 <ExternalLink size={12} />
            </Link>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-5 pt-4 pb-2 flex-shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="按文件名或路径搜索..."
              className="pl-8 pr-3 py-2 w-full text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Category pills */}
        <div className="px-5 py-2 flex-shrink-0">
          <div className="flex flex-wrap gap-1.5">
            {ALL_CATEGORIES.map(cat => (
              <button
                key={cat.label}
                onClick={() => setActiveCategory(cat.value)}
                className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                  activeCategory === cat.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* File list */}
        <div className="flex-1 overflow-y-auto px-5 py-2">
          {uploadMsg && (
            <div className={`mb-3 px-3 py-2 text-xs rounded-lg ${
              uploadMsg.includes('失败') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
            }`}>
              {uploadMsg}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">
              {search || activeCategory ? '没有匹配的文件' : '暂无文件'}
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map(file => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex-shrink-0">
                    {getFileTypeIcon(file.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-800 truncate" title={file.name}>
                      {file.name}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-400">
                        {formatFileSize(file.fileSize)}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        CATEGORY_COLORS[file.category] || CATEGORY_COLORS['其他']
                      }`}>
                        {file.category}
                      </span>
                    </div>
                  </div>
                  {file.fileUrl && (
                    <a
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-gray-300 hover:text-blue-600 hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100"
                      title="下载"
                    >
                      <Download size={14} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload zone */}
        <div className="border-t border-gray-200 px-5 py-3 flex-shrink-0">
          {showUpload ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <Upload size={24} className="mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-1">
                {uploading ? '上传中...' : '拖拽文件到此处'}
              </p>
              <p className="text-xs text-gray-400 mb-3">或点击下方按钮选择文件</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={e => handleFiles(e.target.files)}
              />
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  选择文件
                </button>
                <button
                  onClick={() => setShowUpload(false)}
                  className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowUpload(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-gray-800 transition-colors"
            >
              <Upload size={16} />
              上传文件
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.25s ease-out;
        }
      `}</style>
    </>
  )
}
