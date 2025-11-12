<script setup lang="ts">
import { ref } from 'vue'
import Surveys from './surveys.vue'
import Videos from './videos.vue'

const active = ref<'surveys' | 'videos'>('surveys')
</script>

<template>
  <div class="admin">
    <div class="topbar">
      <div class="brand">后台管理</div>
      <div class="tabs">
        <button class="tab" :class="{ active: active === 'surveys' }" @click="active = 'surveys'">问卷</button>
        <button class="tab" :class="{ active: active === 'videos' }" @click="active = 'videos'">视频</button>
      </div>
    </div>

    <div class="content">
      <Surveys v-if="active === 'surveys'" />
      <Videos v-else />
    </div>
  </div>
</template>

<style scoped>
.admin { display: flex; flex-direction: column; min-height: 100vh; background: #f8fafc; }
.topbar { position: sticky; top: 0; z-index: 10; display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #fff; border-bottom: 1px solid #e5e7eb; }
.brand { font-weight: 700; color: #111827; }
.tabs { display: flex; gap: 8px; }
.tab { padding: 8px 12px; border: 1px solid transparent; border-radius: 8px; background: #f3f4f6; color: #111827; cursor: pointer; transition: background .15s, color .15s, border-color .15s; }
.tab:hover { background: #eef2ff; border-color: #c7d2fe; color: #0f172a; }
.tab.active { background: #3b82f6; color: #fff; border-color: #2563eb; }
.tab.active:hover { background: #2563eb; }
.content { padding: 16px; }
</style>
