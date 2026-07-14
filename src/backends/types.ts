export interface ConfigField {
  key: string
  label: string
  type: 'text' | 'password' | 'select'
  required: boolean
  placeholder?: string
  options?: { label: string; value: string }[]
}

export interface BackendDef {
  id: string
  label: string
  description: string
  fields: ConfigField[]
  proxy?: 'gitee' // which Go proxy endpoint this backend uses
}

export interface UploadResult {
  url: string
  filename: string
  size: number
  backend: string
  meta?: Record<string, string>  // backend-specific: sha, owner, repo, path, etc.
}

export type UploadFn = (
  file: File,
  config: Record<string, string>,
  onProgress?: (pct: number) => void,
) => Promise<UploadResult>

export interface HistoryRecord {
  id: string
  url: string
  filename: string
  size: number
  backend: string
  thumbnail: Blob
  createdAt: Date
  meta?: Record<string, string>
}
