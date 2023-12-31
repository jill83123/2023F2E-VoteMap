import { createRouter, createWebHashHistory } from 'vue-router';

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/index',
      component: () => import('@/views/IndexView.vue'),
    },
    {
      path: '/vote-count',
      component: () => import('@/views/VoteCountView.vue'),
    },
  ],
});

export default router;
