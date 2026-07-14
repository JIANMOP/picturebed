<script setup lang="ts">
import { onMounted } from 'vue'
import AppShell from './components/layout/AppShell.vue'
import { useConfigStore } from './stores/config'

const configStore = useConfigStore()

onMounted(() => {
  configStore.loadAll()
})
</script>

<template>
  <AppShell />
</template>
