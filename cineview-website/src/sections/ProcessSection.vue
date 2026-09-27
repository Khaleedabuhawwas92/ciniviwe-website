<script setup>
import SectionHeading from '@/components/ui/SectionHeading.vue'
import { processSteps } from '@/data/process'
</script>

<template>
  <section id="process" aria-labelledby="process-title" class="section-y relative bg-white">
    <div class="container-page">
      <SectionHeading
        eyebrow="منهجية العمل"
        title="كيف نعمل؟"
        title-id="process-title"
        subtitle="خطوات واضحة ومنظمة من الفكرة حتى الإطلاق، مع تواصل مستمر في كل مرحلة."
      />

      <ol class="relative mt-14 grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3 lg:gap-y-14">
        <li
          v-for="(step, i) in processSteps"
          :key="step.title"
          v-reveal="(i % 3) * 90"
          class="group relative ps-16 lg:ps-0"
        >
          <!-- connector (mobile: vertical line; desktop: horizontal line) -->
          <span
            v-if="i < processSteps.length - 1"
            aria-hidden="true"
            class="absolute start-[1.35rem] top-12 bottom-[-2.5rem] w-px bg-linear-to-b from-brand-300 to-navy-100 md:hidden"
          />
          <span
            aria-hidden="true"
            class="absolute inset-x-0 top-[1.35rem] hidden h-px bg-linear-to-l from-brand-300/80 via-navy-100 to-transparent lg:block"
          />

          <div class="absolute start-0 top-0 lg:relative">
            <span
              class="relative z-10 flex size-11 items-center justify-center rounded-xl border border-navy-100 bg-white text-brand-700 shadow-soft transition duration-300 group-hover:border-brand-400 group-hover:bg-navy-950 group-hover:text-brand-300"
            >
              <component :is="step.icon" :size="20" :stroke-width="1.75" aria-hidden="true" />
            </span>
          </div>

          <div class="lg:mt-6">
            <p class="text-sm font-extrabold text-brand-700 tabular-nums">
              <span class="sr-only">الخطوة </span>{{ String(i + 1).padStart(2, '0') }}
            </p>
            <h3 class="mt-1 text-lg font-bold text-navy-950">{{ step.title }}</h3>
            <p class="mt-2 max-w-sm text-[0.95rem] leading-7 text-navy-600">{{ step.text }}</p>
          </div>
        </li>
      </ol>
    </div>
  </section>
</template>
