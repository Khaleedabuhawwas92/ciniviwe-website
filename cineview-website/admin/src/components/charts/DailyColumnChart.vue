<script setup>
import { computed, ref } from 'vue'
import { formatNumber, weekdayOf, dayMonthOf } from '@/utils/format'

/**
 * Requests per day (single series). Columns ≤ 24px, 4px rounded tops on one baseline,
 * value on each cap, hover tooltip, and a visually-hidden table for screen readers / keyboard users.
 */
const props = defineProps({
  days: { type: Array, required: true }, // [{ date: 'YYYY-MM-DD', count }]
  label: { type: String, default: 'الطلبات اليومية' },
})

const max = computed(() => Math.max(1, ...props.days.map((d) => d.count)))
const active = ref(null)
const PLOT_HEIGHT = 150
const height = (count) => (count ? Math.max(4, Math.round((count / max.value) * PLOT_HEIGHT)) : 0)
</script>

<template>
  <figure class="relative">
    <div class="flex h-[190px] items-end justify-between gap-1 border-b border-navy-100 px-1" aria-hidden="true">
      <div
        v-for="(day, i) in days"
        :key="day.date"
        class="group relative flex h-full flex-1 cursor-default flex-col items-center justify-end"
        @pointerenter="active = i"
        @pointerleave="active = null"
      >
        <span class="mb-1.5 text-xs font-bold text-navy-700 tabular-nums">{{ formatNumber(day.count) }}</span>
        <span
          :class="[
            'w-full max-w-6 rounded-t-[4px] transition-colors',
            active === i ? 'bg-brand-500' : 'bg-brand-400',
            i === days.length - 1 ? '' : 'opacity-90',
          ]"
          :style="{ height: `${height(day.count)}px` }"
        />
        <div
          v-if="active === i"
          class="pointer-events-none absolute bottom-full z-10 mb-2 rounded-lg bg-navy-950 px-3 py-2 text-center text-xs whitespace-nowrap text-white shadow-pop"
        >
          <span class="block font-semibold text-navy-300">{{ weekdayOf(day.date) }} {{ dayMonthOf(day.date) }}</span>
          <span class="mt-0.5 block font-bold">{{ formatNumber(day.count) }} طلب</span>
        </div>
      </div>
    </div>
    <div class="mt-2 flex justify-between gap-1 px-1 text-center" aria-hidden="true">
      <span v-for="(day, i) in days" :key="day.date" :class="['flex-1 text-[0.7rem] leading-tight', i === days.length - 1 ? 'font-bold text-navy-800' : 'text-navy-500']">
        {{ i === days.length - 1 ? 'اليوم' : weekdayOf(day.date) }}
        <span class="block text-navy-400">{{ dayMonthOf(day.date) }}</span>
      </span>
    </div>

    <table class="sr-only">
      <caption>{{ label }}</caption>
      <thead>
        <tr><th scope="col">اليوم</th><th scope="col">عدد الطلبات</th></tr>
      </thead>
      <tbody>
        <tr v-for="day in days" :key="day.date">
          <td>{{ weekdayOf(day.date) }} {{ dayMonthOf(day.date) }}</td>
          <td>{{ day.count }}</td>
        </tr>
      </tbody>
    </table>
  </figure>
</template>
