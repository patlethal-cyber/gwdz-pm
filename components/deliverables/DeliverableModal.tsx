'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { X, ChevronRight, Upload, Info, Download, FileText, Bug, CheckSquare, CheckCircle2, AlertTriangle, Paperclip } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useData } from '@/lib/data-context'
import { uploadFile, formatFileSize } from '@/lib/file-utils'
import type { Deliverable, DeliverableStatus } from '@/lib/types'

interface DeliverableModalProps {
  isOpen: boolean
  onClose: () => void
  deliverable?: Deliverable
  onSave: (updates: Partial<Deliverable>) => void
}

const STATUS_FLOW: DeliverableStatus[] = ['待编制', '编制中', '待审核', '待签字', '已归档']

const STATUS_STYLE: Record<DeliverableStatus, { bg: string; text: string; dot: string; activeBg: string }> = {
  '待编制': { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400', activeBg: 'bg-gray-200' },
  '编制中': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', activeBg: 'bg-blue-100' },
  '待审核': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', activeBg: 'bg-amber-100' },
  '待签字': { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500', activeBg: 'bg-purple-100' },
  '已归档': { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', activeBg: 'bg-green-100' },
}

export default function DeliverableModal({ isOpen, onClose, deliverable, onSave }: DeliverableModalProps) {
  const router = useRouter()
  const { getMember, getScenario, deliverableVersions, addDeliverableVersion, tasks, issues, today, addFile, getFilesByEntity } = useData()

  const [status, setStatus] = useState<DeliverableStatus>('待编制')
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploadVersion, setUploadVersion] = useState('')
  const [uploadNotes, setUploadNotes] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadMessage, setUploadMessage] = useState('')
  const [uploadMessageType, setUploadMessageType] = useState<'success' | 'warning' | 'error'>('warning')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (deliverable) {
      setStatus(deliverable.status)
    } else {
      setStatus('待编制')
    }
    setShowUploadForm(false)
    setUploadVersion('')
    setUploadNotes('')
    setSelectedFile(null)
    setUploadMessage('')
    setUploadMessageType('warning')
    setUploading(false)
  }, [deliverable, isOpen])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  function advanceStatus() {
    const currentIdx = STATUS_FLOW.indexOf(status)
    if (currentIdx < STATUS_FLOW.length - 1) {
      setStatus(STATUS_FLOW[currentIdx + 1])
    }
  }

  function handleSave() {
    onSave({ status })
  }

  async function handleUploadSubmit() {
    if (!deliverable || !uploadVersion.trim()) return
    setUploading(true)
    setUploadMessage('')

    const fileName = selectedFile?.name || `${deliverable.code}-${uploadVersion.trim()}.docx`
    let fileUrl = ''
    let fileSize = selectedFile?.size || 0
    let fileType = selectedFile?.type || 'application/octet-stream'
    let uploadSucceeded = false

    if (selectedFile) {
      try {
        const result = await uploadFile(selectedFile, `deliverables/${deliverable.code}/${selectedFile.name}`)
        fileUrl = result.url
        fileSize = result.size
        fileType = result.contentType
        uploadSucceeded = true
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : '上传失败'
        setUploadMessage(`文件上传失败: ${errMsg}。版本已记录但无文件附件。`)
        setUploadMessageType('error')
      }
    }

    addDeliverableVersion({
      deliverableId: deliverable.id,
      versionNumber: uploadVersion.trim(),
      fileName,
      fileUrl,
      fileSize,
      fileType,
      notes: uploadNotes.trim() || undefined,
    })

    // Create a ProjectFile entry when upload succeeded
    if (uploadSucceeded && fileUrl) {
      addFile({
        name: fileName,
        originalName: fileName,
        path: `deliverables/${deliverable.code}/${fileName}`,
        category: '交付物模板',
        fileUrl,
        fileSize,
        fileType,
        uploadedBy: deliverable.ownerId,
        linkedDeliverableIds: [deliverable.id],
        linkedTaskIds: [],
        linkedIssueIds: [],
        tags: [deliverable.code, uploadVersion.trim()],
        notes: uploadNotes.trim() || undefined,
      })
    }

    if (!uploadMessage) {
      if (uploadSucceeded) {
        setUploadMessage('版本已上传')
        setUploadMessageType('success')
      } else if (!selectedFile) {
        setUploadMessage('版本已记录（未选择文件）')
        setUploadMessageType('warning')
      }
    }

    setUploadVersion('')
    setUploadNotes('')
    setSelectedFile(null)
    setUploading(false)

    setTimeout(() => setUploadMessage(''), 4000)
  }

  if (!isOpen || !deliverable) return null

  const owner = getMember(deliverable.ownerId)
  const scenario = deliverable.scenarioId ? getScenario(deliverable.scenarioId) : undefined
  const currentIdx = STATUS_FLOW.indexOf(status)
  const canAdvance = currentIdx < STATUS_FLOW.length - 1
  const nextStatus = canAdvance ? STATUS_FLOW[currentIdx + 1] : null
  const isOverdue = deliverable.status !== '已归档' && deliverable.dueDate < today

  // Version history
  const versions = deliverableVersions.filter(v => v.deliverableId === deliverable.id)

  // Related counts
  const linkedTaskCount = deliverable.linkedTaskCount ?? 0
  const linkedIssueCount = deliverable.linkedIssueCount ?? 0

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-900 truncate">{deliverable.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{deliverable.code}</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-violet-50 text-violet-600 font-medium">{deliverable.category}</span>
              {deliverable.scenarioCode && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">{deliverable.scenarioCode}</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ml-3">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Status flow */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">状态流转</label>
            <div className="flex items-center gap-1 mb-3">
              {STATUS_FLOW.map((s, idx) => {
                const style = STATUS_STYLE[s]
                const isCurrent = s === status
                const isPast = STATUS_FLOW.indexOf(s) < STATUS_FLOW.indexOf(status)
                return (
                  <div key={s} className="flex items-center">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isCurrent ? `${style.activeBg} ${style.text} ring-2 ring-offset-1 ring-current` :
                      isPast ? `${style.bg} ${style.text} opacity-60` :
                      'bg-gray-50 text-gray-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isCurrent || isPast ? style.dot : 'bg-gray-300'}`} />
                      {s}
                    </div>
                    {idx < STATUS_FLOW.length - 1 && (
                      <ChevronRight size={12} className="text-gray-300 mx-0.5 shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>
            {canAdvance && nextStatus && (
              <button
                onClick={advanceStatus}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${STATUS_STYLE[nextStatus].bg} ${STATUS_STYLE[nextStatus].text} hover:opacity-80`}
              >
                <ChevronRight size={14} />
                推进到「{nextStatus}」
              </button>
            )}
          </div>

          {/* Current version display */}
          <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-gray-50">
            <span className="text-sm text-gray-500">当前版本</span>
            <span className="text-sm font-mono font-medium text-gray-900">
              {deliverable.currentVersion || '--'}
            </span>
          </div>

          {/* Info fields */}
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
              <span className="text-sm text-gray-500">部门</span>
              <span className="text-sm font-medium text-gray-900">{deliverable.department}</span>
            </div>
            {scenario && (
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                <span className="text-sm text-gray-500">关联场景</span>
                <button
                  onClick={() => { onClose(); router.push(`/scenarios/${deliverable.scenarioId}`) }}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                >
                  {scenario.code} {scenario.name}
                </button>
              </div>
            )}
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
              <span className="text-sm text-gray-500">负责人</span>
              <div className="flex items-center gap-2">
                {owner && (
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ backgroundColor: owner.color }}
                  >
                    {owner.initials[0]}
                  </span>
                )}
                <span className="text-sm font-medium text-gray-900">{owner?.name || '--'}</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
              <span className="text-sm text-gray-500">截止日期</span>
              <span className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                {deliverable.dueDate}
                {isOverdue && <span className="ml-1.5 text-xs text-red-500">(已逾期)</span>}
              </span>
            </div>
            {deliverable.updatedAt && (
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                <span className="text-sm text-gray-500">最后更新</span>
                <span className="text-sm font-medium text-gray-900">{deliverable.updatedAt}</span>
              </div>
            )}
          </div>

          {/* Version history */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">版本历史</label>
              <button
                onClick={() => setShowUploadForm(!showUploadForm)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <Upload size={12} />
                上传新版本
              </button>
            </div>

            {versions.length > 0 ? (
              <div className="space-y-2">
                {versions.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)).map(v => (
                  <div key={v.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-gray-50">
                    <FileText size={14} className="text-gray-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-medium text-gray-900">{v.versionNumber}</span>
                        <span className="text-xs text-gray-400">{v.uploadedAt}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {v.fileName}
                        {v.fileSize > 0 && <span className="ml-1.5 text-gray-400">({formatFileSize(v.fileSize)})</span>}
                      </p>
                      {v.notes && <p className="text-xs text-gray-400 mt-0.5">{v.notes}</p>}
                    </div>
                    {v.fileUrl ? (
                      <a
                        href={v.fileUrl}
                        download={v.fileName}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        onClick={e => e.stopPropagation()}
                      >
                        <Download size={14} />
                      </a>
                    ) : (
                      <span className="text-[10px] text-gray-300 px-1.5 py-0.5 bg-gray-100 rounded">暂无文件</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 py-3 text-center">暂无版本记录</p>
            )}

            {/* Upload form */}
            {showUploadForm && (
              <div className="mt-3 p-3 border border-gray-200 rounded-lg space-y-3 bg-white">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">版本号</label>
                  <input
                    type="text"
                    value={uploadVersion}
                    onChange={e => setUploadVersion(e.target.value)}
                    placeholder="例如 v1.0"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">文件 (可选)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">备注 (可选)</label>
                  <textarea
                    value={uploadNotes}
                    onChange={e => setUploadNotes(e.target.value)}
                    placeholder="本版本的变更说明..."
                    rows={2}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleUploadSubmit}
                    disabled={!uploadVersion.trim() || uploading}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    {uploading ? '上传中...' : '提交版本'}
                  </button>
                  <button
                    onClick={() => setShowUploadForm(false)}
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    取消
                  </button>
                </div>
                {uploadMessage && (
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                    uploadMessageType === 'success' ? 'bg-green-50 border-green-200' :
                    uploadMessageType === 'error' ? 'bg-red-50 border-red-200' :
                    'bg-amber-50 border-amber-200'
                  }`}>
                    {uploadMessageType === 'success' ? (
                      <CheckCircle2 size={14} className="text-green-600 shrink-0" />
                    ) : uploadMessageType === 'error' ? (
                      <AlertTriangle size={14} className="text-red-600 shrink-0" />
                    ) : (
                      <Info size={14} className="text-amber-600 shrink-0" />
                    )}
                    <span className={`text-xs ${
                      uploadMessageType === 'success' ? 'text-green-700' :
                      uploadMessageType === 'error' ? 'text-red-700' :
                      'text-amber-700'
                    }`}>{uploadMessage}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Linked files */}
          {(() => {
            const linkedFiles = getFilesByEntity('deliverable', deliverable.id)
            if (linkedFiles.length === 0) return null
            return (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-1.5">
                    <Paperclip size={14} />
                    关联文件
                    <span className="text-xs font-normal text-gray-400 ml-1">({linkedFiles.length})</span>
                  </span>
                </label>
                <div className="space-y-1.5">
                  {linkedFiles.map(f => (
                    <div key={f.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-gray-50">
                      <FileText size={14} className="text-gray-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 truncate">{f.name}</p>
                        <p className="text-xs text-gray-400">
                          {f.fileSize > 0 && formatFileSize(f.fileSize)}
                          {f.fileSize > 0 && f.uploadedAt && ' · '}
                          {f.uploadedAt}
                        </p>
                      </div>
                      {f.fileUrl ? (
                        <a
                          href={f.fileUrl}
                          download={f.originalName}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          onClick={e => e.stopPropagation()}
                        >
                          <Download size={14} />
                        </a>
                      ) : (
                        <span className="text-[10px] text-gray-300 px-1.5 py-0.5 bg-gray-100 rounded">暂无文件</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Related links */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">关联项</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { onClose(); router.push('/tasks') }}
                className="flex items-center gap-2 py-2.5 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-left"
              >
                <CheckSquare size={14} className="text-blue-500" />
                <span className="text-sm text-gray-700">关联任务</span>
                <span className="ml-auto text-xs font-medium text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
                  {linkedTaskCount}
                </span>
              </button>
              <button
                onClick={() => { onClose(); router.push('/issues') }}
                className="flex items-center gap-2 py-2.5 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-left"
              >
                <Bug size={14} className="text-red-500" />
                <span className="text-sm text-gray-700">关联问题</span>
                <span className="ml-auto text-xs font-medium text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
                  {linkedIssueCount}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            保存更改
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slideIn 0.25s ease-out;
        }
      `}</style>
    </div>
  )
}
