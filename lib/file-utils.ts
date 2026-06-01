import type { FileCategory } from '@/lib/types'

// ===== Upload / Delete =====

export async function uploadFile(
  file: File,
  pathname?: string
): Promise<{ url: string; size: number; contentType: string }> {
  const formData = new FormData()
  formData.append('file', file)
  if (pathname) {
    formData.append('pathname', pathname)
  }

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `上传失败 (${res.status})`)
  }

  const data = await res.json()
  return { url: data.url, size: data.size, contentType: data.contentType }
}

export async function deleteRemoteFile(blobUrl: string): Promise<void> {
  const res = await fetch('/api/files', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: blobUrl }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `删除失败 (${res.status})`)
  }
}

// ===== File Metadata Helpers =====

const ICON_MAP: Record<string, string> = {
  // Documents
  doc: 'FileText',
  docx: 'FileText',
  pdf: 'FileText',
  txt: 'FileText',
  rtf: 'FileText',
  md: 'FileText',
  // Spreadsheets
  xls: 'Table2',
  xlsx: 'Table2',
  csv: 'Table2',
  // Presentations
  ppt: 'Presentation',
  pptx: 'Presentation',
  // Images
  png: 'FileImage',
  jpg: 'FileImage',
  jpeg: 'FileImage',
  gif: 'FileImage',
  svg: 'FileImage',
  webp: 'FileImage',
  bmp: 'FileImage',
}

export function getFileIcon(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  return ICON_MAP[ext] || 'File'
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ===== Path → Category Mapping =====

const PATH_CATEGORY_MAP: Array<[string, FileCategory]> = [
  ['01_合同与商务', '合同与商务'],
  ['02_需求与方案', '需求与方案'],
  ['03_项目计划', '项目计划'],
  ['04_交付物模板', '交付物模板'],
  ['05_内部管理', '内部管理'],
  ['06_财务预算', '财务预算'],
  ['07_方案蓝图', '方案蓝图'],
  ['08_样本数据', '样本数据'],
  ['会议纪要', '会议纪要'],
]

export function categorizeByPath(path: string): FileCategory {
  for (const [prefix, category] of PATH_CATEGORY_MAP) {
    if (path.startsWith(prefix) || path.includes(`/${prefix}`)) {
      return category
    }
  }
  return '其他'
}
