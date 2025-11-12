<script setup lang="ts">
import NextCas from '@nextcas/sdk'
import { Record } from '@nextcas/voice'

import { onMounted, ref, computed } from 'vue'
import { createAccessToken } from './token'
import { simulateClick } from './utils'

const showBegin = ref(false)
const showSurvey = ref(false)
const currentQuestionIndex = ref(0)
const userAnswers = ref<number[]>([])
const selectedIndex = ref<number[]>([])
const showResult = ref(false)

type Option = { text: string; value: number }
type Question = { text: string; options: Option[] }
type Range = { min: number; label: string }

// 问题数据
const questions = ref<Question[]>([])

// 评分标准
const ranges = ref<Range[]>([])

// 计算总分
const totalScore = computed(() => {
  return userAnswers.value.reduce((sum, score) => sum + score, 0)
})

// 计算最高分
const maxScore = computed(() => {
  return questions.value.reduce((sum, q) => {
    const maxOptionValue = Math.max(...q.options.map(o => o.value))
    return sum + maxOptionValue
  }, 0)
})

// 获取评级
const getGrade = (score: number) => {
  for (let i = ranges.value.length - 1; i >= 0; i--) {
    if (score >= ranges.value[i].min) {
      return ranges.value[i]
    }
  }
  return ranges.value[0]
}

// 当前问题
const currentQuestion = computed(() => {
  return questions.value[currentQuestionIndex.value] || { text: '', options: [] }
})

// 是否是最后一题
const isLastQuestion = computed(() => {
  return currentQuestionIndex.value === questions.value.length - 1
})

const showCourseSelect = ref(false)
const selectedCourse = ref<{ id: number; title: string; description: string | null; video_url: string | null; cover_url: string | null } | null>(null)
const playingVideo = ref(false)

const 课程data = [
  {
    id: 11,
    title: 'E2E体验课',
    description: '端到端测试课程',
    video_url: 'https://samplelib.com/lib/preview/mp4/sample-10s.mp4',
    cover_url: 'https://picsum.photos/seed/course11/300/200',
  },
  {
    id: 10,
    title: '测试课程api',
    description: '测试课程api',
    video_url: null,
    cover_url: null,
  },
  {
    id: 9,
    title: '测试课程api',
    description: '测试课程api',
    video_url: null,
    cover_url: null,
  },
  {
    id: 8,
    title: '测试课程',
    description: '课程课程课程课程课程课程',
    video_url: 'http://192.168.2.3/static/media/vid/8a6c552754d74063.mp4',
    cover_url: 'http://192.168.2.3/static/media/img/6b9c879dc6b4429d.png',
  },
  {
    id: 3,
    title: '匹兹堡睡眠',
    description: null,
    video_url: null,
    cover_url: null,
  },
]
// 开始答题
const startSurvey = () => {
  cas.speak('好的，接下来请先选择需要体验的课程')
  showBegin.value = false
  showCourseSelect.value = true
  selectedCourse.value = null
  playingVideo.value = false
  showSurvey.value = false
  currentQuestionIndex.value = 0
  userAnswers.value = []
  showResult.value = false
}
const chooseCourse = (course: { id: number; title: string; description: string | null; video_url: string | null; cover_url: string | null }) => {
  if (!course.video_url) return
  selectedCourse.value = course
  showCourseSelect.value = false
  playingVideo.value = true
}
const onVideoEnded = () => {
  playingVideo.value = false
  showSurveyThemeSelect.value = true
  loadSurveys()
}
const closeVideo = () => {
  playingVideo.value = false
  showSurveyThemeSelect.value = true
  loadSurveys()
}
const onVideoError = () => {
  playingVideo.value = false
  showCourseSelect.value = true
}
const backToBegin = () => {
  showCourseSelect.value = false
  showBegin.value = true
  selectedCourse.value = null
  playingVideo.value = false
  showSurvey.value = false
}
const startChat = () => {
  showBegin.value = false
}

// 选择答案：记录选中索引与分值
const selectAnswer = (index: number, value: number) => {
  selectedIndex.value[currentQuestionIndex.value] = index
  userAnswers.value[currentQuestionIndex.value] = value
}

const surveys = ref<{ id: number; theme: string }[]>([])
const showSurveyThemeSelect = ref(false)
const selectedSurveyId = ref<number | null>(null)

const loadSurveys = async () => {
  const headers: Record<string, string> = {}
  const token = (window as any).token
  if (token) headers['Authorization'] = `Bearer ${token}`
  try {
    const res = await fetch('vite/api/v1/surveys', { headers })
    const data = await res.json().catch(() => [])
    if (Array.isArray(data)) {
      surveys.value = data
    } else if (Array.isArray((data as any).data)) {
      surveys.value = (data as any).data
    }
  } catch {}
}

const chooseSurveyTheme = async (s: { id: number; theme: string }) => {
  selectedSurveyId.value = s.id
  await fetchSurveyDetail(s.id)
  showSurveyThemeSelect.value = false
  currentQuestionIndex.value = 0
  userAnswers.value = []
  selectedIndex.value = []
  showSurvey.value = true
}

const fetchSurveyDetail = async (surveyId: number) => {
  const headers: Record<string, string> = {}
  const token = (window as any).token
  if (token) headers['Authorization'] = `Bearer ${token}`
  try {
    const res = await fetch(`vite/api/v1/surveys/${surveyId}`, { headers })
    const data = await res.json().catch(() => ({}))
    const detail = (data as any).data || data
    if (detail?.questions && detail?.ranges) {
      questions.value = detail.questions
      ranges.value = detail.ranges
    }
  } catch {}
}

// 下一题
const nextQuestion = () => {
  if (isLastQuestion.value) {
    showResult.value = true
  } else {
    currentQuestionIndex.value++
  }
}

// 上一题
const prevQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
  }
}

// 重新答题
const restartSurvey = () => {
  currentQuestionIndex.value = 0
  userAnswers.value = []
  selectedIndex.value = []
  showResult.value = false
}

// 处理日常巡检点击
const handleInspectionClick = () => {
  speakCas('欢迎光临')
  showBegin.value = false
}

// 返回首页
const goHome = () => {
  showSurvey.value = false
  showResult.value = false
  showBegin.value = true
}

let cas: NextCas
const speakCas = (
  text: string,
  options?: {
    onStart?: () => void
    onEnd?: () => void
  }
) => {
  cas.speak(text, {
    ...options,
    onStart: () => {
      options?.onStart && options.onStart()
    },
    onEnd: () => {
      options?.onEnd && options.onEnd()
    },
  })
}
onMounted(async () => {
  cas = new NextCas(document.getElementById('container')!, {
    token: await createAccessToken(),
    templateName: 'base',
    avatarId: 'avatar_482790',
    actorId: 'actor_118544',
  })

  cas.on('ready', () => {
    simulateClick()
    speakCas('hi~我是抱抱，芳香教室专属助理，请问您是来体验课程、日常巡检还是进行聊天？', {
      onStart: () => {
        console.log('start')
        simulateClick()
        showBegin.value = true
      },
      onEnd: () => {
        console.log('end')
      },
    })
  })

  cas.on('reply', data => {
    const { content } = data.data

    console.log('reply', content)
    if (content === '好的 我知道了') {
      // 请问您是否坐好了->没有
      handleJsx()
    }

    if (content === '好的感谢配合现在请跟随系统指导进行体验课程，现在为您打开芳香机，播放轻缓音乐') {
      // 请问您是否坐好了->好了
    }
  })
})

function handleJsx() {
  setTimeout(() => {
    speakCas('请问您是否坐好了')
    // 在这里弹出语言输入按钮
  }, 3 * 1000)
}

let record: Record
;(async () => {
  record = new Record(await createAccessToken(), 'actor_118544')
})()

const onTouchStart = () => {
  record.start()
}

// Handle touch end
const onTouchEnd = () => {
  record
    .stopToText('16k_zh')
    .then(text => {
      console.log('语音识别结果', text)

      cas.ask(text)
    })
    .catch(error => console.error('录音停止时出错:', error))
}
</script>

<template>
  <div class="page">
    <div class="left">
      <div id="container"></div>
    </div>

    <div class="right">
      <div v-if="showBegin && !showSurvey && !showResult" class="modal-overlay">
        <div class="begin-modal">
          <div class="begin-title">hi~我是抱抱，芳香教室专属助理，请问您是来</div>
          <div class="begin-actions">
            <button class="btn btn-primary" @click="startSurvey">体验课程</button>
            <button class="btn btn-secondary" @click="handleInspectionClick">日常巡检</button>
            <button class="btn btn-secondary" @click="startChat">进行聊天</button>
          </div>
        </div>
      </div>

      <div v-if="showCourseSelect" class="modal-overlay">
        <div class="course-modal">
          <div class="course-modal-header">
            <h2>请选择体验的课程</h2>
            <button class="btn btn-secondary" @click="backToBegin">返回上一步</button>
          </div>
          <div class="course-list">
            <div
              class="course-card"
              :class="{ disabled: !course.video_url }"
              v-for="course in 课程data"
              :key="course.id"
              @click="chooseCourse(course)"
            >
              <div class="cover" v-if="course.cover_url">
                <img :src="course.cover_url" alt="cover" />
              </div>
              <div class="info">
                <div class="title">{{ course.title }}</div>
                <div class="desc">{{ course.description || '暂无描述' }}</div>
                <div class="tip" v-if="!course.video_url">无视频，暂不可体验</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="playingVideo && selectedCourse" class="modal-overlay">
        <div class="video-modal">
          <button class="video-close" @click="closeVideo" aria-label="关闭视频" title="关闭">×</button>
          <video
            :key="selectedCourse.id"
            :src="selectedCourse.video_url!"
            controls
            autoplay
            muted
            playsinline
            preload="metadata"
            @ended="onVideoEnded"
            @error="onVideoError"
          ></video>
        </div>
      </div>

      <div v-if="showSurveyThemeSelect" class="modal-overlay">
        <div class="course-modal">
          <div class="course-modal-header">
            <h2>请选择问卷主题</h2>
          </div>
          <div class="survey-list">
            <div class="survey-item" v-for="s in surveys" :key="s.id" @click="chooseSurveyTheme(s)">
              <div class="survey-title">{{ s.theme || '未命名问卷' }}</div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showSurvey && !showResult" class="modal-overlay">
        <div class="survey-container">
          <div class="survey-header">
            <h2>问卷答题</h2>
            <div class="progress">题目 {{ currentQuestionIndex + 1 }} / {{ questions.length }}</div>
          </div>

          <div class="question-card">
            <h3>{{ currentQuestion.text }}</h3>

            <div class="options">
              <div
                v-for="(option, index) in currentQuestion.options"
                :key="index"
                class="option"
                :class="{ selected: selectedIndex[currentQuestionIndex] === index }"
                @click="selectAnswer(index, option.value)"
              >
                <span class="option-label">{{ String.fromCharCode(65 + index) }}</span>
                <span class="option-text">{{ option.text }}</span>
                <span class="option-value">{{ option.value }}分</span>
              </div>
            </div>

            <div class="navigation">
              <button class="btn btn-secondary" @click="prevQuestion" :disabled="currentQuestionIndex === 0">上一题</button>

              <button class="btn btn-primary" @click="nextQuestion" :disabled="selectedIndex[currentQuestionIndex] === undefined">
                {{ isLastQuestion ? '提交' : '下一题' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showResult" class="result-container">
        <div class="result-card">
          <div class="result-summary">
            <span class="result-prefix">根据您的情况</span>
            <span class="grade-badge">{{ getGrade(totalScore)?.label || '' }}</span>
          </div>
          <div class="result-actions">
            <button class="btn btn-primary" @click="restartSurvey">重新评测</button>
            <button class="btn btn-primary" @click="handleJsx">继续</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <button
    class="voice-button"
    @mousedown="onTouchStart"
    @mouseup="onTouchEnd"
    @mouseleave="onTouchEnd"
    @touchstart.prevent="onTouchStart"
    @touchend.prevent="onTouchEnd"
    aria-label="按住说话"
  >
    按住说话
  </button>
</template>

<style scoped>
#container {
  width: 500px;
  height: 500px;
}

.page {
  display: flex;
  gap: 16px;
}

.left {
  width: 500px;
  flex-shrink: 0;
}

.right {
  flex: 1;
  position: relative;
}
#container {
  width: 500px;
  height: 500px;
}

.begin span {
  cursor: pointer;
  color: blue;
  border: 1px solid blue;
  border-radius: 5px;
  padding: 2px;
}

.begin-modal {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.15);
  padding: 32px;
  max-width: 640px;
  width: 100%;
  text-align: center;
}

.begin-title {
  color: #111827;
  margin-bottom: 20px;
  font-size: 22px;
  line-height: 1.6;
  font-weight: 600;
}

.begin-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.begin-modal .btn {
  padding: 12px 18px;
  border-radius: 10px;
  min-width: 140px;
}
.begin-modal .btn-primary {
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.35);
}

.course-modal {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 24px;
  max-width: 900px;
  width: 100%;
}
.course-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.course-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
  margin-top: 12px;
}
.survey-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
}
.survey-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
}
.survey-item:hover {
  border-color: #3b82f6;
  background: #f8f9ff;
}
.survey-title {
  font-weight: 600;
}

.course-card {
  display: flex;
  gap: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}
.course-card:hover {
  border-color: #3b82f6;
  background: #f8f9ff;
}
.course-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.course-card .cover img {
  width: 100px;
  height: 70px;
  object-fit: cover;
  border-radius: 6px;
}
.course-card .info .title {
  font-weight: 600;
}
.course-card .info .desc {
  font-size: 12px;
  color: #666;
}
.course-card .info .tip {
  font-size: 12px;
  color: #ef4444;
}

.video-modal {
  background: #000;
  border-radius: 12px;
  padding: 12px;
  max-width: 900px;
  width: 100%;
  position: relative;
  overflow: hidden;
}
.video-modal video {
  width: 100%;
  height: auto;
  border-radius: 8px;
  position: relative;
  z-index: 1;
}
.video-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  font-size: 22px;
  line-height: 1;
  z-index: 2;
}
.video-close:hover {
  background: rgba(0, 0, 0, 0.75);
  transform: scale(1.05);
}
.video-close:focus {
  outline: 2px solid #fff;
  outline-offset: 2px;
}
.video-close:active {
  transform: scale(0.98);
}

/* 答题界面样式 */
.survey-container {
  max-width: 900px;
  width: 90vw;
  margin: 24px auto;
  padding: 28px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
}

.survey-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.survey-header h2 {
  margin: 0;
  color: #333;
}

.progress {
  font-size: 14px;
  color: #666;
}

.question-card {
  padding: 20px 0;
}

.question-card h3 {
  margin: 0 0 22px 0;
  font-size: 22px;
  color: #111827;
}

.options {
  margin-bottom: 30px;
}

.option {
  display: flex;
  align-items: center;
  padding: 18px;
  margin-bottom: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.option:hover {
  border-color: #3b82f6;
  background-color: #f8f9ff;
}

.option.selected {
  border-color: #3b82f6;
  background-color: #eef2ff;
}

.option-label {
  display: inline-flex;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #333;
  background: #f0f0f0;
  border-radius: 50%;
  margin-right: 16px;
}

.option.selected .option-label {
  background: #3b82f6;
  color: white;
}

.option-text {
  flex: 1;
  font-size: 16px;
}

.option-value {
  font-size: 14px;
  color: #666;
}

.navigation {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.survey-container .btn {
  padding: 12px 22px;
  font-size: 16px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-secondary {
  background: #f3f4f6;
  color: #333;
}

.btn-secondary:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 结果界面样式 */
.result-container {
  max-width: 600px;
  margin: 20px auto;
  padding: 20px;
}

.result-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 30px;
  text-align: center;
}

.result-card h2 {
  margin-top: 0;
  color: #333;
}

.score-display {
  margin: 30px 0;
}

.score-circle {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: #f0f9ff;
  border: 4px solid #3b82f6;
  margin-bottom: 15px;
}

.score-value {
  font-size: 36px;
  font-weight: bold;
  color: #3b82f6;
}

.score-max {
  font-size: 16px;
  color: #666;
}

.grade {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.answer-summary {
  text-align: left;
  margin: 30px 0;
}

.answer-summary h3 {
  margin-bottom: 15px;
  color: #333;
}

.answer-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.question-text {
  flex: 1;
}

.answer-value {
  font-weight: bold;
  color: #3b82f6;
}

.result-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 30px;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1000;
}

.result-summary {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  margin-bottom: 16px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}
.result-prefix {
  color: #64748b;
  font-size: 18px;
  letter-spacing: 0.5px;
}
.grade-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  min-width: 96px;
  background: #f3f4f6;
  color: #111827;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
}
.voice-button {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 1100;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 9999px;
  padding: 12px 16px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  cursor: pointer;
}
.voice-button:hover {
  background: #2563eb;
}
.voice-button:active {
  transform: scale(0.98);
}
@media (max-width: 480px) {
  .result-summary {
    gap: 8px;
    padding: 10px 12px;
  }
  .result-prefix,
  .grade-badge {
    font-size: 16px;
  }
}
</style>
