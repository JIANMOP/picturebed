<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useHistoryStore } from '../../stores/history'
import { BACKENDS } from '../../backends/registry'
import { deleteFromBackend, canDeleteFromBackend } from '../../backends/delete'
import { copyToClipboard } from '../../utils/clipboard'
import { formatSize, formatRelative } from '../../utils/format'

const historyStore = useHistoryStore()
const visibleRecords = () => historyStore.visibleRecords()
const searchKeyword = ref('')
const filterBackend = ref('')
const detailId = ref<string | null>(null)
const selectedIds = ref<string[]>([])
const copiedId = ref('')

onMounted(async () => {
  await historyStore.load()
})

watch([searchKeyword, filterBackend], () => {
  historyStore.search({
    keyword: searchKeyword.value || undefined,
    backend: filterBackend.value || undefined,
  })
})

function formatText(url: string, format: string): string {
  if (format === 'markdown') return `![](${url})`
  if (format === 'html') return `<img src="${url}" />`
  if (format === 'bbcode') return `[img]${url}[/img]`
  return url
}

async function copyFormat(url: string, format: string, id: string) {
  const text = formatText(url, format)
  await copyToClipboard(text)
  copiedId.value = id + format
  setTimeout(() => { if (copiedId.value === id + format) copiedId.value = '' }, 2000)
}

const deleting = ref(false)
const deleteDialog = ref<{ ids: string[]; show: boolean }>({ ids: [], show: false })
const syncDelete = ref(true)

function openDeleteDialog(ids: string[]) {
  const canSync = ids.some((id) => {
    const r = historyStore.allRecords().find((x) => x.id === id)
    return r?.meta && canDeleteFromBackend(r.backend)
  })
  syncDelete.value = canSync
  deleteDialog.value = { ids, show: true }
}

async function confirmDelete() {
  const ids = deleteDialog.value.ids
  deleteDialog.value.show = false
  if (deleting.value) return
  try {
    deleting.value = true
    if (syncDelete.value) {
      for (const id of ids) {
        const record = historyStore.allRecords().find((r) => r.id === id)
        if (record?.meta && canDeleteFromBackend(record.backend)) {
          await deleteFromBackend(record.backend, record.meta as Record<string, string>)
        }
        await historyStore.hardRemove(id)
      }
    } else {
      // Hide from history only, keep in upload page
      for (const id of ids) {
        historyStore.softRemove(id)
      }
    }
    if (ids.length === 1 && detailId.value === ids[0]) detailId.value = null
    selectedIds.value = selectedIds.value.filter((x) => !ids.includes(x))
  } catch (e: any) {
    alert('删除失败: ' + (e.message || '未知错误'))
  } finally {
    deleting.value = false
  }
}

function toggleSelect(id: string) {
  const idx = selectedIds.value.indexOf(id)
  if (idx >= 0) selectedIds.value.splice(idx, 1)
  else selectedIds.value.push(id)
}

function thumbnailUrl(record: any): string {
  if (record.thumbnail instanceof Blob) {
    return URL.createObjectURL(record.thumbnail)
  }
  return record.url
}

const detailRecord = () => visibleRecords().find((r) => r.id === detailId.value) || null
</script>

<template>
  <div class="history-page">
    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar-left">
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="Search by filename or URL..."
          class="search-input"
        />
        <select v-model="filterBackend" class="filter-select">
          <option value="">All backends</option>
          <option v-for="b in BACKENDS" :key="b.id" :value="b.id">{{ b.label }}</option>
        </select>
      </div>
      <div class="toolbar-right">
        <span v-if="selectedIds.length > 0" class="selected-count">{{ selectedIds.length }} selected</span>
        <button
          v-if="selectedIds.length > 0"
          @click="openDeleteDialog(selectedIds)"
          class="btn-danger"
        >
          Delete selected
        </button>
      </div>
    </div>

    <!-- Grid -->
    <div v-if="visibleRecords().length > 0" class="image-grid">
      <div
        v-for="record in visibleRecords()"
        :key="record.id"
        class="image-card"
        :class="{ selected: selectedIds.includes(record.id) }"
        @click="detailId = record.id"
      >
        <div class="image-card-media">
          <img
            :src="thumbnailUrl(record)"
            :alt="record.filename"
            loading="lazy"
          />
          <div class="image-card-check" @click.stop="toggleSelect(record.id)">
            <div class="check-circle" :class="{ checked: selectedIds.includes(record.id) }">
              <svg v-if="selectedIds.includes(record.id)" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          </div>
          <div class="image-card-actions">
            <button @click.stop="copyFormat(record.url, 'url', record.id)" class="card-action-btn" title="Copy URL">U</button>
            <button @click.stop="copyFormat(record.url, 'markdown', record.id)" class="card-action-btn" title="Copy Markdown">M</button>
            <button @click.stop="copyFormat(record.url, 'html', record.id)" class="card-action-btn" title="Copy HTML">H</button>
            <button @click.stop="openDeleteDialog([record.id])" class="card-action-btn danger" title="Delete">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
        <div class="image-card-info">
          <p class="image-card-name">{{ record.filename }}</p>
          <p class="image-card-meta">{{ formatSize(record.size) }} · {{ record.backend }}</p>
        </div>
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="historyStore.loaded" class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
      <p class="empty-title">No images yet</p>
      <p class="empty-hint">Upload your first image to see it here</p>
    </div>

    <!-- Delete Confirm Dialog -->
    <Teleport to="body">
      <div v-if="deleteDialog.show" class="dialog-overlay" @click.self="deleteDialog.show = false">
        <div class="dialog">
          <h3 class="dialog-title">确认删除</h3>
          <p class="dialog-text">确定要删除 {{ deleteDialog.ids.length }} 个图片记录吗？</p>
          <label v-if="deleteDialog.ids.some(id => { const r = historyStore.allRecords().find(x => x.id === id); return r?.meta && canDeleteFromBackend(r.backend) })" class="dialog-check">
            <input type="checkbox" v-model="syncDelete" />
            <span>同时从图床删除文件</span>
          </label>
          <div class="dialog-actions">
            <button @click="deleteDialog.show = false" class="dialog-btn cancel">取消</button>
            <button @click="confirmDelete()" class="dialog-btn danger">删除</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Detail Drawer -->
    <Teleport to="body">
      <div
        v-if="detailRecord()"
        class="drawer-overlay"
        @click.self="detailId = null"
      >
        <div class="drawer">
          <div class="drawer-header">
            <h2>Image Details</h2>
            <button @click="detailId = null" class="drawer-close">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="drawer-body">
            <img :src="detailRecord()!.url" class="drawer-image" />
            <div class="drawer-fields">
              <div class="drawer-field">
                <label>Filename</label>
                <span>{{ detailRecord()!.filename }}</span>
              </div>
              <div class="drawer-field">
                <label>Size</label>
                <span>{{ formatSize(detailRecord()!.size) }}</span>
              </div>
              <div class="drawer-field">
                <label>Backend</label>
                <span>{{ detailRecord()!.backend }}</span>
              </div>
              <div class="drawer-field">
                <label>Uploaded</label>
                <span>{{ formatRelative(detailRecord()!.createdAt) }}</span>
              </div>
            </div>
            <code class="drawer-url">{{ detailRecord()!.url }}</code>
            <div class="drawer-formats">
              <div class="drawer-format-row">
                <span class="drawer-format-label">MD</span>
                <code class="drawer-format-code">{{ formatText(detailRecord()!.url, 'markdown') }}</code>
              </div>
              <div class="drawer-format-row">
                <span class="drawer-format-label">HTML</span>
                <code class="drawer-format-code">{{ formatText(detailRecord()!.url, 'html') }}</code>
              </div>
              <div class="drawer-format-row">
                <span class="drawer-format-label">BBC</span>
                <code class="drawer-format-code">{{ formatText(detailRecord()!.url, 'bbcode') }}</code>
              </div>
            </div>
            <div class="drawer-actions">
              <div class="drawer-copy-row">
                <button @click="copyFormat(detailRecord()!.url, 'url', detailRecord()!.id)" class="btn-fmt" :class="{ copied: copiedId === detailRecord()!.id + 'url' }">{{ copiedId === detailRecord()!.id + 'url' ? 'Copied' : 'URL' }}</button>
                <button @click="copyFormat(detailRecord()!.url, 'markdown', detailRecord()!.id)" class="btn-fmt" :class="{ copied: copiedId === detailRecord()!.id + 'markdown' }">{{ copiedId === detailRecord()!.id + 'markdown' ? 'Copied' : 'MD' }}</button>
                <button @click="copyFormat(detailRecord()!.url, 'html', detailRecord()!.id)" class="btn-fmt" :class="{ copied: copiedId === detailRecord()!.id + 'html' }">{{ copiedId === detailRecord()!.id + 'html' ? 'Copied' : 'HTML' }}</button>
                <button @click="copyFormat(detailRecord()!.url, 'bbcode', detailRecord()!.id)" class="btn-fmt" :class="{ copied: copiedId === detailRecord()!.id + 'bbcode' }">{{ copiedId === detailRecord()!.id + 'bbc' ? 'Copied' : 'BBC' }}</button>
              </div>
              <button @click="openDeleteDialog([detailRecord()!.id])" class="btn-danger-outline full">
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.history-page {
  width: 100%;
}

/* Toolbar */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.toolbar-left {
  display: flex;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.search-input {
  flex: 1;
  max-width: 360px;
  padding: 8px 14px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text);
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s;
}

.search-input::placeholder {
  color: var(--color-text-muted);
}

.search-input:focus {
  border-color: var(--color-primary);
}

.filter-select {
  padding: 8px 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text);
  font-size: 13px;
  outline: none;
  cursor: pointer;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.selected-count {
  font-size: 13px;
  color: var(--color-text-muted);
}

.btn-danger {
  padding: 7px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  background: var(--color-error);
  border: none;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn-danger:hover {
  opacity: 0.85;
}

/* Grid */
.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.image-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.15s ease;
}

.image-card:hover {
  border-color: var(--color-border-hover);
  transform: translateY(-1px);
}

.image-card.selected {
  border-color: var(--color-primary);
}

.image-card-media {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  background: var(--color-surface-raised);
}

.image-card-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s;
}

.image-card:hover .image-card-media img {
  transform: scale(1.05);
}

.image-card-check {
  position: absolute;
  top: 8px;
  left: 8px;
}

.check-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.5);
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  transition: all 0.15s;
}

.check-circle.checked {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.image-card-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}

.image-card:hover .image-card-actions {
  opacity: 1;
}

.card-action-btn {
  min-width: 28px;
  height: 28px;
  border-radius: 5px;
  border: none;
  background: rgba(0,0,0,0.5);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  padding: 0 5px;
  transition: background 0.15s;
}

.card-action-btn:hover {
  background: rgba(0,0,0,0.7);
}

.card-action-btn.danger:hover {
  background: var(--color-error);
}

.image-card-info {
  padding: 10px 12px;
}

.image-card-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.image-card-meta {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 2px;
}

/* Empty */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: var(--color-text-muted);
}

.empty-icon {
  margin-bottom: 16px;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 14px;
}

/* Drawer */
.drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: flex-end;
}

.drawer {
  width: 100%;
  max-width: 420px;
  height: 100%;
  background: var(--color-surface);
  border-left: 1px solid var(--color-border);
  overflow-y: auto;
  animation: slideIn 0.2s ease;
}

@keyframes slideIn {
  from { transform: translateX(20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
}

.drawer-header h2 {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.drawer-close {
  padding: 6px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
}

.drawer-close:hover {
  color: var(--color-text);
  background: var(--color-surface-raised);
}

.drawer-body {
  padding: 24px;
}

.drawer-image {
  width: 100%;
  border-radius: 10px;
  margin-bottom: 20px;
}

.drawer-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.drawer-field {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.drawer-field label {
  font-size: 13px;
  color: var(--color-text-muted);
}

.drawer-field span {
  font-size: 13px;
  color: var(--color-text);
  font-weight: 500;
}

.drawer-url {
  display: block;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-muted);
  background: var(--color-surface-raised);
  padding: 10px 12px;
  border-radius: 8px;
  word-break: break-all;
  margin-bottom: 16px;
  user-select: all;
}

.drawer-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-primary {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  background: var(--color-primary);
  border: none;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
}

.btn-primary.full {
  width: 100%;
}

.btn-danger-outline {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-error);
  background: transparent;
  border: 1px solid var(--color-error);
  cursor: pointer;
  transition: all 0.15s;
}

.btn-danger-outline.full {
  width: 100%;
}

.btn-danger-outline:hover {
  background: rgba(239,68,68,0.1);
}

.drawer-copy-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.drawer-formats {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 16px;
  background: var(--color-surface-raised);
  padding: 10px 12px;
  border-radius: 8px;
}

.drawer-format-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.drawer-format-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--color-primary);
  width: 28px;
  text-align: right;
  flex-shrink: 0;
}

.drawer-format-code {
  flex: 1;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  user-select: all;
}

.btn-fmt {
  padding: 7px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #fff;
  background: var(--color-primary);
  border: none;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}

.btn-fmt:hover {
  background: var(--color-primary-hover);
}

.btn-fmt.copied {
  background: var(--color-success);
}

/* Delete Dialog */
.dialog-overlay {
  position: fixed; inset: 0; z-index: 300;
  background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center;
}
.dialog {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
}
.dialog-title { font-size: 16px; font-weight: 600; color: var(--color-text); margin: 0 0 8px; }
.dialog-text { font-size: 14px; color: var(--color-text-muted); margin: 0 0 16px; }
.dialog-check {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px;
  background: var(--color-surface-raised);
  border-radius: 8px;
  margin-bottom: 20px;
  cursor: pointer;
  font-size: 13px; color: var(--color-text);
}
.dialog-check input { accent-color: var(--color-primary); width: 16px; height: 16px; cursor: pointer; }
.dialog-actions { display: flex; gap: 8px; justify-content: flex-end; }
.dialog-btn {
  padding: 8px 20px; border-radius: 8px; font-size: 13px; font-weight: 500;
  border: none; cursor: pointer; transition: all 0.15s;
}
.dialog-btn.cancel { background: var(--color-surface-raised); color: var(--color-text); }
.dialog-btn.cancel:hover { background: var(--color-border); }
.dialog-btn.danger { background: var(--color-error); color: #fff; }
.dialog-btn.danger:hover { opacity: 0.85; }
</style>
