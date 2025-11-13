<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElDatePicker } from 'element-plus'
import * as echarts from 'echarts'

type Student = {
  id: string
  name: string
  status: '完成课程' | '课程中' | '未完成'
  doneLessons: number
  totalLessons: number
  registeredAt: string
}

const filters = ref({
  from: '',
  to: '',
  employeeNo: '',
  studentId: '',
})

const students = ref<Student[]>([
  { id: 'S20210801', name: '张雨薇', status: '完成课程', doneLessons: 8, totalLessons: 12, registeredAt: '2023-05-12' },
  { id: 'S20210902', name: '李华', status: '课程中', doneLessons: 3, totalLessons: 12, registeredAt: '2023-06-18' },
  { id: 'S20211003', name: '王佳明', status: '完成课程', doneLessons: 12, totalLessons: 12, registeredAt: '2023-03-25' },
  { id: 'S20211104', name: '陈思琪', status: '未完成', doneLessons: 5, totalLessons: 12, registeredAt: '2023-07-02' },
  { id: 'S20211205', name: '赵丽娜', status: '课程中', doneLessons: 9, totalLessons: 12, registeredAt: '2023-04-15' },
])

const page = ref(1)
const pageSize = ref(5)

const filtered = computed(() => {
  let list = students.value
  if (filters.value.studentId) list = list.filter(s => s.id.includes(filters.value.studentId))
  if (filters.value.employeeNo) list = list.filter(s => s.name.includes(filters.value.employeeNo))
  return list
})

const paged = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

const selected = ref<Student | null>(students.value[0])
const selectStudent = (s: Student) => {
  selected.value = s
}

const resetFilters = () => {
  filters.value = { from: '', to: '', employeeNo: '', studentId: '' }
}

const addStudent = () => {}

const metrics = ref([
  { label: '情绪稳定值', value: 7.8, color: '#22c55e' },
  { label: '压力指数', value: 4.5, color: '#f59e0b' },
  { label: '专注力提升', value: 6.7, color: '#6366f1' },
])

const last7Days = ref<number[]>([88, 66, 94, 58, 72, 83, 95])
const line7Days = ref<number[]>([6, 7, 5, 4, 5, 6, 7])

const chartRef = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null
const initChart = () => {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)
  const option: echarts.EChartsOption = {
    grid: { left: 24, right: 24, top: 16, bottom: 24 },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisTick: { show: false },
      axisLabel: { color: '#6b7280' },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#eef2f7' } },
      axisLabel: { color: '#6b7280' },
    },
    tooltip: { trigger: 'axis' },
    series: [
      {
        type: 'bar',
        data: last7Days.value,
        itemStyle: { color: '#8b5cf6' },
        barWidth: '40%',
      },
      {
        type: 'line',
        data: line7Days.value,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#f59e0b', width: 2 },
        itemStyle: { color: '#f59e0b' },
      },
    ],
  }
  chart.setOption(option)
}

const resize = () => chart?.resize()

onMounted(() => {
  initChart()
  window.addEventListener('resize', resize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  chart?.dispose()
  chart = null
})

const completionPercent = computed(() => {
  if (!selected.value) return 0
  return Math.round((selected.value.doneLessons / selected.value.totalLessons) * 100)
})
</script>

<template>
  <div class="students-page">
    <div class="grid">
      <section class="main">
        <div class="card header">
          <div class="title">学员管理</div>
          <div class="actions">
            <button class="btn btn-primary" @click="addStudent">新增学员</button>
          </div>
        </div>

        <div class="card filters">
          <div class="filters-grid">
            <div class="field">
              <label>日期范围</label>
              <div class="row">
                <ElDatePicker v-model="filters.from" type="date" placeholder="选择日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD" />
                <span class="to">至</span>
                <ElDatePicker v-model="filters.to" type="date" placeholder="选择日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD" />
              </div>
            </div>
            <div class="field">
              <label>学员工号</label>
              <input type="text" placeholder="输入工号" v-model="filters.employeeNo" />
            </div>
            <div class="field">
              <label>学员ID</label>
              <input type="text" placeholder="输入ID" v-model="filters.studentId" />
            </div>
            <div class="field actions">
              <button class="btn btn-primary">查询</button>
              <button class="btn" @click="resetFilters">重置</button>
            </div>
          </div>
        </div>

        <div class="card table">
          <div class="table-head">
            <span>学员ID</span>
            <span>学员姓名</span>
            <span>状态</span>
            <span>课程次数</span>
            <span>注册日期</span>
            <span>操作</span>
          </div>
          <div class="table-rows">
            <div class="row" v-for="s in paged" :key="s.id">
              <span>{{ s.id }}</span>
              <span>{{ s.name }}</span>
              <span>
                <span class="badge" :class="s.status">{{ s.status }}</span>
              </span>
              <span>{{ s.doneLessons }}/{{ s.totalLessons }}</span>
              <span>{{ s.registeredAt }}</span>
              <span>
                <button class="link" @click="selectStudent(s)">查看详情</button>
              </span>
            </div>
          </div>
          <div class="table-foot">
            <span>显示 1-{{ pageSize }} 条，共 {{ filtered.length }} 条</span>
            <div class="pager">
              <button class="btn" disabled>‹</button>
              <button class="btn btn-primary">{{ page }}</button>
              <button class="btn" disabled>›</button>
            </div>
          </div>
        </div>

        <div class="card chart">
          <div class="chart-title">学员状态分析（最近7天）</div>
          <div class="chart-box" ref="chartRef"></div>
        </div>
      </section>

      <aside class="profile">
        <div class="card profile-card" v-if="selected">
          <div class="profile-header">
            <div class="profile-title">{{ selected!.name }}的学员档案</div>
            <button class="edit-link">编辑</button>
          </div>
          <div class="profile-inner">
            <div class="avatar"></div>
            <div class="profile-table">
              <div class="profile-row"><span class="label">学员ID</span><span class="value">{{ selected!.id }}</span></div>
              <div class="profile-row"><span class="label">姓名</span><span class="value">{{ selected!.name }}</span></div>
              <div class="profile-row"><span class="label">当前状态</span><span class="value">{{ selected!.status }}</span></div>
              <div class="profile-row"><span class="label">注册日期</span><span class="value">{{ selected!.registeredAt }}</span></div>
              <div class="profile-row"><span class="label">已完成课程</span><span class="value">{{ selected!.doneLessons }}节 ({{ completionPercent }}%)</span></div>
            </div>
          </div>
        </div>

        <div class="card metrics-card">
          <div class="section-title">最新测评结果</div>
          <div class="metric" v-for="m in metrics" :key="m.label">
            <span class="label">{{ m.label }}</span>
            <div class="bar-wrap"><div class="bar" :style="{ width: (m.value/10*100) + '%', background: m.color }"></div></div>
            <span class="value">{{ m.value }}/10</span>
          </div>
        </div>

        <div class="card quick-actions">
          <button class="btn btn-primary">导出报告</button>
          <button class="btn">查看录像</button>
          <button class="btn danger">归档记录</button>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.students-page { padding: 16px; }
.grid { display: grid; grid-template-columns: 1fr 320px; gap: 16px; }
.main { display: grid; gap: 16px; }
.card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,.06); }
.header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; }
.title { font-weight: 700; color: #111827; }
.actions { display: flex; gap: 8px; }
.btn { height: 36px; padding: 0 14px; border-radius: 8px; border: 1px solid #e5e7eb; background: #f3f4f6; cursor: pointer; }
.btn-primary { height: 36px; background: var(--primary, #8b5cf6); color: #fff; border-color: var(--primary-hover, #7c3aed); }
.btn.danger { background: #fee2e2; color: #b91c1c; border-color: #fecaca; }

.filters { padding: 16px 18px; }
.filters-grid { display: grid; grid-template-columns: minmax(260px, 1.4fr) minmax(200px, 1fr) minmax(200px, 1fr) auto; column-gap: 16px; row-gap: 12px; align-items: end; }
.field { display: flex; flex-direction: column; gap: 8px; }
.field.actions { flex-direction: row; justify-content: flex-end; align-items: center; gap: 8px; }
.field label { color: #374151; font-size: 13px; }
.row { display: grid; grid-template-columns: 1fr 28px 1fr; gap: 10px; align-items: center; }
.row .to { text-align: center; color: #6b7280; }
input[type='text'] { height: 36px; padding: 0 12px; border: 1px solid #e5e7eb; border-radius: 8px; }
.row :deep(.el-date-editor) { width: 100%; height: 36px; }

.table { padding: 10px 0; overflow: hidden; }
.table-head { display: grid; grid-template-columns: 1.2fr 1fr 1fr 1fr 1fr 100px; padding: 10px 16px; border-bottom: 1px solid #eef2f7; color: #6b7280; }
.table-rows .row { display: grid; grid-template-columns: 1.2fr 1fr 1fr 1fr 1fr 100px; padding: 12px 16px; align-items: center; border-bottom: 1px dashed #eef2f7; }
.badge { padding: 4px 8px; border-radius: 9999px; font-size: 12px; }
.badge.完成课程 { background: #dcfce7; color: #166534; }
.badge.课程中 { background: #fef3c7; color: #92400e; }
.badge.未完成 { background: #fee2e2; color: #991b1b; }
.link { background: transparent; border: none; color: var(--primary, #8b5cf6); cursor: pointer; }
.table-foot { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; }
.pager { display: flex; gap: 8px; }

.chart { padding: 14px 16px; }
.chart-title { color: #374151; margin-bottom: 8px; }
.chart-box { height: 260px; border-radius: 12px; background: #fff; box-shadow: inset 0 0 0 1px #eef2f7; }

.profile { display: flex; flex-direction: column; gap: 16px; }
.profile-card { padding: 16px; background: #FEF3C7; border-radius: 16px; }
.profile-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.profile-title { font-weight: 700; color: #111827; font-size: 16px; }
.edit-link { background: transparent; border: none; color: #3B82F6; cursor: pointer; font-size: 14px; }
.edit-link:hover { text-decoration: underline; }
.profile-inner { background: #fff; border-radius: 16px; padding: 16px; box-shadow: inset 0 0 0 1px #e5e7eb; }
.avatar { width: 72px; height: 72px; border-radius: 50%; background: #e5e7eb; margin: 8px auto 12px; }
.profile-table { display: grid; }
.profile-row { display: grid; grid-template-columns: 120px 1fr; align-items: center; height: 40px; border-bottom: 1px solid #E5E7EB; }
.profile-row:last-child { border-bottom: none; }
.label { color: #6B7280; font-size: 13px; }
.value { color: #111827; font-weight: 600; font-size: 14px; }

.metrics-card { padding: 14px 16px; }
.section-title { font-weight: 600; color: #374151; margin-bottom: 8px; }
.metric { display: grid; grid-template-columns: 120px 1fr 60px; align-items: center; gap: 8px; margin: 8px 0; }
.bar-wrap { height: 10px; background: #f1f5f9; border-radius: 9999px; overflow: hidden; }
.bar-wrap .bar { height: 100%; border-radius: 9999px; }

.quick-actions { padding: 14px 16px; display: grid; gap: 8px; }

@media (max-width: 960px) {
  .grid { grid-template-columns: 1fr; }
  .filters-grid { grid-template-columns: 1fr; }
  .field.actions { justify-content: flex-start; }
}
</style>

<script lang="ts">
export default {}
</script>
