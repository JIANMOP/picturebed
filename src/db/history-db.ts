import { openDB, type IDBPDatabase } from 'idb'
import type { HistoryRecord } from '../backends/types'

const DB_NAME = 'picturebed'
const STORE_NAME = 'history'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase> | null = null

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          store.createIndex('backend', 'backend')
          store.createIndex('createdAt', 'createdAt')
          store.createIndex('filename', 'filename')
        }
      },
    })
  }
  return dbPromise
}

export async function addRecord(record: HistoryRecord): Promise<void> {
  const db = await getDB()
  await db.add(STORE_NAME, {
    ...record,
    createdAt: record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt,
  })
}

export async function deleteRecord(id: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORE_NAME, id)
}

export async function deleteRecords(ids: string[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  for (const id of ids) {
    tx.store.delete(id)
  }
  await tx.done
}

export async function getAllRecords(): Promise<HistoryRecord[]> {
  const db = await getDB()
  const raw = await db.getAllFromIndex(STORE_NAME, 'createdAt')
  return raw
    .map((r: any) => ({ ...r, createdAt: new Date(r.createdAt) }))
    .reverse()
}

export async function searchRecords(query: {
  keyword?: string
  backend?: string
  dateFrom?: string
  dateTo?: string
}): Promise<HistoryRecord[]> {
  const all = await getAllRecords()
  let filtered = all

  if (query.keyword) {
    const kw = query.keyword.toLowerCase()
    filtered = filtered.filter(
      (r) =>
        r.filename.toLowerCase().includes(kw) ||
        r.url.toLowerCase().includes(kw),
    )
  }
  if (query.backend) {
    filtered = filtered.filter((r) => r.backend === query.backend)
  }
  if (query.dateFrom) {
    const from = new Date(query.dateFrom).getTime()
    filtered = filtered.filter((r) => r.createdAt.getTime() >= from)
  }
  if (query.dateTo) {
    const to = new Date(query.dateTo).getTime() + 86400000
    filtered = filtered.filter((r) => r.createdAt.getTime() <= to)
  }
  return filtered
}

export async function getStats(): Promise<{
  total: number
  totalSize: number
  byBackend: { backend: string; count: number; size: number }[]
  byDay: { date: string; count: number }[]
}> {
  const all = await getAllRecords()
  const total = all.length
  const totalSize = all.reduce((sum, r) => sum + r.size, 0)

  const backendMap = new Map<string, { count: number; size: number }>()
  const dayMap = new Map<string, number>()

  for (const r of all) {
    const be = backendMap.get(r.backend) || { count: 0, size: 0 }
    be.count++
    be.size += r.size
    backendMap.set(r.backend, be)

    const day = r.createdAt.toISOString().split('T')[0]
    dayMap.set(day, (dayMap.get(day) || 0) + 1)
  }

  return {
    total,
    totalSize,
    byBackend: Array.from(backendMap.entries())
      .map(([backend, v]) => ({ backend, ...v }))
      .sort((a, b) => b.count - a.count),
    byDay: Array.from(dayMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  }
}

export async function clearAllRecords(): Promise<void> {
  const db = await getDB()
  await db.clear(STORE_NAME)
}
