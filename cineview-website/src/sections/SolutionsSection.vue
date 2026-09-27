<script setup>
import SectionHeading from '@/components/ui/SectionHeading.vue'
import FeaturedSolutionCard from '@/components/FeaturedSolutionCard.vue'
import SolutionCard from '@/components/SolutionCard.vue'
import { solutions } from '@/data/solutions'

const featured = solutions.filter((solution) => solution.featured)
const others = solutions.filter((solution) => !solution.featured)
</script>

<template>
  <section id="solutions" aria-labelledby="solutions-title" class="section-y relative bg-white">
    <div class="container-page">
      <SectionHeading
        eyebrow="منتجاتنا"
        title="حلولنا"
        title-id="solutions-title"
        subtitle="منتجات برمجية جاهزة للتطبيق وقابلة للتخصيص حسب طبيعة عمل مؤسستك."
      />

      <div class="mt-12 space-y-8 lg:mt-14">
        <FeaturedSolutionCard v-for="solution in featured" :key="solution.slug" v-reveal :solution="solution" />
      </div>

      <ul v-if="others.length" class="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <li v-for="(solution, i) in others" :key="solution.slug" v-reveal="i * 80">
          <SolutionCard :solution="solution" />
        </li>
      </ul>
    </div>
  </section>
</template>
