<script setup lang="ts">
import { ref } from 'vue'
import { useConfigStore } from '../../stores/config'
import { BACKENDS } from '../../backends/registry'

const configStore = useConfigStore()
const expandedBackend = ref<string | null>(null)

function toggle(id: string) {
  expandedBackend.value = expandedBackend.value === id ? null : id
}

function saveConfig(backendId: string) {
  const form = document.getElementById(`config-form-${backendId}`) as HTMLFormElement
  if (!form) return
  const fd = new FormData(form)
  const cfg: Record<string, string> = {}
  for (const [key, value] of fd.entries()) {
    cfg[key] = value as string
  }
  configStore.set(backendId, cfg)
  const btn = form.querySelector('button[type="submit"]') as HTMLButtonElement
  if (btn) {
    btn.textContent = 'Saved ✓'
    btn.classList.add('saved')
    setTimeout(() => { btn.textContent = 'Save'; btn.classList.remove('saved') }, 1500)
  }
}

function deleteConfig(backendId: string) {
  configStore.remove(backendId)
  expandedBackend.value = null
}
</script>

<template>
  <div class="config-page">
    <div class="config-header">
      <h1>Backend Settings</h1>
      <p>Configure your image hosting backends. GitHub is always available as the default.</p>
    </div>

    <div class="config-list">
      <div
        v-for="backend in BACKENDS"
        :key="backend.id"
        class="config-card"
        :class="{ expanded: expandedBackend === backend.id }"
      >
        <button @click="toggle(backend.id)" class="config-card-header">
          <div class="config-card-title">
            <span class="backend-name">{{ backend.label }}</span>
            <span class="backend-desc">{{ backend.description }}</span>
          </div>
          <div class="config-card-status">
            <span
              v-if="configStore.isConfigured(backend.id) && backend.id !== 'github'"
              class="status-dot"
            ></span>
            <svg class="chevron" :class="{ rotated: expandedBackend === backend.id }" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </button>

        <div v-if="expandedBackend === backend.id" class="config-card-body">
          <form :id="`config-form-${backend.id}`" @submit.prevent="saveConfig(backend.id)">
            <div class="form-grid">
              <div v-for="field in backend.fields" :key="field.key" class="form-field">
                <label :for="`${backend.id}-${field.key}`">
                  {{ field.label }}
                  <span v-if="field.required" class="required">*</span>
                </label>
                <input
                  v-if="field.type === 'text' || field.type === 'password'"
                  :id="`${backend.id}-${field.key}`"
                  :name="field.key"
                  :type="field.type"
                  :placeholder="field.placeholder"
                  :value="configStore.get(backend.id)[field.key] || ''"
                  :required="field.required"
                />
                <select
                  v-else-if="field.type === 'select'"
                  :id="`${backend.id}-${field.key}`"
                  :name="field.key"
                >
                  <option value="">-- Select --</option>
                  <option
                    v-for="opt in field.options"
                    :key="opt.value"
                    :value="opt.value"
                    :selected="configStore.get(backend.id)[field.key] === opt.value"
                  >
                    {{ opt.label }}
                  </option>
                </select>
                <textarea
                  v-if="field.key === 'code'"
                  :id="`${backend.id}-${field.key}`"
                  :name="field.key"
                  placeholder="async (CUSTOM_ARG) => { ...; CUSTOM_ARG.okCb(url); }"
                  class="code-area"
                >{{ configStore.get(backend.id)[field.key] || '' }}</textarea>
              </div>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn-save">Save</button>
              <button
                v-if="configStore.isConfigured(backend.id) && backend.id !== 'github'"
                type="button"
                @click="deleteConfig(backend.id)"
                class="btn-delete-config"
              >
                Delete config
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.config-page {
  max-width: 720px;
  margin: 0 auto;
}

.config-header {
  margin-bottom: 32px;
}

.config-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 8px;
}

.config-header p {
  font-size: 14px;
  color: var(--color-text-muted);
  margin: 0;
}

.config-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.15s;
}

.config-card.expanded {
  border-color: var(--color-primary);
}

.config-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 16px 20px;
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
}

.config-card-header:hover {
  background: var(--color-surface-raised);
}

.config-card-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.backend-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.backend-desc {
  font-size: 12px;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 400px;
}

.config-card-status {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: var(--color-success);
  border-radius: 50%;
}

.chevron {
  color: var(--color-text-muted);
  transition: transform 0.2s;
}

.chevron.rotated {
  transform: rotate(180deg);
}

.config-card-body {
  padding: 0 20px 20px;
  border-top: 1px solid var(--color-border);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding-top: 20px;
}

@media (max-width: 500px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-field label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-muted);
}

.required {
  color: var(--color-error);
}

.form-field input,
.form-field select {
  padding: 8px 12px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text);
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s;
}

.form-field input:focus,
.form-field select:focus {
  border-color: var(--color-primary);
}

.form-field input::placeholder {
  color: var(--color-text-muted);
}

.code-area {
  grid-column: 1 / -1;
  height: 160px;
  padding: 10px 12px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text);
  font-family: var(--font-mono);
  font-size: 12px;
  resize: vertical;
  outline: none;
}

.code-area:focus {
  border-color: var(--color-primary);
}

.form-actions {
  display: flex;
  gap: 8px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}

.btn-save {
  padding: 9px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  background: var(--color-primary);
  border: none;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-save:hover {
  background: var(--color-primary-hover);
}

.btn-save.saved {
  background: var(--color-success);
}

.btn-delete-config {
  padding: 9px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-error);
  background: transparent;
  border: 1px solid var(--color-error);
  cursor: pointer;
  transition: all 0.15s;
}

.btn-delete-config:hover {
  background: rgba(239,68,68,0.1);
}
</style>
