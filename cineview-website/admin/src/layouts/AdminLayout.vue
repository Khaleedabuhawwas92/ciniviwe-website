<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppSidebar from '@/components/AppSidebar.vue'
import AppTopbar from '@/components/AppTopbar.vue'
import ChangePasswordModal from '@/components/ChangePasswordModal.vue'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

const auth = useAuthStore()
const toast = useToastStore()
const router = useRouter()
const route = useRoute()

const sidebarOpen = ref(false)
const passwordOpen = ref(false)

watch(() => route.fullPath, () => (sidebarOpen.value = false))

// Close the mobile drawer with Escape, and when switching to the desktop layout.
const mq = window.matchMedia('(min-width: 64rem)')
const onBreakpoint = (e) => e.matches && (sidebarOpen.value = false)
const onKeydown = (e) => e.key === 'Escape' && (sidebarOpen.value = false)
onMounted(() => {
  mq.addEventListener('change', onBreakpoint)
  document.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  mq.removeEventListener('change', onBreakpoint)
  document.removeEventListener('keydown', onKeydown)
})

async function logout() {
  try {
    await auth.logout()
  } catch {
    // The local session is cleared even if the server could not be reached.
  }
  toast.info('تم تسجيل الخروج')
  router.replace({ name: 'login' })
}
</script>

<template>
  <div class="min-h-dvh">
    <a href="#admin-main" class="sr-only z-[100] rounded-lg bg-white px-4 py-2 font-bold focus:not-sr-only focus:fixed focus:start-4 focus:top-4">
      تخطَّ إلى المحتوى
    </a>

    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" @logout="logout" />
    <Transition enter-active-class="transition-opacity duration-200" enter-from-class="opacity-0" leave-active-class="transition-opacity duration-150" leave-to-class="opacity-0">
      <div v-if="sidebarOpen" class="fixed inset-0 z-40 bg-navy-950/50 lg:hidden" aria-hidden="true" @click="sidebarOpen = false" />
    </Transition>

    <div class="lg:ps-68">
      <AppTopbar :sidebar-open="sidebarOpen" @toggle-sidebar="sidebarOpen = !sidebarOpen" @change-password="passwordOpen = true" @logout="logout" />
      <main id="admin-main" tabindex="-1" class="mx-auto w-full max-w-[1440px] px-4 py-6 outline-none sm:px-6 lg:py-8">
        <RouterView />
      </main>
    </div>

    <ChangePasswordModal :open="passwordOpen" @close="passwordOpen = false" />
  </div>
</template>
