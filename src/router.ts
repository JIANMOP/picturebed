import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/upload',
    },
    {
      path: '/upload',
      name: 'upload',
      component: () => import('./components/upload/UploadPage.vue'),
    },
    {
      path: '/history',
      name: 'history',
      component: () => import('./components/history/HistoryPage.vue'),
    },
    {
      path: '/stats',
      name: 'stats',
      component: () => import('./components/stats/StatsPage.vue'),
    },
    {
      path: '/config',
      name: 'config',
      component: () => import('./components/config/ConfigPage.vue'),
    },
  ],
})

export default router
