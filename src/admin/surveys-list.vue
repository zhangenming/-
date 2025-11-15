<script setup lang="ts">
import { ref, onMounted } from 'vue'
import SurveysAdd from './surveys.vue'
import { apiJson } from '@/utils/request'

const loading = ref(false)
const error = ref<string | null>(null)
const items = ref<Array<{ id: number; theme: string }>>([])

const load = async () => {
  loading.value = true
  error.value = null
  items.value = []
  try {
    const data = await apiJson('/api/v1/surveys')
    const arr = Array.isArray((data as any).data)
      ? (data as any).data
      : Array.isArray(data)
      ? (data as any)
      : []
    items.value = arr
  } catch (e: any) {
    error.value = e?.message || '网络错误'
  } finally {
    loading.value = false
  }
}

onMounted(load)

const showAdd = ref(false)
const openAdd = () => {
  showAdd.value = true
}
const closeAdd = () => {
  showAdd.value = false
}
const formRef = ref<any>(null)
</script>

<template>
  <div class="page">
    <div class="toolbar">
      <h2>问卷管理</h2>
      <button class="btn btn-primary" @click="openAdd">新增问卷</button>
    </div>
    <div class="list">
      <div v-if="loading" class="status">正在加载…</div>
      <div v-if="error" class="error">{{ error }}</div>
      <div v-if="items.length" class="cards">
        <div class="card" v-for="it in items" :key="it.id">
          <div class="title">{{ it.theme || '未命名问卷' }}</div>
          <div class="meta">ID: {{ it.id }}</div>
        </div>
      </div>
      <div v-else-if="!loading && !error" class="empty">暂无问卷</div>
    </div>

    <div v-if="showAdd" class="modal-overlay">
      <div class="modal-card">
        <div class="modal-header">
          <div class="modal-title">新增问卷</div>
          <button class="modal-close" @click="closeAdd">×</button>
        </div>
        <div class="modal-body">
          <SurveysAdd
            ref="formRef"
            @created="
              () => {
                closeAdd()
                load()
              }
            "
          />
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="formRef?.createSurvey?.()">
            创建问卷
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  padding: 16px;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.list {
  margin-top: 8px;
}
.status {
  color: #6b7280;
}
.error {
  color: #ef4444;
}
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}
.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.title {
  font-weight: 700;
  color: #111827;
}
.meta {
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
}
.btn {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f3f4f6;
  cursor: pointer;
}
.btn-primary {
  background: #3b82f6;
  color: #fff;
  border-color: #2563eb;
}

.page {
  position: relative;
}
.modal-overlay {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 240px;
  background: rgba(17, 24, 39, 0.35);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  z-index: 1000;
  overflow: auto;
}
.modal-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
  width: min(1200px, 92%);
  max-width: 1200px;
  min-height: 64vh;
  max-height: calc(100% - 80px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.modal-header {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
}
.modal-title {
  font-weight: 700;
  color: #111827;
}
.modal-close {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: #f3f4f6;
  cursor: pointer;
}
.modal-body {
  padding: 18px 20px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
.modal-card :deep(.survey-header) {
  position: static;
  border: none;
  background: transparent;
  padding: 0;
}
.modal-card :deep(.survey) {
  padding: 0;
  box-shadow: none;
  border: none;
}
.modal-card :deep(.survey-header) {
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 2;
}
.modal-card :deep(.options-card) {
  background: #fff;
  border-left-color: #e5e7eb;
}
.modal-card :deep(.content-grid) {
  gap: 20px;
}
.modal-card :deep(.btn) {
  height: 36px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 12px 18px;
  border-top: 1px solid #e5e7eb;
  background: #fff;
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
}

@media (max-width: 960px) {
  .modal-overlay {
    left: 0;
    padding: 24px 12px;
  }
  .modal-card {
    width: 96%;
    min-height: 60vh;
    max-height: 90vh;
  }
}
</style>

<script lang="ts">
export default {}
</script>
