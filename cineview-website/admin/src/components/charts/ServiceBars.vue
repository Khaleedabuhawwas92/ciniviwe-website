<script setup>
import { computed } from 'vue'
import { serviceLabel } from '@/utils/labels'
import { formatNumber } from '@/utils/format'

/**
 * Requests per service (single series): horizontal bars sorted by count, value at the tip,
 * label in text color, a list structure that screen readers read as "label: value".
 */
const props = defineProps({
  items: { type: Array, required: true }, // [{ service, count }]
})

const total = computed(() => props.items.reduce((sum, item) => sum + item.count, 0))
const max = computed(() => Math.max(1, ...props.items.map((item) => item.count)))
const rows = computed(() =>
  [...props.items]
    .sort((a, b) => b.count - a.count)
    .map((item) => ({
      ...item,
      label: serviceLabel(item.service),
      width: item.count ? Math.max(2, (item.count / max.value) * 100) : 0,
      share: total.value ? Math.round((item.count / total.value) * 100) : 0,
    })),
)
</script>

<template>
  <ul class="space-y-3.5">
    <li v-for="row in rows" :key="row.service" class="group" :title="`${row.label}: ${row.count} (${row.share}%)`">
      <div class="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
        <span class="font-semibold text-navy-800">{{ row.label }}</span>
        <span class="text-navy-500 tabular-nums">
          <span class="font-bold text-navy-900">{{ formatNumber(row.count) }}</span>
          <span v-if="total" class="ms-1 text-xs">({{ row.share }}%)</span>
        </span>
      </div>
      <div class="h-2.5 rounded-full bg-navy-50" aria-hidden="true">
        <div class="h-full rounded-full bg-brand-400 transition-[width] duration-500 group-hover:bg-brand-500" :style="{ width: `${row.width}%` }" />
      </div>
    </li>
  </ul>
</template>
