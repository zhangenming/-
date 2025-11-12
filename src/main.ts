import './assets/main.css'

import { createApp } from 'vue'
import Admin from './admin.vue'
import Login from './login.vue'
import App from './App.vue'

if (localStorage.token) {
  ;(window as any).token = localStorage.token
  createApp(location.search === '?admin' ? Admin : App).mount('#app')
} else {
  createApp(Login).mount('#app')
}
