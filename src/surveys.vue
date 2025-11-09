<script setup lang="ts">
import { ref, nextTick } from 'vue'

type Option = { text: string; value: number }
type Question = { text: string; options: Option[] }

// 改为题目列表
const questions = ref<Question[]>([{ text: '', options: [{ text: '', value: 0 }] }])

// 新增：输入框引用，用于添加后自动聚焦
const questionInputs = ref<HTMLInputElement[]>([])
const optionInputs = ref<HTMLInputElement[][]>([])

// 添加题目：新增后聚焦题干，并维护输入引用数组
const addQuestion = () => {
  questions.value.push({ text: '', options: [{ text: '', value: 0 }] })
  optionInputs.value.push([])
  nextTick(() => {
    const el = questionInputs.value[questions.value.length - 1]
    el?.focus()
  })
}

// 删除题目：保留至少一题 + 删除确认 + 同步输入引用
const removeQuestion = (index: number) => {
  if (questions.value.length <= 1) return
  questions.value.splice(index, 1)
  questionInputs.value.splice(index, 1)
  optionInputs.value.splice(index, 1)
}

// 添加选项：新增后聚焦新选项
const addOption = (qi: number) => {
  questions.value[qi].options.push({ text: '', value: 0 })
  nextTick(() => {
    const arr = optionInputs.value[qi] || []
    const el = arr[arr.length - 1]
    el?.focus()
  })
}

// 如果后续要汇总配置，可继续用 s；这里让 s.questions 指向题目列表
const s = {
  questions: questions,
  ranges: [
    {
      range: 0,
      label: 'string',
    },
  ],
}
</script>

<template>
  <div class="survey">
    <div class="survey-header">
      <div class="title">问卷设置</div>
      <div class="header-actions">
        <div class="options-count">当前题目数：{{ questions.length }}</div>
        <button class="btn btn-primary" @click="addQuestion">添加题目</button>
      </div>
    </div>

    <!-- 按题目循环渲染 -->
    <div v-for="(q, qi) in questions" :key="qi">
      <div class="field">
        <span class="field-label">题目 {{ qi + 1 }}</span>
        <input class="input" type="text" v-model="q.text" placeholder="请输入题干" :ref="el => (questionInputs[qi] = el as HTMLInputElement)" />
      </div>

      <div class="options-card">
        <div class="options-toolbar">
          <div class="options-title">选项设置</div>
          <button class="btn btn-primary" @click="addOption(qi)">添加选项</button>
        </div>

        <div class="options-header">
          <span class="col-label">序号</span>
          <span class="col-label">内容</span>
          <span class="col-label">分数</span>
          <span class="col-label">操作</span>
        </div>

        <div class="options-list">
          <div class="option-row" v-for="(o, i) in q.options" :key="i">
            <span class="option-label">{{ String.fromCharCode(65 + i) }}</span>
            <input
              class="input"
              type="text"
              v-model="o.text"
              placeholder="选项内容"
              :ref="el => {
                (optionInputs[qi] ||= []);
                optionInputs[qi][i] = el as HTMLInputElement
              }"
            />
            <input
              class="input score"
              type="number"
              v-model.number="o.value"
              min="0"
              step="1"
              inputmode="numeric"
              placeholder="分值（数字）"
              :class="{ invalid: o.value < 0 }"
            />
            <button class="btn btn-ghost" @click="q.options.splice(i, 1)" :disabled="q.options.length <= 1">删除</button>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; margin-top: 8px; gap: 8px">
          <button class="btn btn-ghost" @click="removeQuestion(qi)" :disabled="questions.length <= 1">删除题目</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 布局容器 */
.survey {
  max-width: 760px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  gap: 20px;
}
/* 原有样式保持，仅增强 header 为横向布局 */
.survey-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.survey-header .title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}
.survey-header .desc {
  margin-top: 6px;
  font-size: 13px;
  color: #6b7280;
}

/* 通用输入与字段 */
.field {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.field-label {
  font-weight: 600;
  color: #374151;
}
.input {
  width: 100%;
  padding: 9px 10px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  background: #fff;
}
.input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

/* 选项卡片与工具栏 */
.options-card {
  margin-top: 10px;
  padding: 14px;
  border: 1px solid #e5e7eb;
  border-left: 4px solid red; /* 左侧强调线 */
  border-radius: 12px;
  background: #f8fafc;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
}
.options-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.options-title {
  font-weight: 600;
  color: #374151;
}

/* 表头 */
.options-header {
  display: grid;
  grid-template-columns: 56px minmax(240px, 1fr) clamp(96px, 12vw, 160px) 100px;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border-bottom: 1px dashed #e5e7eb;
  color: #6b7280;
  font-size: 13px;
}
.col-label {
  user-select: none;
}

/* 列表与行 */
.options-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
}
.option-row {
  display: grid;
  grid-template-columns: 56px minmax(240px, 1fr) clamp(96px, 12vw, 160px) 100px;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border: 1px solid #eef2f7;
  border-radius: 10px;
  background: #fff;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.option-row:hover {
  border-color: #dbe1ea;
  box-shadow: 0 2px 8px rgba(17, 24, 39, 0.06);
}

/* 序号标签 */
.option-label {
  display: inline-flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #374151;
  background: #eef2ff;
  border: 1px solid #dbeafe;
  border-radius: 50%;
  margin-left: 10px;
}

/* 分数输入右对齐 */
.score {
  text-align: right;
  width: 100%;
}

/* 小屏优化：缩小固定列，保证内容列尽量宽 */
@media (max-width: 560px) {
  .options-header {
    grid-template-columns: 48px 1fr 90px 84px;
    font-size: 12px;
    gap: 8px;
  }
  .option-row {
    grid-template-columns: 48px 1fr 90px 84px;
    gap: 8px;
    padding: 8px;
  }
  .btn {
    padding: 0 8px;
  }
}
/* 按钮样式 */
.btn {
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
}
.btn-primary {
  background: #2563eb;
  color: #fff;
  border-color: #1e40af;
}
.btn-primary:hover {
  background: #1d4ed8;
}
.btn-ghost {
  background: transparent;
  color: #ef4444;
  border-color: #fca5a5;
}
.btn-ghost:hover {
  background: #fee2e2;
}
.options-count {
  color: #6b7280;
  font-size: 12px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
/* 其余样式保持不变 */
.survey-header .title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}
.survey-header .desc {
  margin-top: 6px;
  font-size: 13px;
  color: #6b7280;
}
.input.invalid {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12);
}

.btn-secondary {
  background: #f3f4f6;
  color: #111827;
  border-color: #d1d5db;
}
.btn-secondary:hover {
  background: #e5e7eb;
}

/* 移动端：增大点击区域与减弱动画以提升性能 */
@media (max-width: 560px) {
  .survey {
    padding: var(--space-5);
  }
  .field {
    gap: var(--space-3);
    margin-bottom: var(--space-4);
  }
  .input {
    height: 40px;
  }
  .btn {
    height: 36px;
    padding: 0 var(--space-3);
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }
}

/* 去掉重复的标题样式定义，保留一处即可 */
.survey {
  --color-bg: #fff;
  --color-card: #f8fafc;
  --color-border: #e5e7eb;
  --color-muted: #6b7280;
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-danger: #ef4444;
  --color-danger-bg: #fee2e2;
  --ring-primary: rgba(59, 130, 246, 0.15);
  --ring-danger: rgba(239, 68, 68, 0.12);
  --radius: 12px;
  --space-1: 6px;
  --space-2: 8px;
  --space-3: 10px;
  --space-4: 12px;
  --space-5: 16px;
}

/* 头部：粘性定位与背景/阴影，便于随时添加题目 */
.survey-header {
  position: sticky;
  top: 0;
  z-index: 5;
  padding: var(--space-3) 0;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  backdrop-filter: saturate(180%) blur(2px);
}
.header-actions {
  gap: var(--space-3);
}
.options-count {
  color: var(--color-muted);
}

/* 输入框：更大的点击区域与可视化焦点 */
.input {
  height: 36px;
  padding: 0 var(--space-3);
  border-radius: 9px;
}
.input::placeholder {
  color: #9ca3af;
}
.input:focus-visible {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--ring-primary);
}

/* 分数错误态：更清晰的红色边框与弱提示背景 */
.input.invalid {
  border-color: var(--color-danger);
  box-shadow: 0 0 0 3px var(--ring-danger);
}

/* 卡片与行：悬浮亮度与阴影层次，编辑时更舒服 */
.options-card {
  background: var(--color-card);
  border-left-color: #2563eb;
}
.option-row:hover {
  border-color: #d1d5db;
  box-shadow: 0 2px 10px rgba(17, 24, 39, 0.08);
}

/* 按钮：统一焦点态与可点区域 */
.btn {
  min-width: 80px;
}
.btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring-primary);
}
.btn-primary {
  background: var(--color-primary);
  border-color: #1e40af;
}
.btn-primary:hover {
  background: var(--color-primary-hover);
}
.btn-ghost {
  color: var(--color-danger);
  border-color: #fca5a5;
}
.btn-ghost:hover {
  background: var(--color-danger-bg);
}

/* 次级按钮：用于复制 */
.btn-secondary {
  background: #f3f4f6;
  color: #111827;
  border-color: #d1d5db;
}
.btn-secondary:hover {
  background: #e5e7eb;
}

/* 移动端：增大点击区域与减弱动画以提升性能 */
@media (max-width: 560px) {
  .survey {
    padding: var(--space-5);
  }
  .field {
    gap: var(--space-3);
    margin-bottom: var(--space-4);
  }
  .input {
    height: 40px;
  }
  .btn {
    height: 36px;
    padding: 0 var(--space-3);
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }
}

/* 去掉重复的标题样式定义，保留一处即可 */
.survey-header .title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}
.survey-header .desc {
  margin-top: 6px;
  font-size: 13px;
  color: #6b7280;
}
.input.invalid {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12);
}

.btn-secondary {
  background: #f3f4f6;
  color: #111827;
  border-color: #d1d5db;
}
.btn-secondary:hover {
  background: #e5e7eb;
}
</style>
