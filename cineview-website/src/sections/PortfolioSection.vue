<script setup>
import SectionHeading from '@/components/ui/SectionHeading.vue'
import PortfolioCard from '@/components/PortfolioCard.vue'
import { portfolio } from '@/data/portfolio'

const single = portfolio.length === 1
</script>

<template>
  <section id="portfolio" aria-labelledby="portfolio-title" class="section-y relative bg-navy-50/60">
    <div aria-hidden="true" class="bg-grid-light mask-fade-y pointer-events-none absolute inset-0" />
    <div class="container-page relative">
      <SectionHeading
        eyebrow="مشاريعنا"
        title="أعمالنا"
        title-id="portfolio-title"
        subtitle="نماذج من الأنظمة والحلول التي طورناها."
      />

      <ul :class="['mt-12 grid gap-6 lg:mt-14', !single && 'md:grid-cols-2']">
        <li v-for="(project, i) in portfolio" :key="project.id" v-reveal="(i % 2) * 90">
          <PortfolioCard :project="project" :wide="single" />
        </li>
      </ul>
    </div>
  </section>
</template>
