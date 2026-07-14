import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_PREFIX = 'pb_config_'

export const useConfigStore = defineStore('config', () => {
  const imgHost = ref(localStorage.getItem('pb_imgHost') || 'github')
  const configs = ref<Record<string, Record<string, string>>>({})

  function loadAll() {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(STORAGE_PREFIX)) {
        const id = key.slice(STORAGE_PREFIX.length)
        try {
          configs.value[id] = JSON.parse(localStorage.getItem(key)!)
        } catch { /* skip */ }
      }
    }
    const saved = localStorage.getItem('pb_imgHost')
    if (saved) imgHost.value = saved
  }

  function get(backendId: string): Record<string, string> {
    return configs.value[backendId] || {}
  }

  function set(backendId: string, config: Record<string, string>) {
    configs.value[backendId] = { ...config }
    localStorage.setItem(STORAGE_PREFIX + backendId, JSON.stringify(config))
  }

  function remove(backendId: string) {
    delete configs.value[backendId]
    localStorage.removeItem(STORAGE_PREFIX + backendId)
  }

  function setImgHost(val: string) {
    imgHost.value = val
    localStorage.setItem('pb_imgHost', val)
  }

  function isConfigured(backendId: string): boolean {
    const cfg = get(backendId)
    return Object.keys(cfg).length > 0
  }

  return { imgHost, configs, loadAll, get, set, remove, setImgHost, isConfigured }
})
