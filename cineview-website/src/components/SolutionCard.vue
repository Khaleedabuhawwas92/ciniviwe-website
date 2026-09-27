<script setup>
import { ArrowLeft } from 'lucide-vue-next'

// Compact card for additional (non-featured) products listed in src/data/solutions.js.
defineProps({
  solution: { type: Object, required: true },
})
</script>

<template>
  <article
    class="group relative flex h-full flex-col rounded-2xl border border-navy-100 bg-white p-7 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift"
  >
    <div class="flex flex-wrap gap-2">
      <span
        v-for="platform in solution.platforms"
        :key="platform"
        class="rounded-full bg-navy-50 px-2.5 py-0.5 text-xs font-semibold text-navy-600"
        dir="ltr"
      >
        {{ platform }}
      </span>
    </div>
    <h3 class="mt-5 text-xl font-bold text-navy-950">{{ solution.name }}</h3>
    <p class="mt-3 flex-1 text-[0.95rem] leading-7 text-navy-600">{{ solution.summary || solution.description }}</p>
    <RouterLink
      :to="`/solutions/${solution.slug}`"
      class="mt-6 inline-flex items-center gap-2 self-start font-bold text-brand-700 after:absolute after:inset-0 after:rounded-2xl"
    >
      اكتشف النظام
      <ArrowLeft :size="16" class="transition-transform group-hover:-translate-x-1" aria-hidden="true" />
    </RouterLink>
  </article>
</template>
