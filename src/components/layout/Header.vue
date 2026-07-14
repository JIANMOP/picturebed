<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useUIStore } from '../../stores/ui'

const router = useRouter()
const route = useRoute()
const ui = useUIStore()

const navItems = [
  { path: '/upload', label: 'Upload' },
  { path: '/history', label: 'History' },
  { path: '/stats', label: 'Stats' },
  { path: '/config', label: 'Settings' },
]

function isActive(path: string) {
  return route.path === path
}
</script>

<template>
  <header class="header-bar">
    <div class="header-inner">
      <!-- Logo -->
      <router-link to="/" class="logo-link">
        <span class="logo-icon">P</span>
        <span class="logo-text">icturebed</span>
      </router-link>

      <div class="flex-1"></div>

      <!-- Nav -->
      <nav class="nav-links">
        <button
          v-for="item in navItems"
          :key="item.path"
          @click="router.push(item.path)"
          class="nav-btn"
          :class="{ active: isActive(item.path) }"
        >
          {{ item.label }}
        </button>
      </nav>

      <!-- Theme Toggle -->
      <button
        @click="ui.toggleDark()"
        class="theme-btn"
        :title="ui.isDark ? 'Light mode' : 'Dark mode'"
      >
        <svg v-if="ui.isDark" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      </button>
    </div>
  </header>
</template>

<style scoped>
.header-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: 64px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  box-shadow: 0 2px 5px -3px rgba(0,0,0,0.2), 0 5px 8px 0 rgba(0,0,0,0.14), 0 1px 14px 0 rgba(0,0,0,0.12);
}

.header-inner {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 24px;
  max-width: 100%;
}

@media (min-width: 768px) {
  .header-inner {
    padding: 0 48px;
  }
}

.logo-link {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: inherit;
  flex-shrink: 0;
}

.logo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--color-primary);
  color: #fff;
  border-radius: 8px;
  font-weight: 700;
  font-size: 18px;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: -0.02em;
}

@media (max-width: 640px) {
  .logo-text {
    display: none;
  }
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.nav-btn:hover {
  color: var(--color-text);
  background: var(--color-surface-raised);
}

.nav-btn.active {
  color: var(--color-primary);
  background: var(--color-primary-light);
}

.theme-btn {
  margin-left: 12px;
  padding: 8px;
  border-radius: 8px;
  color: var(--color-text-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.theme-btn:hover {
  color: var(--color-text);
  background: var(--color-surface-raised);
}
</style>
