import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AdminLayout from '@/layouts/AdminLayout.vue'
import LoginPage from '@/pages/LoginPage.vue'

const routes = [
  { path: '/login', name: 'login', component: LoginPage, meta: { public: true, title: 'تسجيل الدخول' } },
  {
    path: '/',
    component: AdminLayout,
    children: [
      { path: '', name: 'dashboard', component: () => import('@/pages/DashboardPage.vue'), meta: { title: 'لوحة التحكم' } },
      { path: 'contacts', name: 'contacts', component: () => import('@/pages/ContactsPage.vue'), meta: { title: 'طلبات التواصل' } },
      {
        path: 'contacts/:id',
        name: 'contact',
        component: () => import('@/pages/ContactDetailsPage.vue'),
        meta: { title: 'تفاصيل الطلب', parent: 'contacts' },
      },
      {
        path: 'admins',
        name: 'admins',
        component: () => import('@/pages/AdminsPage.vue'),
        meta: { title: 'المستخدمون', roles: ['SUPER_ADMIN'] },
      },
      { path: 'audit', name: 'audit', component: () => import('@/pages/AuditLogPage.vue'), meta: { title: 'سجل النشاط' } },
      // Future sections — clean placeholder, no fake functionality
      { path: 'clients', name: 'clients', component: () => import('@/pages/ComingSoonPage.vue'), meta: { title: 'العملاء', soon: true } },
      { path: 'services', name: 'services', component: () => import('@/pages/ComingSoonPage.vue'), meta: { title: 'الخدمات', soon: true } },
      { path: 'settings', name: 'settings', component: () => import('@/pages/ComingSoonPage.vue'), meta: { title: 'إعدادات الموقع', soon: true } },
      { path: '403', name: 'forbidden', component: () => import('@/pages/ForbiddenPage.vue'), meta: { title: 'غير مصرح' } },
      { path: ':pathMatch(.*)*', name: 'not-found', component: () => import('@/pages/NotFoundPage.vue'), meta: { title: 'الصفحة غير موجودة' } },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: (_to, _from, saved) => saved || { top: 0 },
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.init()

  if (to.meta.public) {
    return auth.isAuthenticated ? { name: 'dashboard' } : true
  }
  if (!auth.isAuthenticated) {
    return { name: 'login', query: to.fullPath !== '/' ? { redirect: to.fullPath } : {} }
  }
  if (to.meta.roles && !to.meta.roles.includes(auth.admin.role)) {
    return { name: 'forbidden' }
  }
  return true
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} | لوحة إدارة سينيفيو` : 'لوحة إدارة سينيفيو'
})

export default router
