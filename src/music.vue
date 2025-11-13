<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'

const name = ref('')
const file = ref<File | null>(null)
const uploading = ref(false)
const result = ref<{ id?: number; music_url?: string; message?: string } | null>(null)
const error = ref<string | null>(null)

const onFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  file.value = input.files && input.files[0] ? input.files[0] : null
  if (file.value) 
  {
    const isAudio = file.value.type.startsWith('audio/')
    const maxSize = 100 * 1024 * 1024
    if (!isAudio) {
      error.value = '文件类型不支持，请选择音频文件'
      file.value = null
    } else if (file.value.size > maxSize) {
      error.value = '文件过大，建议 ≤ 100MB'
      file.value = null
    } else {
      error.value = null
    }
  }
}

const canSubmit = () => {
  return !!name.value && !!file.value && !uploading.value
}

const API_BASE = 'vite'
const bytesToSize = (bytes: number) => {
  const sizes = ['B', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 B'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}
const showCreate = ref(false)

const submit = async () => {
  if (!canSubmit()) return
  uploading.value = true
  error.value = null
  result.value = null
  const fd = new FormData()
  fd.append('name', name.value)
  fd.append('music', file.value as File)
  const headers: Record<string, string> = {}
  const token = (window as any).token || localStorage.token
  if (token) headers['Authorization'] = `Bearer ${token}`
  try {
    const res = await fetch(`${API_BASE}/api/v1/music/upload`, {
      method: 'POST',
      headers,
      body: fd,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      error.value = data?.message || `上传失败(${res.status})`
    } else {
      result.value = data?.data || data
      showCreate.value = false
      await loadList()
    }
  } catch (e: any) {
    error.value = e?.message || '网络错误'
  } finally {
    uploading.value = false
  }
}

const nameInputRef = ref<HTMLInputElement | null>(null)

const openCreate = () => {
  name.value = ''
  file.value = null
  error.value = null
  result.value = null
  showCreate.value = true
  nextTick(() => {
    nameInputRef.value?.focus()
  })
}
const closeCreate = () => {
  showCreate.value = false
}

const listLoading = ref(false)
const listError = ref<string | null>(null)
const items = ref<any[]>([])
const playingItem = ref<any | null>(null)

const loadList = async () => {
  listLoading.value = true
  listError.value = null
  items.value = []
  const headers: Record<string, string> = {}
  const token = (window as any).token || localStorage.token
  if (token) headers['Authorization'] = `Bearer ${token}`
  try {
    const res = await fetch(`${API_BASE}/api/v1/music/`, {
      headers,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      listError.value = data?.message || `获取列表失败(${res.status})`
    } else {
      items.value = data?.data || data
    }
  } catch (e: any) {
    listError.value = e?.message || '网络错误'
  } finally {
    listLoading.value = false
  }
}

const deleteLoading = ref<number | null>(null)
const deleteError = ref<string | null>(null)

const deleteItem = async (it: any) => {
  if (!it?.id) return
  deleteLoading.value = it.id
  deleteError.value = null
  const headers: Record<string, string> = {}
  const token = (window as any).token || localStorage.token
  if (token) headers['Authorization'] = `Bearer ${token}`
  try {
    const res = await fetch(`${API_BASE}/api/v1/music/${it.id}`, {
      method: 'DELETE',
      headers,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      deleteError.value = data?.message || `删除失败(${res.status})`
    } else {
      await loadList()
    }
  } catch (e: any) {
    deleteError.value = e?.message || '网络错误'
  } finally {
    deleteLoading.value = null
  }
}

onMounted(() => {
  loadList()
})

const openAudio = (it: any) => {
  if (!(it?.music_url || it?.music)) return
  playingItem.value = it
}
const closePlaying = () => {
  playingItem.value = null
}
</script>

<template>
  <div class="page">
    <div class="toolbar">
      <h2>音乐管理</h2>
      <button class="btn btn-primary" @click="openCreate">新增音乐</button>
    </div>

    <div class="list-block">
      <div v-if="listLoading" class="status">正在获取列表…</div>
      <div v-if="listError" class="error">{{ listError }}</div>
      <div v-if="items.length" class="cards">
        <div class="card" v-for="it in items" :key="it.id">
          <div class="card-body">
            <div class="card-title">{{ it.name || '未命名音乐' }}</div>
            <div class="card-meta">ID: {{ it.id }}</div>
            <div class="card-links">
              <span class="link" v-if="it.music_url || it.music">{{ it.music_url || it.music }}</span>
            </div>
          </div>
          <div class="card-actions">
            <button class="btn btn-primary" :disabled="!(it.music_url || it.music)" @click="openAudio(it)">播放</button>
            <button class="btn" :disabled="deleteLoading === it.id" @click="deleteItem(it)">删除</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="playingItem" class="modal-overlay">
      <div class="audio-modal">
        <button class="modal-close" @click="closePlaying" aria-label="关闭" title="关闭">×</button>
        <audio :src="(playingItem as any).music_url || (playingItem as any).music" controls autoplay></audio>
      </div>
    </div>

    <div v-if="showCreate" class="modal-overlay">
      <div class="create-modal">
        <div class="create-header">
          <h3 class="create-title">新增音乐</h3>
        </div>
        <div class="create-content">
          <div class="create-form">
            <div class="form-row">
              <label class="form-label">名称</label>
              <div class="form-control">
                <input ref="nameInputRef" type="text" v-model="name" maxlength="100" placeholder="请输入音乐名称" />
                <div class="help">最长 100 字</div>
              </div>
            </div>
            <div class="form-row">
              <label class="form-label">音频</label>
              <div class="form-control">
                <input type="file" accept="audio/mpeg,audio/mp3,audio/wav,audio/aac,audio/flac" @change="onFileChange" />
                <div class="file-meta">{{ file ? `${file.name} · ${bytesToSize(file.size)}` : '未选择文件' }}</div>
                <div class="help">支持 MP3/WAV/AAC/FLAC，建议 ≤ 100MB</div>
              </div>
            </div>
            <div v-if="uploading" class="status">正在上传…</div>
            <div v-if="error" class="error">{{ error }}</div>
            <div v-if="deleteError" class="error">{{ deleteError }}</div>
          </div>
        </div>
        <div class="create-footer">
          <button class="btn" @click="closeCreate">取消</button>
          <button class="btn btn-primary" :disabled="!canSubmit() || uploading" @click="submit">上传</button>
        </div>
      </div>
    </div>
  </div>
  
</template>

<style scoped>
.page { max-width: none; width: 100%; margin: 0; padding: 0 16px; }
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.form-row { display: grid; grid-template-columns: 72px 1fr; gap: 12px; align-items: start; margin-bottom: 12px; }
.form-label { color: #374151; padding-top: 6px; }
.form-control input[type='text'] { width: 100%; }
.form-control input[type='text'],
.form-control input[type='file'] { padding: 10px 12px; border: 1px solid #e0e0e0; border-radius: 8px; }
.form-control input[type='file'] { padding: 8px 10px; }
.form-control input:focus { border-color: #3b82f6; outline: none; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15); }
.file-meta { margin-top: 6px; font-size: 12px; color: #6b7280; }
label { font-size: 14px; color: #333; margin-bottom: 6px; }
.btn { padding: 10px 16px; border: none; border-radius: 8px; cursor: pointer; }
.btn-primary { background: #3b82f6; color: #fff; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.status { margin-top: 10px; color: #666; }
.error { margin-top: 10px; color: #ef4444; }
.list-block { margin-top: 20px; }
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
.card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); display: flex; flex-direction: column; }
.card-body { padding: 12px; }
.card-title { font-weight: 600; color: #111827; }
.card-meta { margin-top: 4px; font-size: 12px; color: #6b7280; }
.card-links { margin-top: 8px; font-size: 12px; color: #374151; word-break: break-all; }
.card-actions { padding: 12px; border-top: 1px solid #e5e7eb; display: flex; gap: 8px; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 1000; }
.audio-modal { background: #fff; border-radius: 12px; padding: 12px; max-width: 600px; width: 100%; position: relative; }
.audio-modal audio { width: 100%; }
.modal-close { position: absolute; top: 12px; right: 12px; width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.6); color: #fff; border: none; border-radius: 50%; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.2); font-size: 22px; line-height: 1; }
.modal-close:hover { background: rgba(0,0,0,0.75); transform: scale(1.05); }
.create-modal { background: #fff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); padding: 20px; max-width: 800px; width: 100%; }
.create-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.create-title { color: #2563eb; font-weight: 700; font-size: 20px; }
.create-content { display: block; }
.create-form .help { margin-top: 6px; font-size: 12px; color: #6b7280; }
.create-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; border-top: 1px solid #e5e7eb; padding-top: 12px; }
@media (max-width: 720px) { .create-content { display: block; } }
</style>

<script lang="ts">
export default {}
</script>
