import './assets/main.css'
import 'element-plus/dist/index.css'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

import { createApp } from 'vue'
import Admin from './admin.vue'
import Login from './login.vue'
import App from './App.vue'

const fetchUsers = async () => {
  const headers: Record<string, string> = {}
  const token = (window as any).token || localStorage.token
  if (token) headers['Authorization'] = `Bearer ${token}`
  try {
    const res = await fetch('vite/api/v1/users/', { headers })
    const data = await res.json().catch(() => ({}))
    console.log('users', res.status, data)
  } catch (e: any) {
    console.error('users error', e?.message || e)
  }
}

if (localStorage.token) {
  ;(window as any).token = localStorage.token
  const isAdmin = location.search === '?admin'
  const app = createApp(isAdmin ? Admin : App)
  app.use(ElementPlus, { locale: zhCn })
  app.mount('#app')
  if (isAdmin) document.body.classList.add('admin-mode')
  else document.body.classList.remove('admin-mode')
  fetchUsers()
} else {
  const app = createApp(Login)
  app.use(ElementPlus, { locale: zhCn })
  app.mount('#app')
  document.body.classList.remove('admin-mode')
}
