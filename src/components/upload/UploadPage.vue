<script setup lang="ts">
import { ref, computed, onMounted, onActivated, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUploadStore } from '../../stores/upload'
import { useConfigStore } from '../../stores/config'
import { useHistoryStore } from '../../stores/history'
import { BACKENDS } from '../../backends/registry'
import { copyToClipboard } from '../../utils/clipboard'
import { formatSize } from '../../utils/format'

const router = useRouter()
const route = useRoute()
const uploadStore = useUploadStore()
const configStore = useConfigStore()
const historyStore = useHistoryStore()
const fileInput = ref<HTMLInputElement | null>(null)
const dropActive = ref(false)
const copiedId = ref('')

async function refreshHistory() { await historyStore.load() }
onMounted(refreshHistory)
onActivated(refreshHistory)
watch(() => route.path, () => { if (route.path === '/upload') refreshHistory() })

const configuredBackends = computed(() => BACKENDS.filter((b) => configStore.isConfigured(b.id)))
const selectedBackend = computed(() => BACKENDS.find((b) => b.id === configStore.imgHost) || configuredBackends.value[0] || null)

function openFilePicker() { fileInput.value?.click() }

function onDrop(e: DragEvent) {
  dropActive.value = false
  if (e.dataTransfer?.files) uploadFiles(Array.from(e.dataTransfer.files))
}

function onFileInput(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files?.length) { uploadFiles(Array.from(input.files)); input.value = '' }
}

function onPaste(e: ClipboardEvent) {
  const files: File[] = []
  e.clipboardData?.items.forEach((item) => {
    if (item.type.startsWith('image/')) { const f = item.getAsFile(); if (f) files.push(f) }
  })
  if (files.length) uploadFiles(files)
}

function uploadFiles(files: File[]) {
  const imgFiles = files.filter((f) => f.type.startsWith('image/'))
  if (imgFiles.length && selectedBackend.value) uploadStore.addFiles(imgFiles, selectedBackend.value.id)
}

function selectBackend(id: string) { configStore.setImgHost(id) }

function formatText(url: string, format: string): string {
  if (format === 'markdown') return `![](${url})`
  if (format === 'html') return `<img src="${url}" alt="" />`
  if (format === 'bbcode') return `[img]${url}[/img]`
  return url
}

async function doCopy(text: string, id: string) {
  await copyToClipboard(text)
  copiedId.value = id
  setTimeout(() => { if (copiedId.value === id) copiedId.value = '' }, 2000)
}
</script>

<template>
  <div class="upload-page" @paste="onPaste" tabindex="0">
    <!-- Dropzone -->
    <div class="dropzone" :class="{ 'dropzone-active': dropActive }"
      @dragover.prevent="dropActive = true" @dragleave="dropActive = false"
      @drop.prevent="onDrop" @click="openFilePicker">
      <input ref="fileInput" type="file" accept="image/*" multiple class="hidden" @change="onFileInput" />
      <div class="dropzone-content">
        <svg class="upload-icon" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <h1 class="dropzone-title">Upload Image</h1>
        <p class="dropzone-hint">Drop, paste from clipboard, or click to browse</p>
      </div>
    </div>

    <!-- No backends -->
    <div v-if="configuredBackends.length === 0" class="no-backend">
      <p>No image hosting backends configured yet.</p>
      <router-link to="/config" class="config-link">Configure a backend →</router-link>
    </div>

    <!-- Backend selector -->
    <div v-else class="backend-row">
      <span class="backend-label">Upload to</span>
      <div class="backend-chips">
        <button v-for="b in configuredBackends" :key="b.id" @click="selectBackend(b.id)"
          class="chip" :class="{ 'chip-active': selectedBackend && b.id === selectedBackend.id }">{{ b.label }}</button>
      </div>
      <router-link to="/config" class="config-link">+ Add</router-link>
    </div>

    <!-- Current session results -->
    <div v-if="uploadStore.items.length > 0" class="results">
      <div v-for="item in uploadStore.items" :key="item.id" class="result-card">
        <template v-if="item.status === 'uploading'">
          <div class="result-icon uploading">
            <svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          </div>
          <div class="result-body">
            <p class="result-name">{{ item.file.name }}</p>
            <p class="result-status">Uploading{{ item.progress > 0 && item.progress < 100 ? ` ${item.progress}%` : '...' }}</p>
          </div>
        </template>

        <template v-else-if="item.status === 'done' && item.result">
          <div class="result-success">
            <div class="result-icon done">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div class="result-body">
              <p class="result-name">{{ item.file.name }}</p>
              <code class="result-url">{{ item.result.url }}</code>
              <div class="format-links">
                <div class="format-row">
                  <span class="format-label">MD</span>
                  <code class="format-code">{{ formatText(item.result.url, 'markdown') }}</code>
                </div>
                <div class="format-row">
                  <span class="format-label">HTML</span>
                  <code class="format-code">{{ formatText(item.result.url, 'html') }}</code>
                </div>
                <div class="format-row">
                  <span class="format-label">BBC</span>
                  <code class="format-code">{{ formatText(item.result.url, 'bbcode') }}</code>
                </div>
              </div>
              <div class="copy-buttons">
                <button @click="doCopy(item.result.url, item.id + 'url')" class="btn-fmt" :class="{ copied: copiedId === item.id + 'url' }">{{ copiedId === item.id + 'url' ? 'Copied' : 'URL' }}</button>
                <button @click="doCopy(formatText(item.result.url, 'markdown'), item.id + 'md')" class="btn-fmt" :class="{ copied: copiedId === item.id + 'md' }">{{ copiedId === item.id + 'md' ? 'Copied' : 'MD' }}</button>
                <button @click="doCopy(formatText(item.result.url, 'html'), item.id + 'html')" class="btn-fmt" :class="{ copied: copiedId === item.id + 'html' }">{{ copiedId === item.id + 'html' ? 'Copied' : 'HTML' }}</button>
                <button @click="doCopy(formatText(item.result.url, 'bbcode'), item.id + 'bbc')" class="btn-fmt" :class="{ copied: copiedId === item.id + 'bbc' }">{{ copiedId === item.id + 'bbc' ? 'Copied' : 'BBC' }}</button>
                <span class="result-size">{{ formatSize(item.file.size) }}</span>
              </div>
            </div>
          </div>
        </template>

        <template v-else-if="item.status === 'error'">
          <div class="result-icon error">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
          <div class="result-body">
            <p class="result-name">{{ item.file.name }}</p>
            <p class="result-error">{{ item.error }}</p>
          </div>
          <button @click="uploadStore.removeItem(item.id)" class="btn-dismiss">Dismiss</button>
        </template>
      </div>
    </div>

    <!-- Recent history -->
    <div v-if="uploadStore.items.length === 0 && historyStore.allRecords().length > 0" class="section">
      <div class="section-header">
        <h3>Recent Uploads</h3>
        <router-link to="/history" class="view-all">View all →</router-link>
      </div>
      <div class="results">
        <div v-for="record in historyStore.allRecords().slice(0, 10)" :key="record.id" class="result-card">
          <div class="result-success">
            <div class="result-icon done">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div class="result-body">
              <p class="result-name">{{ record.filename }}</p>
              <code class="result-url">{{ record.url }}</code>
              <div class="format-links">
                <div class="format-row">
                  <span class="format-label">MD</span>
                  <code class="format-code">{{ formatText(record.url, 'markdown') }}</code>
                </div>
                <div class="format-row">
                  <span class="format-label">HTML</span>
                  <code class="format-code">{{ formatText(record.url, 'html') }}</code>
                </div>
                <div class="format-row">
                  <span class="format-label">BBC</span>
                  <code class="format-code">{{ formatText(record.url, 'bbcode') }}</code>
                </div>
              </div>
              <div class="copy-buttons">
                <button @click="doCopy(record.url, record.id + 'url')" class="btn-fmt" :class="{ copied: copiedId === record.id + 'url' }">{{ copiedId === record.id + 'url' ? 'Copied' : 'URL' }}</button>
                <button @click="doCopy(formatText(record.url, 'markdown'), record.id + 'md')" class="btn-fmt" :class="{ copied: copiedId === record.id + 'md' }">{{ copiedId === record.id + 'md' ? 'Copied' : 'MD' }}</button>
                <button @click="doCopy(formatText(record.url, 'html'), record.id + 'html')" class="btn-fmt" :class="{ copied: copiedId === record.id + 'html' }">{{ copiedId === record.id + 'html' ? 'Copied' : 'HTML' }}</button>
                <button @click="doCopy(formatText(record.url, 'bbcode'), record.id + 'bbc')" class="btn-fmt" :class="{ copied: copiedId === record.id + 'bbc' }">{{ copiedId === record.id + 'bbc' ? 'Copied' : 'BBC' }}</button>
                <span class="result-size">{{ formatSize(record.size) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.upload-page { max-width: 750px; margin: 0 auto; outline: none; }
.dropzone { border: 2px dashed var(--color-border); border-radius: 16px; padding: 64px 32px; text-align: center; cursor: pointer; transition: all 0.2s ease; background: var(--color-surface); }
.dropzone:hover { border-color: var(--color-border-hover); background: var(--color-surface-raised); }
.dropzone-active { border-color: var(--color-primary) !important; background: var(--color-primary-light) !important; }
.dropzone-content { display: flex; flex-direction: column; align-items: center; gap: 16px; pointer-events: none; }
.upload-icon { color: var(--color-text-muted); transition: color 0.2s; }
.dropzone:hover .upload-icon, .dropzone-active .upload-icon { color: var(--color-primary); }
.dropzone-title { font-size: 24px; font-weight: 600; color: var(--color-text); margin: 0; }
.dropzone-hint { font-size: 14px; color: var(--color-text-muted); margin: 0; }

.no-backend { margin-top: 24px; text-align: center; }
.no-backend p { color: var(--color-text-muted); font-size: 14px; }
.no-backend .config-link { font-size: 14px; }

.backend-row { display: flex; align-items: center; gap: 12px; margin-top: 24px; flex-wrap: wrap; }
.backend-label { font-size: 13px; color: var(--color-text-muted); font-weight: 500; }
.backend-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.chip { padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 500; color: var(--color-text-muted); background: var(--color-surface); border: 1px solid var(--color-border); cursor: pointer; transition: all 0.15s ease; }
.chip:hover { color: var(--color-text); border-color: var(--color-border-hover); }
.chip-active { color: #fff !important; background: var(--color-primary) !important; border-color: var(--color-primary) !important; }
.config-link { margin-left: auto; font-size: 13px; color: var(--color-primary); text-decoration: none; font-weight: 500; }
.config-link:hover { text-decoration: underline; }

.results { margin-top: 16px; display: flex; flex-direction: column; gap: 10px; }
.result-card { display: flex; align-items: flex-start; gap: 12px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 10px; padding: 14px 16px; }
.result-success { display: flex; gap: 10px; flex: 1; min-width: 0; }
.result-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.result-icon.uploading { background: var(--color-primary-light); color: var(--color-primary); }
.result-icon.done { background: rgba(34, 197, 94, 0.15); color: var(--color-success); }
.result-icon.error { background: rgba(239, 68, 68, 0.15); color: var(--color-error); }
.spinner { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.result-body { flex: 1; min-width: 0; }
.result-name { font-size: 13px; font-weight: 500; color: var(--color-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px; }
.result-url { display: block; font-family: var(--font-mono); font-size: 11px; color: var(--color-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 8px; }
.result-status { font-size: 12px; color: var(--color-text-muted); }
.result-error { font-size: 12px; color: var(--color-error); }

.format-links { display: flex; flex-direction: column; gap: 4px; }
.format-row { display: flex; align-items: center; gap: 8px; }
.format-label { font-size: 10px; font-weight: 600; color: var(--color-primary); width: 32px; text-align: right; flex-shrink: 0; }
.format-code { flex: 1; font-family: var(--font-mono); font-size: 10px; color: var(--color-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; user-select: all; padding: 2px 0; }

.copy-buttons { display: flex; align-items: center; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
.result-size { font-size: 11px; color: var(--color-text-muted); white-space: nowrap; margin-left: auto; }
.btn-fmt { padding: 5px 12px; border-radius: 5px; font-size: 11px; font-weight: 500; color: #fff; background: var(--color-primary); border: none; cursor: pointer; white-space: nowrap; transition: all 0.15s; }
.btn-fmt:hover { background: var(--color-primary-hover); }
.btn-fmt.copied { background: var(--color-success); }
.btn-dismiss { padding: 6px 12px; border-radius: 6px; font-size: 12px; color: var(--color-text-muted); background: transparent; border: none; cursor: pointer; flex-shrink: 0; }
.btn-dismiss:hover { color: var(--color-text); }

.section { margin-top: 32px; }
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.section-header h3 { font-size: 14px; font-weight: 600; color: var(--color-text-muted); margin: 0; }
.view-all { font-size: 13px; color: var(--color-primary); text-decoration: none; }
.view-all:hover { text-decoration: underline; }
</style>
