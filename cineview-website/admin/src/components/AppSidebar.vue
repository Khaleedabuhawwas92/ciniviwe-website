<script setup>
import { computed } from 'vue'
import { LayoutDashboard, Inbox, Briefcase, Package, Settings, UserCog, ScrollText, LogOut, X } from 'lucide-vue-next'
import BrandMark from '@/components/BrandMark.vue'
import { useAuthStore } from '@/stores/auth'

defineProps({ open: { type: Boolean, default: false } })
const emit = defineEmits(['close', 'logout'])
const auth = useAuthStore()

const groups = computed(() => [
  {
    label: 'الرئيسية',
    items: [
      { to: { name: 'dashboard' }, name: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
      { to: { name: 'contacts' }, name: 'contacts', label: 'طلبات التواصل', icon: Inbox },
    ],
  },
  {
    label: 'قريباً',
    items: [
      { to: { name: 'clients' }, name: 'clients', label: 'العملاء', icon: Briefcase, soon: true },
      { to: { name: 'services' }, name: 'services', label: 'الخدمات', icon: Package, soon: true },
      { to: { name: 'settings' }, name: 'settings', label: 'إعدادات الموقع', icon: Settings, soon: true },
    ],
  },
  {
    label: 'الإدارة',
    items: [
      auth.isSuperAdmin && { to: { name: 'admins' }, name: 'admins', label: 'المستخدمون', icon: UserCog },
      { to: { name: 'audit' }, name: 'audit', label: 'سجل النشاط', icon: ScrollText },
    ].filter(Boolean),
  },
])
</script>

<template>
  <aside
    id="admin-sidebar"
    :class="[
      'fixed inset-y-0 start-0 z-50 flex w-68 flex-col bg-navy-950 text-navy-200 transition-[transform,visibility] duration-200 lg:z-30',
      !open && 'max-lg:invisible max-lg:rtl:translate-x-full max-lg:ltr:-translate-x-full',
    ]"
    aria-label="القائمة الجانبية"
  >
    <div class="flex h-16 items-center justify-between gap-3 border-b border-white/[0.06] px-5">
      <RouterLink :to="{ name: 'dashboard' }" class="flex items-center gap-3 rounded-lg" @click="emit('close')">
        <BrandMark :size="34" />
        <span class="leading-tight">
          <span class="block text-[0.95rem] font-extrabold text-white">سينيفيو</span>
          <span class="block text-[0.68rem] font-semibold text-navy-400">لوحة الإدارة</span>
        </span>
      </RouterLink>
      <button type="button" class="rounded-lg p-1.5 text-navy-400 hover:bg-white/5 hover:text-white lg:hidden" aria-label="إغلاق القائمة" @click="emit('close')">
        <X :size="20" aria-hidden="true" />
      </button>
    </div>

    <nav class="scrollbar-thin flex-1 overflow-y-auto px-3 py-4" aria-label="أقسام لوحة الإدارة">
      <div v-for="group in groups" :key="group.label" class="mb-5">
        <p class="mb-1.5 px-3 text-[0.68rem] font-bold tracking-wide text-navy-500">{{ group.label }}</p>
        <ul class="space-y-0.5">
          <li v-for="item in group.items" :key="item.name">
            <RouterLink
              :to="item.to"
              class="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors"
              :class="
                $route.name === item.name || $route.meta.parent === item.name
                  ? 'bg-white/[0.08] text-white'
                  : 'text-navy-300 hover:bg-white/[0.04] hover:text-white'
              "
              :aria-current="$route.name === item.name ? 'page' : undefined"
              @click="emit('close')"
            >
              <component
                :is="item.icon"
                :size="18"
                :class="$route.name === item.name || $route.meta.parent === item.name ? 'text-brand-300' : 'text-navy-400 group-hover:text-navy-200'"
                aria-hidden="true"
              />
              <span class="flex-1">{{ item.label }}</span>
              <span v-if="item.soon" class="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[0.62rem] font-bold text-navy-400">قريباً</span>
            </RouterLink>
          </li>
        </ul>
      </div>
    </nav>

    <div class="border-t border-white/[0.06] p-3">
      <button
        type="button"
        class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-navy-300 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
        @click="emit('logout')"
      >
        <LogOut :size="18" class="rtl:-scale-x-100" aria-hidden="true" />
        تسجيل الخروج
      </button>
    </div>
  </aside>
</template>
