<script setup lang="ts">
import { ref } from 'vue'
import { apiJson } from '@/utils/request'
import { apiFetch } from '@/utils/request'

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
let hideTimer: number | undefined
const notify = (msg: string) => {
  error.value = msg
  if (hideTimer) clearTimeout(hideTimer)
  hideTimer = window.setTimeout(() => {
    error.value = null
  }, 3000)
}

const submit = async () => {
  if (loading.value) return
  if (!username.value || !password.value) {
    error.value = '请输入用户名和密码'
    return
  }
  loading.value = true
  error.value = null
  try {
    const data = await apiJson('vite/commons/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value, role: 'admin' }),
    })
    const token = (data as any)?.data?.token || (data as any)?.token
    if (token) {
      ;(window as any).token = token
      localStorage.token = token
      location.reload()
    } else {
      const msg = (data as any)?.messgae || (data as any)?.message
      notify(msg || '未返回令牌')
    }
  } catch (e: any) {
    notify(e?.message || '网络错误')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div v-if="error" class="banner" role="alert" @click="error = null">{{ error }}</div>
    <div class="login-card">
      <h2>后台登录</h2>
      <div class="field">
        <label>用户名</label>
        <input type="text" v-model="username" placeholder="请输入用户名" @keyup.enter="submit" />
      </div>
      <div class="field password-wrapper">
        <label>密码</label>
        <input :type="showPassword ? 'text' : 'password'" v-model="password" placeholder="请输入密码" @keyup.enter="submit" />
      </div>
      <div class="actions">
        <button class="btn btn-primary" :disabled="loading" @click="submit">登录</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
}
.login-card {
  width: 360px;
  padding: 24px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
}
.login-card h2 {
  margin: 0 0 16px 0;
  color: #111827;
}
.field {
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
}
label {
  font-size: 14px;
  color: #374151;
  margin-bottom: 6px;
}
input {
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}
.password-wrapper {
  position: relative;
}
.password-wrapper input {
  padding-right: 48px;
}
.toggle-visibility {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: #6b7280;
  cursor: pointer;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
}
.toggle-visibility:hover {
  color: #374151;
}
.toggle-visibility:focus-visible {
  outline: 2px solid #93c5fd;
  border-radius: 4px;
}
.toggle-visibility svg {
  display: block;
}
.actions {
  margin-top: 16px;
  display: flex;
}
.actions .btn {
  width: 100%;
}
.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
.btn-primary {
  background: #3b82f6;
  color: #fff;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.error {
  margin-top: 10px;
  color: #ef4444;
}
.banner {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: #ef4444;
  color: #fff;
  padding: 10px 16px;
  border-radius: 8px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}
</style>
