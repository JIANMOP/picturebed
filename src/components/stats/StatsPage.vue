<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as db from '../../db/history-db'
import { BACKENDS } from '../../backends/registry'
import { formatSize } from '../../utils/format'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js'
import { Pie, Bar } from 'vue-chartjs'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

const stats = ref({ total: 0, totalSize: 0, byBackend: [] as any[], byDay: [] as any[] })

onMounted(async () => {
  stats.value = await db.getStats()
})

const pieData = () => ({
  labels: stats.value.byBackend.map((b) => BACKENDS.find((x) => x.id === b.backend)?.label || b.backend),
  datasets: [{
    data: stats.value.byBackend.map((b) => b.count),
    backgroundColor: [
      '#3B82F6', '#60A5FA', '#22C55E', '#F59E0B', '#EF4444',
      '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1',
      '#84CC16', '#06B6D4', '#D946EF', '#A855F7',
    ],
    borderWidth: 0,
  }],
})

const barData = () => ({
  labels: stats.value.byDay.slice(-30).map((d) => d.date.slice(5)),
  datasets: [{
    label: 'Uploads',
    data: stats.value.byDay.slice(-30).map((d) => d.count),
    backgroundColor: '#3B82F6',
    borderRadius: 6,
  }],
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#94A3B8', font: { size: 12 }, padding: 16 } } },
}

const barOptions: any = {
  ...chartOptions,
  scales: {
    x: { ticks: { color: '#64748B', maxTicksLimit: 10 }, grid: { display: false } },
    y: { ticks: { color: '#64748B' }, grid: { color: 'rgba(51,65,85,0.5)' }, beginAtZero: true },
  },
}
</script>

<template>
  <div class="stats-page">
    <div class="stats-cards">
      <div class="stat-card">
        <p class="stat-label">Total Uploads</p>
        <p class="stat-value">{{ stats.total.toLocaleString() }}</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Total Size</p>
        <p class="stat-value">{{ formatSize(stats.totalSize) }}</p>
      </div>
    </div>

    <div class="charts-grid">
      <div class="chart-box">
        <h3 class="chart-title">By Backend</h3>
        <div class="chart-wrap">
          <Pie v-if="stats.total > 0" :data="pieData()" :options="chartOptions" />
          <div v-else class="chart-empty">No data</div>
        </div>
      </div>
      <div class="chart-box">
        <h3 class="chart-title">Last 30 Days</h3>
        <div class="chart-wrap">
          <Bar v-if="stats.total > 0" :data="barData()" :options="barOptions" />
          <div v-else class="chart-empty">No data</div>
        </div>
      </div>
    </div>

    <div v-if="stats.byBackend.length > 0" class="table-box">
      <table class="data-table">
        <thead>
          <tr>
            <th>Backend</th>
            <th class="text-right">Uploads</th>
            <th class="text-right">Total Size</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="be in stats.byBackend" :key="be.backend">
            <td>{{ BACKENDS.find((b) => b.id === be.backend)?.label || be.backend }}</td>
            <td class="text-right">{{ be.count.toLocaleString() }}</td>
            <td class="text-right">{{ formatSize(be.size) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.stats-page {
  max-width: 900px;
  margin: 0 auto;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.stat-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 24px;
}

.stat-label {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-bottom: 8px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

@media (max-width: 640px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}

.chart-box {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 20px;
}

.chart-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 16px;
}

.chart-wrap {
  height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-empty {
  color: var(--color-text-muted);
  font-size: 13px;
}

.table-box {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  text-align: left;
  padding: 12px 20px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--color-border);
}

.data-table td {
  padding: 12px 20px;
  font-size: 13px;
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border);
}

.data-table tr:last-child td {
  border-bottom: none;
}

.data-table tr:hover td {
  background: var(--color-surface-raised);
}

.text-right {
  text-align: right;
}
</style>
