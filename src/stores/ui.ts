import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
  const isDark = ref(localStorage.getItem('pb_dark') !== 'false')
  const sidebarCollapsed = ref(false)

  function toggleDark() {
    isDark.value = !isDark.value
    localStorage.setItem('pb_dark', String(isDark.value))
  }

  return { isDark, sidebarCollapsed, toggleDark }
})
