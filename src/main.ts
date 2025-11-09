import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import Demo from './Demo.vue'
import Surveys from './surveys.vue'

createApp(Surveys).mount('#app')

// fetch('vite/commons/login', {
//   method: 'POST',
//   headers: {
//     'Content-Type': 'application/json',
//   },
//   body: JSON.stringify({ username: 'enm', password: '12345123', role: 'admin' }),
// })
//   .then(res => res.json())
//   .then(res => {
//     window.token = res.data.token

//     fetch('vite/api/v1/quizzes?limit=50&offset=0', {
//       headers: {
//         Authorization: `Bearer ${window.token}`,
//       },
//     })
//     // fetch('vite/api/v1/courses?limit=50&offset=0', {
//     //   headers: {
//     //     Authorization: `Bearer ${window.token}`,
//     //   },
//     // })
//   })

// const to =
//   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyIiwidXNlcm5hbWUiOiJlbm0iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjI2NzMyNDksImV4cCI6MTc2Mjc1OTY0OX0.po08kYieKW6egP_FuUtWqFuyegyfCY6pLg3v9ETYiW0'

// fetch('vite/api/v1/courses/?limit=50&offset=0', {
//   headers: {
//     Authorization: `Bearer ${to}`,
//   },
// })
