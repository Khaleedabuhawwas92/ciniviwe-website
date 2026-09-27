import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import { findSolution } from '@/data/solutions'
import { HEADER_OFFSET, prefersReducedMotion } from '@/utils/scroll'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage,
  },
  {
    path: '/solutions/:slug',
    name: 'solution',
    component: () => import('@/pages/SolutionDetailsPage.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/pages/NotFoundPage.vue'),
    meta: { title: 'الصفحة غير موجودة | سينيفيو', noindex: true },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) {
      const behavior = prefersReducedMotion() ? 'auto' : 'smooth'
      const target = to.hash === '#home' ? { top: 0, behavior } : { el: to.hash, top: HEADER_OFFSET, behavior }
      // Coming from another page, wait for the home page to render before scrolling.
      if (from.path === to.path) return target
      return new Promise((resolve) => setTimeout(() => resolve(target), 80))
    }
    return { top: 0 }
  },
})

// Per-product SEO + 404 for unknown product slugs.
router.beforeEach((to) => {
  if (to.name !== 'solution') return
  const solution = findSolution(to.params.slug)
  if (!solution) return { name: 'not-found', params: { pathMatch: to.path.substring(1).split('/') } }
  to.meta.title = `${solution.name} | سينيفيو`
  to.meta.description = solution.description
})

export default router
