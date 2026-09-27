<script setup>
import { ArrowLeft, Check } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import DashboardMockup from '@/components/mockups/DashboardMockup.vue'
import { company } from '@/data/company'
import { useSectionNav } from '@/composables/useSectionNav'

const { sectionLink, onSectionClick } = useSectionNav()

const assurances = ['أنظمة مخصصة لاحتياجك', 'الويب وسطح المكتب', 'دعم وتطوير مستمر']
</script>

<template>
  <section id="home" aria-labelledby="hero-title" class="relative isolate overflow-hidden bg-navy-950 pt-32 pb-24 lg:pt-40 lg:pb-32">
    <!-- background -->
    <div aria-hidden="true" class="absolute inset-0 -z-10">
      <div class="aurora absolute inset-0" />
      <div class="bg-grid-dark mask-fade-y absolute inset-0" />
      <div class="absolute inset-x-0 bottom-0 h-40 bg-linear-to-b from-transparent to-navy-950" />
      <div class="absolute inset-x-0 bottom-0 h-px bg-linear-to-l from-transparent via-white/10 to-transparent" />
    </div>

    <div class="container-page grid items-center gap-16 lg:grid-cols-12 lg:gap-10">
      <div class="lg:col-span-6 xl:col-span-5">
        <p
          class="hero-enter inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] py-1.5 ps-1.5 pe-4 text-sm font-semibold text-navy-100"
        >
          <span class="rounded-full bg-brand-400/15 px-2.5 py-0.5 text-xs font-bold text-brand-300" dir="ltr">
            {{ company.companyNameEn }}
          </span>
          تطوير برمجيات وحلول تقنية للشركات
        </p>

        <h1
          id="hero-title"
          class="hero-enter mt-7 text-[2.35rem] leading-[1.25] font-black tracking-tight text-balance text-white sm:text-5xl sm:leading-[1.2] xl:text-[3.5rem]"
          style="--d: 90ms"
        >
          حلول تقنية
          <span class="text-gradient">تصنع فرقاً</span>
          في أعمالك
        </h1>

        <p class="hero-enter mt-6 max-w-xl text-base leading-8 text-navy-200 sm:text-lg sm:leading-9" style="--d: 180ms">
          في سينيفيو، نطوّر حلولاً برمجية وأنظمة رقمية تساعد الشركات على تنظيم أعمالها، رفع الكفاءة، وتقليل الوقت
          والأخطاء من خلال تقنيات حديثة وقابلة للتوسع.
        </p>

        <div class="hero-enter mt-9 flex flex-col gap-3 sm:flex-row" style="--d: 270ms">
          <BaseButton :to="sectionLink('services')" size="lg" @click="onSectionClick($event, 'services')">
            استكشف خدماتنا
            <ArrowLeft :size="18" class="transition-transform duration-200 group-hover:-translate-x-1" aria-hidden="true" />
          </BaseButton>
          <BaseButton :to="sectionLink('contact')" variant="secondary" size="lg" @click="onSectionClick($event, 'contact')">
            تواصل معنا
          </BaseButton>
        </div>

        <ul class="hero-enter mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-navy-200" style="--d: 360ms">
          <li v-for="item in assurances" :key="item" class="flex items-center gap-2">
            <span class="flex size-5 items-center justify-center rounded-full bg-brand-400/15 text-brand-300">
              <Check :size="12" :stroke-width="3" aria-hidden="true" />
            </span>
            {{ item }}
          </li>
        </ul>
      </div>

      <div class="hero-enter lg:col-span-6 xl:col-span-7 xl:ps-6" style="--d: 220ms">
        <DashboardMockup />
      </div>
    </div>
  </section>
</template>
