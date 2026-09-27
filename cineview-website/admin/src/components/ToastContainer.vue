<script setup>
import { CircleCheck, CircleAlert, Info, X } from 'lucide-vue-next'
import { useToastStore } from '@/stores/toast'

const toast = useToastStore()
const icons = { success: CircleCheck, error: CircleAlert, info: Info }
const tones = {
  success: 'text-emerald-600',
  error: 'text-rose-600',
  info: 'text-brand-600',
}
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:end-6 sm:bottom-6 sm:w-96 sm:items-stretch sm:px-0"
    aria-live="polite"
    role="status"
  >
    <TransitionGroup
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-2 opacity-0"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="opacity-0"
    >
      <div
        v-for="item in toast.toasts"
        :key="item.id"
        class="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border border-navy-100 bg-white px-4 py-3 text-sm font-semibold text-navy-900 shadow-pop"
      >
        <component :is="icons[item.type]" :size="18" :class="['shrink-0', tones[item.type]]" aria-hidden="true" />
        <span class="flex-1">{{ item.message }}</span>
        <button
          type="button"
          class="rounded-md p-1 text-navy-400 hover:bg-navy-50 hover:text-navy-700"
          aria-label="إغلاق الإشعار"
          @click="toast.dismiss(item.id)"
        >
          <X :size="14" aria-hidden="true" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
