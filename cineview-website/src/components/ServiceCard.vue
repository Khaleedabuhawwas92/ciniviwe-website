<script setup>
defineProps({
  service: { type: Object, required: true },
  index: { type: Number, default: 0 },
})
</script>

<template>
  <article
    class="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-navy-100 bg-white p-6 shadow-soft transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift lg:p-7"
  >
    <div
      aria-hidden="true"
      class="absolute inset-x-0 top-0 h-0.5 origin-right scale-x-0 bg-linear-to-l from-brand-400 to-indigo-glow transition-transform duration-500 group-hover:scale-x-100"
    />
    <div class="flex items-start justify-between">
      <span
        class="flex size-12 items-center justify-center rounded-xl border border-brand-100 bg-brand-50 text-brand-700 transition-colors duration-300 group-hover:border-brand-400 group-hover:bg-brand-400 group-hover:text-navy-950"
      >
        <component :is="service.icon" :size="22" :stroke-width="1.75" aria-hidden="true" />
      </span>
      <span class="text-xs font-bold text-navy-300 tabular-nums" dir="ltr" aria-hidden="true">
        {{ String(index + 1).padStart(2, '0') }}
      </span>
    </div>
    <h3 class="mt-6 text-lg font-bold text-navy-950">{{ service.title }}</h3>
    <p class="mt-2.5 text-[0.95rem] leading-7 text-navy-600">{{ service.description }}</p>
  </article>
</template>
