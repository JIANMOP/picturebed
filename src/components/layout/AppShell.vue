<script setup lang="ts">
import Header from './Header.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col bg-background text-text">
    <Header />
    <main class="flex-1">
      <div class="header-spacer"></div>
      <div class="content-area">
        <router-view />
      </div>
    </main>
  </div>
</template>
