import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UploadResult } from '../backends/types'
import { upload as doUpload } from '../backends'

export interface UploadItem {
  id: string
  file: File
  progress: number
  status: 'uploading' | 'done' | 'error'
  result?: UploadResult
  error?: string
}

let _idCounter = 0
function nextId(): string {
  return `upload_${++_idCounter}_${Date.now()}`
}

export const useUploadStore = defineStore('upload', () => {
  const items = ref<UploadItem[]>([])
  const currentBackend = ref<string>('github')

  async function addFiles(files: File[], backend: string) {
    currentBackend.value = backend
    const newItems: UploadItem[] = files.map((f) => ({
      id: nextId(),
      file: f,
      progress: 0,
      status: 'uploading' as const,
    }))
    items.value = [...newItems, ...items.value]

    for (const item of newItems) {
      function update(pct?: number) {
        const idx = items.value.findIndex((i) => i.id === item.id)
        if (idx >= 0) {
          const it = { ...items.value[idx] }
          if (pct !== undefined) it.progress = pct
          items.value.splice(idx, 1, it)
        }
      }
      try {
        const result = await doUpload(
          item.file,
          backend,
          (pct) => update(pct),
        )
        update(100)
        const idx = items.value.findIndex((i) => i.id === item.id)
        if (idx >= 0) {
          items.value[idx] = { ...items.value[idx], status: 'done', result, progress: 100 }
        }
      } catch (e: any) {
        const idx = items.value.findIndex((i) => i.id === item.id)
        if (idx >= 0) {
          items.value[idx] = { ...items.value[idx], status: 'error', error: e.message || '上传失败' }
        }
      }
    }
  }

  function removeItem(id: string) {
    items.value = items.value.filter((i) => i.id !== id)
  }

  function clearDone() {
    items.value = items.value.filter((i) => i.status !== 'done')
  }

  return { items, currentBackend, addFiles, removeItem, clearDone }
})
