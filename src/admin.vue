<script setup lang="ts">
import { ref } from 'vue'
import Surveys from './surveys.vue'
import Videos from './videos.vue'
import Music from './music.vue'
import Students from './students.vue'

const active = ref<'students' | 'videos' | 'music' | 'surveys'>('students')
</script>

<template>
  <div class="admin">
    <div class="topbar">
      <div class="system-title">芳香疗愈体验管理系统</div>
    </div>
    <div class="layout">
      <aside class="sidebar">
        <div class="brand">后台管理</div>
        <nav class="menu">
          <button
            class="menu-item"
            :class="{ active: active === 'students' }"
            @click="active = 'students'"
          >
            <span class="icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M5.121 17.804A7 7 0 0112 15a7 7 0 016.879 2.804" />
                <path d="M12 12a4 4 0 100-8 4 4 0 000 8" />
              </svg>
            </span>
            <span class="label">学员管理</span>
          </button>
          <button
            class="menu-item"
            :class="{ active: active === 'surveys' }"
            @click="active = 'surveys'"
          >
            <span class="icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" />
                <path d="M10 9l6 3-6 3V9" />
              </svg>
            </span>
            <span class="label">视频播放记录</span>
          </button>
          <button
            class="menu-item"
            :class="{ active: active === 'videos' }"
            @click="active = 'videos'"
          >
            <span class="icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M9 5h10v14H5V5h4" />
                <path d="M9 9h8" />
                <path d="M9 13h8" />
                <path d="M9 17h8" />
              </svg>
            </span>
            <span class="label">评测记录</span>
          </button>
          <button
            class="menu-item"
            :class="{ active: active === 'music' }"
            @click="active = 'music'"
          >
            <span class="icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 3v10" />
                <path d="M12 13l-3 3" />
                <path d="M12 13l3 3" />
                <path d="M6 21h12" />
              </svg>
            </span>
            <span class="label">数据导出</span>
          </button>
        </nav>
      </aside>
      <main class="content">
        <Students v-if="active === 'students'" />
        <Surveys v-else-if="active === 'surveys'" />
        <Videos v-else-if="active === 'videos'" />
        <Music v-else-if="active === 'music'" />
        <Students v-else />
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin {
  min-height: 100vh;
  background: #f8fafc;
  --primary: #8b5cf6;
  --primary-hover: #7c3aed;
}
.topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--primary);
  color: #fff;
  padding: 12px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.system-title {
  font-weight: 700;
  letter-spacing: 0.5px;
}
.layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 100vh;
}
.sidebar {
  background: #fff;
  border-right: 1px solid #e5e7eb;
  padding: 16px;
  position: sticky;
  top: 48px;
  height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.brand {
  font-weight: 700;
  color: #111827;
  padding: 8px 0;
}
.menu {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #f3f4f6;
  color: #111827;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s, box-shadow 0.15s, border-color 0.15s,
    color 0.15s;
}
.menu-item:hover {
  background: #eef2ff;
  border-color: #c7d2fe;
}
.menu-item.active {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary-hover);
  box-shadow: 0 6px 16px rgba(124, 58, 237, 0.28);
}
.menu-item .icon {
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.menu-item .icon svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: #6b7280;
  stroke-width: 1.6;
}
.menu-item.active .icon svg {
  stroke: #fff;
}
.menu-item .label {
  flex: 1;
  font-weight: 600;
}
.content {
  padding: 16px;
}
@media (max-width: 960px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .sidebar {
    position: static;
    height: auto;
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
    top: 0;
  }
  .menu {
    flex-direction: row;
    flex-wrap: wrap;
  }
}
</style>
