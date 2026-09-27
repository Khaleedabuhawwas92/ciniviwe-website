<script setup>
import { ArrowLeft } from 'lucide-vue-next'
import ProductMockup from '@/components/mockups/ProductMockup.vue'

/** Portfolio project card. `wide` shows image and text side by side (used when there is one project). */
defineProps({
  project: { type: Object, required: true },
  wide: { type: Boolean, default: false },
})
</script>

<template>
  <article
    :class="[
      'group relative grid h-full overflow-hidden rounded-3xl border border-navy-100 bg-white shadow-soft transition duration-300 hover:shadow-lift',
      wide ? 'lg:grid-cols-2' : '',
    ]"
  >
    <div class="relative overflow-hidden bg-navy-950 p-6 sm:p-10">
      <div aria-hidden="true" class="aurora absolute inset-0 opacity-70" />
      <img
        v-if="project.image"
        :src="project.image"
        :alt="`لقطة شاشة من ${project.title}`"
        loading="lazy"
        decoding="async"
        width="1200"
        height="825"
        class="relative aspect-[16/11] w-full rounded-xl object-cover transition-transform duration-500 group-hover:scale-[1.02]"
      />
      <ProductMockup
        v-else
        :label="`واجهة توضيحية لمشروع ${project.title}`"
        class="relative mx-auto max-w-md transition-transform duration-500 group-hover:scale-[1.02]"
      />
    </div>

    <div class="flex flex-col p-6 sm:p-8 lg:p-10">
      <p class="self-start rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700" dir="ltr">
        {{ project.type }}
      </p>
      <h3 class="mt-5 text-2xl font-bold text-navy-950">{{ project.title }}</h3>
      <p class="mt-3 text-base leading-8 text-navy-600">{{ project.description }}</p>

      <ul v-if="project.tags?.length" class="mt-6 flex flex-wrap gap-2" aria-label="مجالات المشروع">
        <li
          v-for="tag in project.tags"
          :key="tag"
          class="rounded-lg border border-navy-100 bg-navy-50/70 px-3 py-1 text-sm font-semibold text-navy-700"
        >
          {{ tag }}
        </li>
      </ul>

      <RouterLink
        v-if="project.link"
        :to="project.link"
        class="mt-auto inline-flex items-center gap-2 self-start pt-8 font-bold text-brand-700 transition-colors hover:text-brand-600"
      >
        عرض تفاصيل المشروع
        <span class="sr-only">: {{ project.title }}</span>
        <ArrowLeft :size="17" class="transition-transform group-hover:-translate-x-1" aria-hidden="true" />
      </RouterLink>
    </div>
  </article>
</template>
