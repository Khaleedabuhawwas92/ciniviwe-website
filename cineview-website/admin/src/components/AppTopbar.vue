<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Menu, ChevronDown, KeyRound, LogOut } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { ROLE_LABELS } from '@/utils/labels'

defineProps({ sidebarOpen: { type: Boolean, default: false } })
const emit = defineEmits(['toggle-sidebar', 'change-password', 'logout'])
const auth = useAuthStore()

const menuOpen = ref(false)
const menuRoot = ref(null)
const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join(' ')

function onDocumentClick(event) {
  if (menuRoot.value && !menuRoot.value.contains(event.target)) menuOpen.value = false
}
function onKeydown(event) {
  if (event.key === 'Escape') menuOpen.value = false
}
onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKeydown)
})

function choose(event) {
  menuOpen.value = false
  emit(event)
}
</script>

<template>
  <header class="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-navy-100 bg-white/90 px-4 backdrop-blur sm:px-6">
    <button
      type="button"
      class="flex size-10 items-center justify-center rounded-lg text-navy-600 hover:bg-navy-100 lg:hidden"
      aria-controls="admin-sidebar"
      :aria-expanded="sidebarOpen"
      aria-label="فتح القائمة"
      @click="emit('toggle-sidebar')"
    >
      <Menu :size="20" aria-hidden="true" />
    </button>

    <p class="truncate text-sm font-bold text-navy-900">{{ $route.meta.title }}</p>

    <div ref="menuRoot" class="relative ms-auto">
      <button
        type="button"
        class="flex items-center gap-2.5 rounded-xl py-1.5 ps-1.5 pe-2.5 hover:bg-navy-50"
        aria-haspopup="menu"
        :aria-expanded="menuOpen"
        @click="menuOpen = !menuOpen"
      >
        <span class="flex size-8 items-center justify-center rounded-lg bg-navy-900 text-xs font-bold text-brand-300" aria-hidden="true">
          {{ initials(auth.admin?.fullName) }}
        </span>
        <span class="hidden text-start leading-tight sm:block">
          <span class="block text-sm font-bold text-navy-900">{{ auth.admin?.fullName }}</span>
          <span class="block text-xs text-navy-500">{{ ROLE_LABELS[auth.admin?.role] }}</span>
        </span>
        <ChevronDown :size="16" class="text-navy-400" aria-hidden="true" />
      </button>

      <Transition enter-active-class="transition duration-100" enter-from-class="opacity-0 -translate-y-1" leave-active-class="transition duration-75" leave-to-class="opacity-0">
        <div v-if="menuOpen" role="menu" class="absolute end-0 top-full mt-2 w-60 overflow-hidden rounded-xl border border-navy-100 bg-white py-1.5 shadow-pop">
          <div class="border-b border-navy-100 px-4 pt-1.5 pb-3">
            <p class="truncate text-sm font-bold text-navy-900">{{ auth.admin?.fullName }}</p>
            <p class="truncate text-xs text-navy-500" dir="ltr" style="text-align: right">{{ auth.admin?.email }}</p>
          </div>
          <button role="menuitem" type="button" class="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-navy-700 hover:bg-navy-50" @click="choose('change-password')">
            <KeyRound :size="16" aria-hidden="true" />
            تغيير كلمة المرور
          </button>
          <button role="menuitem" type="button" class="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50" @click="choose('logout')">
            <LogOut :size="16" class="rtl:-scale-x-100" aria-hidden="true" />
            تسجيل الخروج
          </button>
        </div>
      </Transition>
    </div>
  </header>
</template>
