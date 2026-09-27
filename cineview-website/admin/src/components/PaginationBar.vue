<script setup>
import { computed } from 'vue'
import { ChevronRight, ChevronLeft } from 'lucide-vue-next'
import { formatNumber } from '@/utils/format'

const props = defineProps({
  page: { type: Number, required: true },
  pages: { type: Number, required: true },
  total: { type: Number, required: true },
  limit: { type: Number, required: true },
})
const emit = defineEmits(['change'])

const from = computed(() => (props.total ? (props.page - 1) * props.limit + 1 : 0))
const to = computed(() => Math.min(props.page * props.limit, props.total))

/** Compact page list: 1 … 4 5 6 … 20 */
const items = computed(() => {
  const { page, pages } = props
  const set = new Set([1, pages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pages))
  const sorted = [...set].sort((a, b) => a - b)
  const out = []
  sorted.forEach((p, i) => {
    if (i && p - sorted[i - 1] > 1) out.push('…' + p)
    out.push(p)
  })
  return out
})
</script>

<template>
  <nav class="flex flex-wrap items-center justify-between gap-3 text-sm" aria-label="التنقل بين الصفحات">
    <p class="text-navy-500">
      عرض <span class="font-bold text-navy-800 tabular-nums">{{ formatNumber(from) }}–{{ formatNumber(to) }}</span>
      من <span class="font-bold text-navy-800 tabular-nums">{{ formatNumber(total) }}</span>
    </p>
    <div v-if="pages > 1" class="flex items-center gap-1">
      <button
        type="button"
        class="flex size-9 items-center justify-center rounded-lg text-navy-600 hover:bg-navy-100 disabled:opacity-40 disabled:hover:bg-transparent"
        :disabled="page <= 1"
        aria-label="الصفحة السابقة"
        @click="emit('change', page - 1)"
      >
        <ChevronRight :size="18" aria-hidden="true" />
      </button>
      <template v-for="item in items" :key="item">
        <span v-if="typeof item === 'string'" class="px-1 text-navy-400" aria-hidden="true">…</span>
        <button
          v-else
          type="button"
          :aria-current="item === page ? 'page' : undefined"
          :class="[
            'min-w-9 rounded-lg px-2 py-1.5 font-bold tabular-nums',
            item === page ? 'bg-navy-900 text-white' : 'text-navy-600 hover:bg-navy-100',
          ]"
          @click="emit('change', item)"
        >
          {{ item }}
        </button>
      </template>
      <button
        type="button"
        class="flex size-9 items-center justify-center rounded-lg text-navy-600 hover:bg-navy-100 disabled:opacity-40 disabled:hover:bg-transparent"
        :disabled="page >= pages"
        aria-label="الصفحة التالية"
        @click="emit('change', page + 1)"
      >
        <ChevronLeft :size="18" aria-hidden="true" />
      </button>
    </div>
  </nav>
</template>
