<script setup>
import SectionHeading from '@/components/ui/SectionHeading.vue'
import { advantages } from '@/data/highlights'
</script>

<template>
  <section
    id="why-cineview"
    aria-labelledby="why-title"
    class="section-y relative isolate overflow-hidden bg-navy-950"
  >
    <div aria-hidden="true" class="absolute inset-0 -z-10">
      <div class="bg-grid-dark mask-radial absolute inset-0" />
      <div class="absolute inset-x-0 top-0 mx-auto h-72 max-w-2xl rounded-full bg-brand-400/10 blur-3xl" />
    </div>

    <div class="container-page">
      <SectionHeading
        eyebrow="ما يميزنا"
        title="لماذا سينيفيو؟"
        title-id="why-title"
        subtitle="نجمع بين فهم احتياجات الأعمال والخبرة التقنية لنقدم أنظمة يعتمد عليها فريقك كل يوم."
        dark
        center
      />

      <div
        v-reveal="100"
        class="mt-14 overflow-hidden rounded-3xl border border-white/10 bg-white/10"
      >
        <ul class="grid gap-px sm:grid-cols-2 lg:grid-cols-4">
          <li
            v-for="item in advantages"
            :key="item.title"
            class="group relative bg-navy-950 p-6 transition-colors duration-300 hover:bg-navy-900 lg:p-7"
          >
            <span
              class="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-brand-300 transition duration-300 group-hover:border-brand-400/40 group-hover:shadow-glow"
            >
              <component :is="item.icon" :size="20" :stroke-width="1.75" aria-hidden="true" />
            </span>
            <h3 class="mt-5 font-bold text-white">{{ item.title }}</h3>
            <p class="mt-2 text-sm leading-7 text-navy-300">{{ item.text }}</p>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
