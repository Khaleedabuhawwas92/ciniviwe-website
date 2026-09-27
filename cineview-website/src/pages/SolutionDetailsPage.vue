<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, ChevronLeft, Globe, Monitor } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import ProductMockup from '@/components/mockups/ProductMockup.vue'
import CtaSection from '@/sections/CtaSection.vue'
import { findSolution } from '@/data/solutions'

// The router guard guarantees the slug exists before this page renders.
const route = useRoute()
const solution = computed(() => findSolution(route.params.slug))
const demoLink = computed(() => ({ path: '/', query: { service: solution.value.contactValue }, hash: '#contact' }))

const platformInfo = {
  Web: { icon: Globe, title: 'نسخة الويب', text: 'وصول آمن من المتصفح على أي جهاز ومن أي مكان.' },
  Windows: { icon: Monitor, title: 'تطبيق Windows', text: 'تطبيق سطح مكتب سريع للعمل اليومي داخل المؤسسة.' },
}
</script>

<template>
  <article v-if="solution">
    <!-- Header -->
    <header class="relative isolate overflow-hidden bg-navy-950 pt-32 pb-20 lg:pt-40 lg:pb-24">
      <div aria-hidden="true" class="absolute inset-0 -z-10">
        <div class="aurora absolute inset-0" />
        <div class="bg-grid-dark mask-fade-y absolute inset-0" />
      </div>

      <div class="container-page grid items-center gap-14 lg:grid-cols-2">
        <div>
          <nav aria-label="مسار التنقل" class="hero-enter">
            <ol class="flex items-center gap-2 text-sm text-navy-300">
              <li><RouterLink to="/" class="hover:text-white">الرئيسية</RouterLink></li>
              <li aria-hidden="true"><ChevronLeft :size="14" /></li>
              <li><RouterLink :to="{ path: '/', hash: '#solutions' }" class="hover:text-white">حلولنا</RouterLink></li>
              <li aria-hidden="true"><ChevronLeft :size="14" /></li>
              <li aria-current="page" class="font-semibold text-white">{{ solution.name }}</li>
            </ol>
          </nav>

          <h1 class="hero-enter mt-7 text-4xl leading-tight font-black text-white sm:text-5xl" style="--d: 80ms">
            {{ solution.name }}
          </h1>
          <p class="hero-enter mt-2 font-semibold tracking-wide text-brand-300" style="--d: 120ms">{{ solution.nameEn }}</p>
          <p class="hero-enter mt-6 max-w-xl text-lg leading-9 text-navy-200" style="--d: 180ms">
            {{ solution.description }}
          </p>

          <div class="hero-enter mt-9 flex flex-col gap-3 sm:flex-row" style="--d: 260ms">
            <BaseButton :to="demoLink" size="lg">
              اطلب عرضاً توضيحياً
              <ArrowLeft :size="18" class="transition-transform group-hover:-translate-x-1" aria-hidden="true" />
            </BaseButton>
            <BaseButton :to="{ path: '/', hash: '#solutions' }" variant="secondary" size="lg">العودة إلى الحلول</BaseButton>
          </div>
        </div>

        <div class="hero-enter" style="--d: 200ms">
          <ProductMockup :label="`واجهة توضيحية لـ${solution.name}`" class="mx-auto max-w-xl" />
        </div>
      </div>
    </header>

    <!-- Features -->
    <section aria-labelledby="features-title" class="section-y bg-white">
      <div class="container-page">
        <SectionHeading
          eyebrow="المزايا"
          :title="solution.featuresTitle || 'مزايا النظام'"
          title-id="features-title"
          :subtitle="solution.featuresSubtitle"
        />
        <ul class="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <li
            v-for="(feature, i) in solution.features"
            :key="feature.title"
            v-reveal="(i % 3) * 70"
            class="group flex gap-4 rounded-2xl border border-navy-100 bg-white p-5 shadow-soft transition duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift"
          >
            <span
              class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-400 group-hover:text-navy-950"
            >
              <component :is="feature.icon" :size="20" :stroke-width="1.75" aria-hidden="true" />
            </span>
            <div>
              <h3 class="font-bold text-navy-950">{{ feature.title }}</h3>
              <p class="mt-1 text-sm leading-7 text-navy-600">{{ feature.text }}</p>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <!-- Platforms -->
    <section aria-labelledby="platforms-title" class="section-y bg-navy-50/60">
      <div class="container-page">
        <SectionHeading
          eyebrow="المنصات"
          title="اعمل من المنصة التي تناسب فريقك"
          title-id="platforms-title"
        />
        <ul class="mt-10 grid gap-5 md:grid-cols-2">
          <li
            v-for="platform in solution.platforms"
            :key="platform"
            v-reveal
            class="flex items-start gap-5 rounded-2xl border border-navy-100 bg-white p-6 shadow-soft sm:p-8"
          >
            <span class="flex size-12 shrink-0 items-center justify-center rounded-xl bg-navy-950 text-brand-300">
              <component :is="platformInfo[platform]?.icon || Globe" :size="22" :stroke-width="1.75" aria-hidden="true" />
            </span>
            <div>
              <h3 class="text-lg font-bold text-navy-950">{{ platformInfo[platform]?.title || platform }}</h3>
              <p class="mt-1.5 leading-7 text-navy-600">{{ platformInfo[platform]?.text }}</p>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <div class="bg-navy-50/60">
      <CtaSection />
    </div>
  </article>
</template>
