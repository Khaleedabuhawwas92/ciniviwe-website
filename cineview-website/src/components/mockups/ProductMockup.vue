<script setup>
import { Package, ScanBarcode, Warehouse, ChartColumn, Minus, Square, X } from 'lucide-vue-next'

/**
 * Illustrative product mockup: a Windows app window behind a web browser window.
 * Decorative placeholder until real screenshots are available.
 */
defineProps({
  label: { type: String, default: 'واجهة توضيحية للنظام' },
})

const tiles = [Package, ScanBarcode, Warehouse, ChartColumn]

const rows = [
  { w: 'w-20', q: 'w-8', tone: 'bg-emerald-400/70' },
  { w: 'w-16', q: 'w-6', tone: 'bg-amber-400/70' },
  { w: 'w-24', q: 'w-10', tone: 'bg-emerald-400/70' },
  { w: 'w-14', q: 'w-7', tone: 'bg-emerald-400/70' },
]
</script>

<template>
  <div class="relative isolate aspect-[16/11] w-full" role="img" :aria-label="label">
    <div aria-hidden="true" class="absolute inset-0 -z-10 rounded-3xl bg-grid-dark mask-radial opacity-80" />
    <div aria-hidden="true" class="absolute inset-[15%] -z-10 rounded-full bg-brand-400/15 blur-3xl" />

    <!-- Windows desktop window (back) -->
    <div
      aria-hidden="true"
      class="absolute start-0 top-0 w-[68%] overflow-hidden rounded-lg border border-white/10 bg-navy-800 shadow-2xl"
    >
      <div class="flex items-center justify-between bg-navy-950/70 px-3 py-1.5" dir="ltr">
        <span class="flex items-center gap-1.5 text-[0.55rem] font-semibold text-navy-300">
          <span class="size-2 rounded-sm bg-brand-400" />
          Inventory — Windows
        </span>
        <span class="flex gap-2.5 text-navy-400">
          <Minus :size="9" />
          <Square :size="8" />
          <X :size="9" />
        </span>
      </div>
      <div class="grid grid-cols-4 gap-1.5 p-2.5">
        <span v-for="(icon, i) in tiles" :key="i" class="flex h-9 flex-col items-center justify-center gap-1 rounded-md bg-white/[0.05] text-brand-300">
          <component :is="icon" :size="11" />
          <span class="h-1 w-6 rounded-full bg-white/15" />
        </span>
      </div>
      <div class="space-y-1.5 px-2.5 pb-3">
        <span v-for="n in 4" :key="n" class="flex items-center gap-2">
          <span class="h-1.5 w-full rounded-full bg-white/[0.07]" />
        </span>
      </div>
    </div>

    <!-- Browser window (front) -->
    <div
      aria-hidden="true"
      class="absolute end-0 bottom-0 w-[80%] overflow-hidden rounded-xl border border-white/10 bg-navy-900 shadow-[0_24px_60px_-18px_rgb(0_0_0/0.75)]"
    >
      <div class="flex items-center gap-2 border-b border-white/[0.07] bg-navy-950/60 px-3 py-2">
        <span class="flex gap-1" dir="ltr">
          <span class="size-1.5 rounded-full bg-white/20" />
          <span class="size-1.5 rounded-full bg-white/20" />
          <span class="size-1.5 rounded-full bg-white/20" />
        </span>
        <span class="mx-auto h-3.5 w-2/5 rounded bg-white/[0.06]" />
      </div>
      <div class="flex">
        <div class="w-[22%] space-y-1.5 border-e border-white/[0.06] p-2.5">
          <span class="block h-1.5 w-4/5 rounded-full bg-brand-400/60" />
          <span v-for="n in 5" :key="n" class="block h-1.5 w-3/5 rounded-full bg-white/10" />
        </div>
        <div class="flex-1 p-3">
          <div class="grid grid-cols-3 gap-1.5">
            <span v-for="n in 3" :key="n" class="rounded-md border border-white/[0.06] bg-white/[0.03] p-2">
              <span class="block h-1 w-8 rounded-full bg-white/15" />
              <span :class="['mt-1.5 block h-2 rounded-full', n === 1 ? 'w-10 bg-brand-300/80' : 'w-7 bg-white/25']" />
            </span>
          </div>
          <div class="mt-2 overflow-hidden rounded-md border border-white/[0.06]">
            <div
              v-for="(row, i) in rows"
              :key="i"
              :class="['flex items-center gap-2 px-2 py-1.5', i > 0 && 'border-t border-white/[0.05]']"
            >
              <span class="size-3 shrink-0 rounded-sm bg-white/[0.08]" />
              <span :class="['h-1.5 rounded-full bg-white/20', row.w]" />
              <span :class="['ms-auto h-1.5 rounded-full bg-white/10', row.q]" />
              <span :class="['size-1.5 rounded-full', row.tone]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
