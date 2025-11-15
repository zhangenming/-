<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { apiJson } from '@/utils/request'

const listLoading = ref(false)
const listError = ref<string | null>(null)
const items = ref<any[]>([])

const loadList = async () => {
  listLoading.value = true
  listError.value = null
  items.value = []
  try {
    const data = await apiJson(`api/v1/courses/simple`)
    items.value = (data as any).data || data
  } catch (e: any) {
    listError.value = e?.message || '网络错误'
  } finally {
    listLoading.value = false
  }
}

const showCreate = ref(false)
const name = ref('')
const desc = ref('')
const selectedVideoIds = ref<number[]>([])
const allVideos = ref<any[]>([])
const videosLoading = ref(false)
const videosError = ref<string | null>(null)
const search = ref('')

const loadVideos = async () => {
  videosLoading.value = true
  videosError.value = null
  allVideos.value = []
  try {
    const data = await apiJson(`api/v1/videos/`)
    allVideos.value = (data as any).data || data
  } catch (e: any) {
    videosError.value = e?.message || '网络错误'
  } finally {
    videosLoading.value = false
  }
}

const filteredVideos = () => {
  const q = search.value.trim().toLowerCase()
  if (!q) return allVideos.value
  return allVideos.value.filter((v: any) => String(v.name || '').toLowerCase().includes(q))
}

const openCreate = async () => {
  name.value = ''
  desc.value = ''
  selectedVideoIds.value = []
  showCreate.value = true
  await loadVideos()
  nextTick(() => {})
}
const closeCreate = () => {
  showCreate.value = false
}

const onDragStartVideo = (id: number) => {
  ;(window as any)._dragVideoId = id
}
const onDropVideo = () => {
  const id = (window as any)._dragVideoId
  if (!id && id !== 0) return
  if (!selectedVideoIds.value.includes(id)) selectedVideoIds.value.push(id)
}
const removeSelected = (id: number) => {
  selectedVideoIds.value = selectedVideoIds.value.filter(x => x !== id)
}

const canSubmit = () => {
  return !!name.value && selectedVideoIds.value.length > 0
}

const submitting = ref(false)
const submitError = ref<string | null>(null)

const submit = async () => {
  if (!canSubmit()) return
  submitting.value = true
  submitError.value = null
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const body = JSON.stringify({ title: name.value, description: desc.value, video_ids: selectedVideoIds.value })
  try {
    await apiJson(`api/v1/courses/simple`, { method: 'POST', headers, body })
    showCreate.value = false
    await loadList()
  } catch (e: any) {
    submitError.value = e?.message || '网络错误'
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadList()
})
</script>

<template>
  <div class="page">
    <div class="toolbar">
      <h2>课程管理</h2>
      <button class="btn btn-primary" @click="openCreate">新建课程</button>
    </div>

    <div class="list-block">
      <div v-if="listLoading" class="status">正在获取列表…</div>
      <div v-if="listError" class="error">{{ listError }}</div>
      <div v-if="items.length" class="cards">
        <div class="card" v-for="it in items" :key="it.id">
          <div class="card-body">
            <div class="card-title">{{ it.title || '未命名课程' }}</div>
            <div class="card-meta">ID: {{ it.id }}</div>
            <div class="card-desc">{{ it.description || '暂无描述' }}</div>
            <div class="card-meta">视频数：{{ Array.isArray(it.video_ids) ? it.video_ids.length : (it.videos?.length || 0) }}</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showCreate" class="modal-overlay">
      <div class="create-modal">
        <div class="create-header">
          <h3 class="create-title">新建课程</h3>
        </div>
        <div class="create-content">
          <div class="create-form">
            <div class="form-row">
              <label class="form-label">名称</label>
              <div class="form-control">
                <input type="text" v-model="name" maxlength="100" placeholder="请输入课程名称" />
              </div>
            </div>
            <div class="form-row">
              <label class="form-label">描述</label>
              <div class="form-control">
                <textarea v-model="desc" maxlength="200" placeholder="请输入课程描述"></textarea>
              </div>
            </div>

            <div class="dnd-grid">
              <div class="videos-panel">
                <div class="panel-title">视频库</div>
                <div class="panel-tools">
                  <input type="text" v-model="search" placeholder="搜索视频" />
                </div>
                <div class="panel-list">
                  <div
                    class="video-item"
                    v-for="v in filteredVideos()"
                    :key="v.id"
                    draggable="true"
                    @dragstart="onDragStartVideo(v.id)"
                  >
                    <div class="vi-title">{{ v.name || '未命名视频' }}</div>
                    <div class="vi-meta">ID: {{ v.id }}</div>
                    <button class="btn" @click="!selectedVideoIds.includes(v.id) && selectedVideoIds.push(v.id)">添加</button>
                  </div>
                </div>
              </div>

              <div class="selected-panel" @dragover.prevent @drop="onDropVideo">
                <div class="panel-title">已选择视频（{{ selectedVideoIds.length }}）</div>
                <div class="panel-list">
                  <div class="selected-item" v-for="sid in selectedVideoIds" :key="sid">
                    <div class="vi-title">{{ (allVideos.find(x => x.id === sid) || {}).name || '视频 ' + sid }}</div>
                    <div class="vi-meta">ID: {{ sid }}</div>
                    <button class="btn" @click="removeSelected(sid)">移除</button>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="submitError" class="error">{{ submitError }}</div>
          </div>
        </div>
        <div class="create-footer">
          <button class="btn" @click="closeCreate">取消</button>
          <button class="btn btn-primary" :disabled="!canSubmit() || submitting" @click="submit">创建</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { max-width: none; width: 100%; margin: 0; padding: 0 16px; }
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.list-block { margin-top: 16px; }
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
.card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.card-body { padding: 12px; }
.card-title { font-weight: 700; color: #111827; }
.card-meta { margin-top: 4px; font-size: 12px; color: #6b7280; }
.card-desc { margin-top: 6px; color: #374151; font-size: 13px; }
.status { margin-top: 10px; color: #666; }
.error { margin-top: 10px; color: #ef4444; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 1000; }
.create-modal { background: #fff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); padding: 20px; max-width: 1000px; width: 100%; }
.create-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.create-title { color: #2563eb; font-weight: 700; font-size: 20px; }
.create-content { display: block; }
.create-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; border-top: 1px solid #e5e7eb; padding-top: 12px; }

.form-row { display: grid; grid-template-columns: 72px 1fr; gap: 12px; align-items: start; margin-bottom: 12px; }
.form-label { color: #374151; padding-top: 6px; }
.form-control input[type='text'], .form-control textarea { width: 100%; padding: 10px 12px; border: 1px solid #e0e0e0; border-radius: 8px; }
.form-control textarea { min-height: 80px; }

.dnd-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 8px; }
.panel-title { font-weight: 600; margin-bottom: 8px; }
.panel-tools { display: flex; gap: 8px; margin-bottom: 8px; }
.panel-tools input { flex: 1; padding: 8px 10px; border: 1px solid #e5e7eb; border-radius: 8px; }
.panel-list { display: grid; grid-template-columns: 1fr; gap: 8px; max-height: 360px; overflow: auto; padding-right: 6px; }
.video-item, .selected-item { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 8px; padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; }
.vi-title { font-weight: 600; color: #111827; }
.vi-meta { font-size: 12px; color: #6b7280; }
.selected-panel { border: 2px dashed #cbd5e1; border-radius: 12px; padding: 12px; }

.btn { padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f3f4f6; cursor: pointer; }
.btn-primary { background: #3b82f6; color: #fff; border-color: #2563eb; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
</style>

<script lang="ts">
export default {}
</script>

