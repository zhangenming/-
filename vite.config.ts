import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // 新增：开发环境代理配置
  server: {
    proxy: {
      '/api/v1/quizzes': {
        target: 'http://frp9.aaszxc.asia:12183',
        changeOrigin: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('111 proxy error', err)
          })
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('111 Sending Request:', req.url, ' => TO THE TARGET =>  ', proxyReq.host, proxyReq.path)
          })
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('111 Received Response from the Target:', proxyRes.statusCode, req.url, JSON.stringify(proxyRes.headers))
          })
        },
      },
      // 修正 commons 代理
      // '/commons': {
      //   target: 'http://frp9.aaszxc.asia:12183/',
      //   changeOrigin: true,
      //   // 无需 rewrite：后端路径本身就是 /commons/...
      //   // 若后端未来改为根路径，可启用：
      //   // rewrite: (path) => path.replace(/^\/commons/, '')
      // },

      '/commons/': {
        // "target": "https://openapi.jst-union.cn/",
        target: 'http://frp9.aaszxc.asia:12183/',
        secure: false,
        changeOrigin: true,
        rewrite: path => path.replace(/^\/commons/, '/commons/'),
      },

      // http://localhost:5173/vite/bar
      //   -> http://jsonplaceholder.typicode.com/bar
      '/vite': {
        target: 'http://frp9.aaszxc.asia:12183/',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/vite/, ''),
      },
    },
  },
})
