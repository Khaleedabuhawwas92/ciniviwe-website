<script setup>
import { LoaderCircle, CircleAlert, Inbox } from 'lucide-vue-next'

/** Loading / empty / error placeholder used inside cards and tables. */
defineProps({
  state: { type: String, default: 'loading', validator: (v) => ['loading', 'empty', 'error'].includes(v) },
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  icon: { type: [Object, Function], default: null },
})
defineEmits(['retry'])
</script>

<template>
  <div class="flex flex-col items-center justify-center px-6 py-14 text-center" :role="state === 'error' ? 'alert' : 'status'">
    <LoaderCircle v-if="state === 'loading'" :size="26" class="animate-spin text-brand-500" aria-hidden="true" />
    <span v-else :class="['flex size-12 items-center justify-center rounded-2xl', state === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-navy-50 text-navy-400']">
      <component :is="icon || (state === 'error' ? CircleAlert : Inbox)" :size="22" aria-hidden="true" />
    </span>
    <p v-if="state === 'loading'" class="mt-3 text-sm text-navy-500">{{ title || 'جارٍ التحميل...' }}</p>
    <template v-else>
      <p class="mt-4 font-bold text-navy-900">{{ title || (state === 'error' ? 'تعذّر تحميل البيانات' : 'لا توجد بيانات') }}</p>
      <p v-if="message" class="mt-1 max-w-sm text-sm leading-6 text-navy-500">{{ message }}</p>
      <button
        v-if="state === 'error'"
        type="button"
        class="mt-4 rounded-lg border border-navy-200 bg-white px-4 py-2 text-sm font-bold text-navy-800 hover:bg-navy-50"
        @click="$emit('retry')"
      >
        إعادة المحاولة
      </button>
      <slot />
    </template>
  </div>
</template>
