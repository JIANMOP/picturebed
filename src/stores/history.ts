import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { HistoryRecord, UploadResult } from '../backends/types'
import { generateThumbnail } from '../utils/thumbnail'
import * as db from '../db/history-db'
import { v4 as uuidv4 } from 'uuid'

const HIDDEN_KEY = 'pb_hidden_ids'

export const useHistoryStore = defineStore('history', () => {
  const records = ref<HistoryRecord[]>([])
  const hiddenIds = ref<Set<string>>(new Set())
  const loaded = ref(false)

  function loadHidden() {
    try {
      const raw = localStorage.getItem(HIDDEN_KEY)
      hiddenIds.value = new Set(raw ? JSON.parse(raw) : [])
    } catch { hiddenIds.value = new Set() }
  }

  function saveHidden() {
    localStorage.setItem(HIDDEN_KEY, JSON.stringify([...hiddenIds.value]))
  }

  async function load() {
    loadHidden()
    records.value = await db.getAllRecords()
    loaded.value = true
  }

  function allRecords(): HistoryRecord[] {
    return records.value
  }

  function visibleRecords(): HistoryRecord[] {
    return records.value.filter((r) => !hiddenIds.value.has(r.id))
  }

  async function addFromResult(result: UploadResult, file: File) {
    const thumbnail = await generateThumbnail(file)
    const record: HistoryRecord = {
      id: uuidv4(),
      url: result.url,
      filename: result.filename || file.name,
      size: result.size || file.size,
      backend: result.backend,
      thumbnail,
      createdAt: new Date(),
      meta: result.meta,
    }
    await db.addRecord(record)
    records.value.unshift(record)
  }

  function softRemove(id: string) {
    hiddenIds.value.add(id)
    saveHidden()
  }

  async function hardRemove(id: string) {
    await db.deleteRecord(id)
    hiddenIds.value.delete(id)
    saveHidden()
    records.value = records.value.filter((r) => r.id !== id)
  }

  async function hardRemoveBatch(ids: string[]) {
    await db.deleteRecords(ids)
    for (const id of ids) hiddenIds.value.delete(id)
    saveHidden()
    records.value = records.value.filter((r) => !ids.includes(r.id))
  }

  async function search(query: {
    keyword?: string
    backend?: string
    dateFrom?: string
    dateTo?: string
  }) {
    records.value = await db.searchRecords(query)
  }

  return { records, loaded, load, allRecords, visibleRecords, addFromResult, softRemove, hardRemove, hardRemoveBatch, search }
})