<script setup lang="ts">
import { ref, nextTick, computed } from 'vue'

type Option = { text: string; value: number | null }
type Question = { text: string; options: Option[] }
type Range = { min: number; label: string }

// 改为题目列表：默认三个空白题目，每题三个空白选项
const questions = ref<Question[]>([
  {
    text: '',
    options: [
      { text: '', value: null },
      { text: '', value: null },
      { text: '', value: null },
    ],
  },
  {
    text: '',
    options: [
      { text: '', value: null },
      { text: '', value: null },
      { text: '', value: null },
    ],
  },
  {
    text: '',
    options: [
      { text: '', value: null },
      { text: '', value: null },
      { text: '', value: null },
    ],
  },
])

// 新增：输入框引用，用于添加后自动聚焦
const questionInputs = ref<HTMLInputElement[]>([])
const optionInputs = ref<HTMLInputElement[][]>([])

// 仅在提交时进行校验与提示
const shouldValidate = ref(false)

// 创建时输出的数据与提示消息
const createMessage = ref('')
const createSurvey = async () => {
  // 触发一次校验，仅在提交时显示红色提示/未填写提示
  shouldValidate.value = true
  // 组装符合要求的数据结构
  const payload = {
    questions: questions.value.map(q => ({
      text: q.text ?? '',
      options: q.options.map(o => ({
        text: o.text ?? '',
        value: Number.isFinite(o.value) ? o.value : 0,
      })),
    })),
    ranges: ranges.value.map(r => ({
      min: Number.isFinite(r.min) ? r.min : 0,
      label: typeof r.label === 'string' ? r.label : String(r.label ?? ''),
    })),
  }

  // 控制台输出，便于调试查看
  console.log('Create payload:', payload)

  // 尝试复制到剪贴板，并给出轻量提示
  try {
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
    createMessage.value = '已生成并复制到剪贴板'
  } catch (e) {
    createMessage.value = '已生成（复制失败，请手动从控制台复制）'
  }
  setTimeout(() => (createMessage.value = ''), 2000)
}

// 添加题目：默认包含三个空白选项；新增后聚焦题干
const addQuestion = () => {
  questions.value.push({
    text: '',
    options: [
      { text: '', value: null },
      { text: '', value: null },
      { text: '', value: null },
    ],
  })
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
  questions.value[qi].options.push({ text: '', value: null })
  nextTick(() => {
    const arr = optionInputs.value[qi] || []
    const el = arr[arr.length - 1]
    el?.focus()
  })
}

// 如果后续要汇总配置，可继续用 s；这里让 s.questions 指向题目列表
const ranges = ref<Range[]>([
  { min: 10, label: '不及格' },
  { min: 60, label: '及格' },
  { min: 80, label: '中等' },
  { min: 90, label: '良好' },
  { min: 100, label: '优秀' },
])

const addRange = () => {
  const lastMin = ranges.value.at(-1)?.min ?? 0
  ranges.value.push({ min: lastMin + 10, label: '' })
}
const removeRange = (i: number) => {
  if (ranges.value.length <= 1) return
  ranges.value.splice(i, 1)
}

const hasDuplicateMins = computed(() => {
  const seen = new Set<number>()
  for (const r of ranges.value) {
    if (seen.has(r.min)) return true
    seen.add(r.min)
  }
  return false
})

// 统计信息：题目总数与当前满分（每题最高选项分数求和）
const totalQuestions = computed(() => questions.value.length)
const maxScore = computed(() =>
  questions.value.reduce((sum, q) => {
    const maxOpt = q.options.reduce((m, o) => {
      const v = Number.isFinite(o.value) ? o.value : 0
      return Math.max(m, v)
    }, 0)
    return sum + maxOpt
  }, 0)
)

// 评分规则仅用于配置，不再在此页输入“最终分数”进行测试
</script>

<template>
  <div class="survey">
    <div class="survey-header">
      <div class="title">问卷设置</div>
      <div class="header-actions">
        <button class="btn btn-primary" @click="addQuestion">添加题目</button>
        <button class="btn btn-secondary" @click="createSurvey">
          创建问卷
        </button>
        <span class="create-msg" v-if="createMessage">{{ createMessage }}</span>
      </div>
    </div>

    <!-- 顶部输入区移除：题目与选项改为成组展示 -->

    <!-- 底部：左右两栏布局（左侧选项、右侧评分） -->
    <div class="content-grid">
      <!-- 左侧：将所有题目合并在一个卡片中，内部做分隔 -->
      <div class="left-col">
        <div class="options-card questions-card">
          <div class="questions-list">
            <div
              class="question-block"
              v-for="(q, qi) in questions"
              :key="'q-block-' + qi"
            >
              <!-- 题目输入（右侧两按钮与下方两列对齐，放同一行） -->
              <div class="field with-action">
                <span class="field-label"
                  ><span class="question-index">题目 {{ qi + 1 }}</span></span
                >
                <input
                  class="input"
                  type="text"
                  v-model="q.text"
                  placeholder="请输入题干"
                  :ref="el => (questionInputs[qi] = el as HTMLInputElement)"
                />
                <button class="btn btn-primary" @click="addOption(qi)">
                  添加选项
                </button>
                <button
                  class="btn btn-ghost"
                  @click="removeQuestion(qi)"
                  :disabled="questions.length <= 1"
                >
                  删除题目
                </button>
              </div>

              <div class="options-list">
                <div class="option-row" v-for="(o, i) in q.options" :key="i">
                  <span class="option-label">{{
                    String.fromCharCode(65 + i)
                  }}</span>
                  <input
                    class="input"
                    type="text"
                    v-model="o.text"
                    placeholder="选项内容"
                    :ref="el => {
                      (optionInputs[qi] ||= [])
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
                    placeholder="分值"
                    :class="{ invalid: shouldValidate && (o.value === null || Number.isNaN(o.value as number) || (o.value as number) < 0) }"
                  />
                  <button
                    class="btn btn-ghost"
                    @click="q.options.splice(i, 1)"
                    :disabled="q.options.length <= 1"
                  >
                    删除选项
                  </button>
                </div>
              </div>
              <!-- 未填写分值提示：本题存在未填写的分值时显示 -->
              <div
                class="hint-row"
                v-if="shouldValidate && q.options.some(o => o.value === null || Number.isNaN(o.value as number))"
              >
                提示：本题存在未填写的分值，请补充。
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：评分规则 -->
      <div class="right-col">
        <!-- 评分规则设置 -->
        <div class="options-card scoring-card">
          <div class="options-toolbar">
            <div class="options-title">评分规则</div>
            <div class="toolbar-right">
              <span class="toolbar-info">题目总数：{{ totalQuestions }}</span>
              <span class="toolbar-info">当前满分：{{ maxScore }}</span>
              <button class="btn btn-primary" @click="addRange">
                添加规则
              </button>
            </div>
          </div>

          <div class="rules-header">
            <span class="col-label">序号</span>
            <span class="col-label">阈值分数</span>
            <span class="col-label">评价</span>
            <span class="col-label">操作</span>
          </div>

          <div class="options-list">
            <div class="rules-row" v-for="(r, i) in ranges" :key="i">
              <span class="option-label">{{ i + 1 }}</span>
              <input
                class="input score"
                type="number"
                v-model.number="r.min"
                min="0"
                step="1"
                inputmode="numeric"
                :class="{ invalid: r.min < 0 }"
              />
              <input
                class="input"
                type="text"
                v-model="r.label"
                placeholder="评价标签，如：优秀"
              />
              <button
                class="btn btn-ghost"
                @click="removeRange(i)"
                :disabled="ranges.length <= 1"
              >
                删除
              </button>
            </div>
          </div>

          <div
            style="
              display: flex;
              justify-content: space-between;
              align-items: center;
            "
          >
            <div style="color: #ef4444" v-if="hasDuplicateMins">
              提示：存在重复的阈值，请调整。
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 布局容器 */
.survey {
  /* 组件尽量占满屏幕宽度 */
  width: 100%;
  max-width: 100vw;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  box-shadow: none; /* 减少容器阴影，突出内容 */
  display: flex;
  flex-direction: column;
  gap: 20px;
  /* 所有子元素采用边框盒模型，避免由于 padding 导致宽度溢出 */
  box-sizing: border-box;
}
/* 继承给子元素，保证网格内宽度计算稳定 */
.survey * {
  box-sizing: inherit;
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

/* 顶部题目区：简洁行内删除按钮 */
.questions-top .field {
  grid-template-columns: 50px minmax(140px, 1fr) 80px 80px;
}
/* 通用：带操作按钮的字段行（与选项行四列对齐） */
.field.with-action {
  grid-template-columns: 50px minmax(140px, 1fr) 80px 80px;
}
.field.with-action .btn {
  width: 100%; /* 两按钮分别占据第3、4列且等宽 */
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
  gap: 10px;
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
  border-left: 2px solid var(--accent-border); /* 更克制的左侧强调 */
  border-radius: 12px;
  background: #fff; /* 去掉卡片浅色底 */
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  /* 防止内部行/输入在等分布局下溢出到另一列 */
  overflow: hidden;
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

/* 评分规则工具栏右侧信息与按钮排列 */
.scoring-card .toolbar-right {
  display: flex;
  gap: 12px;
  align-items: center;
}
.scoring-card .toolbar-info {
  color: #64748b; /* 更温和的中性灰，避免过多彩色文字 */
  font-size: 12px;
}

/* 底部左右两栏 */
.content-grid {
  display: grid;
  /* 改为单列堆叠：上方题目与选项，下方评分规则 */
  grid-template-columns: 1fr;
  gap: 16px;
  align-items: start;
}
.left-col,
.right-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
  /* 允许列在网格中收缩，维持 50% 分配 */
  min-width: 0;
}
/* 题目块内部分隔：统一包裹在 questions-card 中 */
.question-block {
  padding: 10px 10px 12px;
  border-left: 2px solid var(--accent-border);
  padding-left: 14px; /* 给左侧边线留出内容间距 */
  border-radius: var(--radius);
  background: #fff;
}
.questions-card .question-block + .question-block {
  margin-top: 20px; /* 增大题与题之间垂直间距 */
  padding-top: 18px;
}
.right-col .options-card {
  min-height: 240px;
}

/* 表头 */
.options-header {
  display: grid;
  grid-template-columns: minmax(44px, max-content) minmax(140px, 1fr) 96px 96px;
  align-items: center;
  gap: 10px;
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
  gap: 5px; /* 合并为一个整体块，不再分隔间距 */
  margin-top: 6px; /* 与题目区更紧凑衔接 */
}
.option-row {
  display: grid;
  grid-template-columns: 50px minmax(140px, 1fr) 80px 80px;
  align-items: center;
  gap: 10px;
  border: none;
  border-radius: 8px;
  background: transparent; /* 行本身透明，由外层统一底色 */
  transition: background 0.2s;
}
.option-row + .option-row {
  border-top: 1px dashed var(--color-border-light); /* 轻分隔线，仍然是一块 */
}
.option-row .btn {
  width: 100%; /* 删除选项按钮撑满第4列，列宽视觉一致 */
}
.option-row > * {
  min-width: 0;
}
.option-row:hover {
  background: #fff; /* 悬浮时行内轻微提亮，保持整体块背景 */
}

/* 选项序号：去掉圆圈，保留简洁文本对齐 */
.option-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  font-weight: 600;
  color: #6b7280;
  margin-left: 6px;
  justify-self: center;
}

/* 题目序号徽标：将圆形样式转移到题目标题处 */
.question-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  padding: 0 6px;
  margin-left: 0;
  font-size: 12px;
  font-weight: 700;
  color: #374151;
  background: var(--accent-pill-bg);
  border: 1px solid var(--accent-pill-border);
  border-radius: 9999px; /* 胶囊形，容纳“题目 N” */
}

/* 分数输入右对齐 */
.score {
  text-align: right;
  width: 100%;
}

/* 小屏优化：缩小固定列，保证内容列尽量宽 */
@media (max-width: 560px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
  .options-header {
    grid-template-columns: minmax(40px, max-content) 1fr 80px 80px;
    font-size: 12px;
    gap: 8px;
  }
  .option-row {
    grid-template-columns: minmax(40px, max-content) 1fr 80px 80px;
    gap: 8px;
  }
  .field.with-action {
    grid-template-columns: minmax(40px, max-content) 1fr 80px 80px;
  }
  .rules-header {
    grid-template-columns: 48px clamp(72px, 26vw, 96px) 1fr 84px;
    font-size: 12px;
    gap: 8px;
  }
  .rules-row {
    grid-template-columns: 48px clamp(72px, 26vw, 96px) 1fr 84px;
    gap: 8px;
    padding: 8px;
  }
  .btn {
    padding: 0 8px;
  }
}

/* 去除滚动条形式的溢出处理，改用等分布局控制宽度 */

/* 行的美观与可读性增强 */
.option-row {
  border-radius: 12px;
}
/* 去掉斑马纹背景，减少视觉干扰 */
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
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary-hover);
}
.btn-primary:hover {
  background: var(--color-primary-hover);
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
.create-msg {
  color: #059669;
  font-size: 12px;
}

/* 评分模块特殊样式：绿色强调 + 浅底 */
.scoring-card {
  border-left-color: #a7f3d0; /* 低饱和绿色强调，友好不刺眼 */
  background: var(--color-card);
  box-shadow: 0 2px 12px rgba(16, 185, 129, 0.06);
}
.scoring-card .options-title {
  color: #065f46;
}

/* 评分模块信息行 */
.rules-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 4px 10px 0;
  color: #065f46;
  font-size: 12px;
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
  /* 更友好的中性浅灰卡片底色，减轻视觉负担 */
  --color-card: #f9fafb;
  --color-border: #e5e7eb;
  --color-border-light: #f1f5f9; /* 同色系更浅，用于题目块 */
  --color-muted: #6b7280;
  /* 主色改为更柔和的蓝色 */
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
  --color-danger: #ef4444;
  --color-danger-bg: #fee2e2;
  --ring-primary: rgba(59, 130, 246, 0.12);
  --ring-danger: rgba(239, 68, 68, 0.10);
  /* 更柔和的左侧强调线与徽标色 */
  --accent-border: #cbd5e1;        /* slate-300 */
  --accent-pill-bg: #f1f5f9;       /* slate-100 */
  --accent-pill-border: #e2e8f0;   /* slate-200 */
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
/* 选项行：高度较题目行缩小约20%（36px -> 29px） */
.option-row .input {
  height: 29px;
}
.option-row .btn {
  height: 30px;
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

/* 未填写提示 */
.hint-row {
  color: #ef4444;
  font-size: 12px;
  padding: 4px 10px 0;
}

/* 卡片与行：悬浮亮度与阴影层次，编辑时更舒服 */
.options-card {
  background: var(--color-card);
  border-left-color: #2563eb;
}
.option-row:hover {
  background: #fff; /* 与上方保持一致 */
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
  /* 移动端：选项行高度同样缩小约20%（40px -> 32px） */
  .option-row .input {
    height: 32px;
  }
  .option-row .btn {
    height: 32px;
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
/* 评分规则的列宽（桌面端）：让 min 更窄、label 更灵活，避免溢出 */
.rules-header {
  display: grid;
  grid-template-columns: 56px clamp(72px, 8vw, 100px) minmax(140px, 1fr) 72px;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-bottom: 1px dashed #e5e7eb;
  color: var(--color-muted);
  font-size: 13px;
}
.rules-row {
  display: grid;
  grid-template-columns: 56px clamp(72px, 8vw, 100px) minmax(140px, 1fr) 72px;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 1px solid #eef2f7;
  border-radius: 10px;
  background: #fff;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.rules-row > * {
  min-width: 0;
}
/* 规则列表容器也允许收缩，避免撑破右栏 */
.right-col .options-list {
  min-width: 0;
}
</style>
