<script setup>
import { ArrowLeft, Monitor, Globe, Check } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import ProductMockup from '@/components/mockups/ProductMockup.vue'

defineProps({
  solution: { type: Object, required: true },
})

const platformIcons = { Web: Globe, Windows: Monitor }
</script>

<template>
  <article
    class="relative isolate overflow-hidden rounded-[1.75rem] border border-navy-800 bg-navy-950 shadow-[0_40px_80px_-40px_rgb(6_13_31/0.6)]"
  >
    <div aria-hidden="true" class="absolute inset-0 -z-10">
      <div class="aurora absolute inset-0 opacity-80" />
      <div class="bg-grid-dark mask-radial absolute inset-0" />
    </div>

    <div class="grid gap-10 p-6 sm:p-10 lg:grid-cols-12 lg:gap-12 lg:p-14">
      <div class="lg:col-span-7">
        <div class="flex flex-wrap items-center gap-3">
          <span class="rounded-full border border-brand-400/30 bg-brand-400/10 px-3 py-1 text-xs font-bold text-brand-300">
            {{ solution.badge }}
          </span>
          <span
            v-for="platform in solution.platforms"
            :key="platform"
            class="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-navy-100"
            dir="ltr"
          >
            <component :is="platformIcons[platform]" v-if="platformIcons[platform]" :size="13" aria-hidden="true" />
            {{ platform }}
          </span>
        </div>

        <h3 class="mt-6 text-2xl font-extrabold text-white sm:text-3xl">{{ solution.name }}</h3>
        <p class="mt-1.5 text-sm font-semibold tracking-wide text-navy-400">
          {{ solution.nameEn }}
        </p>
        <p class="mt-5 max-w-2xl text-base leading-8 text-navy-200">{{ solution.description }}</p>

        <ul class="mt-8 grid gap-x-6 gap-y-3.5 sm:grid-cols-2 xl:grid-cols-3">
          <li v-for="feature in solution.features" :key="feature.title" class="flex items-center gap-2.5 text-sm text-navy-100">
            <span class="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-400/15 text-brand-300">
              <Check :size="12" :stroke-width="3" aria-hidden="true" />
            </span>
            {{ feature.title }}
          </li>
        </ul>

        <div class="mt-10 flex flex-col gap-3 sm:flex-row">
          <BaseButton :to="`/solutions/${solution.slug}`">
            اكتشف النظام
            <ArrowLeft :size="17" class="transition-transform group-hover:-translate-x-1" aria-hidden="true" />
          </BaseButton>
          <BaseButton
            :to="{ path: '/', query: { service: solution.contactValue }, hash: '#contact' }"
            variant="secondary"
          >
            اطلب عرضاً توضيحياً
          </BaseButton>
        </div>
      </div>

      <div class="flex items-center lg:col-span-5">
        <ProductMockup :label="`واجهة توضيحية لـ${solution.name} على الويب وWindows`" class="mx-auto max-w-lg" />
      </div>
    </div>
  </article>
</template>
