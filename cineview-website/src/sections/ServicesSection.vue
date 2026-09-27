<script setup>
import { ArrowLeft, MessagesSquare } from 'lucide-vue-next'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import ServiceCard from '@/components/ServiceCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { services } from '@/data/services'
import { useSectionNav } from '@/composables/useSectionNav'

const { sectionLink, onSectionClick } = useSectionNav()
</script>

<template>
  <section id="services" aria-labelledby="services-title" class="section-y relative bg-navy-50/60">
    <div aria-hidden="true" class="bg-grid-light mask-fade-y pointer-events-none absolute inset-0" />
    <div class="container-page relative">
      <SectionHeading
        eyebrow="ماذا نقدم"
        title="خدماتنا"
        title-id="services-title"
        subtitle="حلول تقنية متكاملة تناسب احتياجات الشركات والمؤسسات."
      />

      <ul class="mt-12 grid gap-5 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4">
        <li v-for="(service, i) in services" :key="service.id" v-reveal="(i % 4) * 70">
          <ServiceCard :service="service" :index="i" />
        </li>

        <li v-reveal="210">
          <div
            class="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl bg-navy-950 p-6 text-white lg:p-7"
          >
            <div aria-hidden="true" class="bg-grid-dark absolute inset-0 opacity-70" />
            <div aria-hidden="true" class="absolute -top-16 -end-16 size-44 rounded-full bg-brand-400/25 blur-3xl" />
            <div class="relative">
              <span class="flex size-12 items-center justify-center rounded-xl bg-white/[0.07] text-brand-300">
                <MessagesSquare :size="22" :stroke-width="1.75" aria-hidden="true" />
              </span>
              <h3 class="mt-6 text-lg font-bold">لديك احتياج مختلف؟</h3>
              <p class="mt-2.5 text-[0.95rem] leading-7 text-navy-200">
                أخبرنا عن طبيعة عملك وسنقترح الحل التقني الأنسب لك.
              </p>
            </div>
            <BaseButton
              :to="sectionLink('contact')"
              size="sm"
              class="relative mt-6 self-start"
              @click="onSectionClick($event, 'contact')"
            >
              اطلب استشارة
              <ArrowLeft :size="16" class="transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
            </BaseButton>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>
