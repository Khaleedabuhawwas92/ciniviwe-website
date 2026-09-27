<script setup>
import SectionHeading from '@/components/ui/SectionHeading.vue'
import { aboutPoints } from '@/data/highlights'
</script>

<template>
  <section id="about" aria-labelledby="about-title" class="section-y relative overflow-hidden bg-white">
    <div class="container-page grid gap-14 lg:grid-cols-12 lg:gap-16">
      <div class="lg:col-span-6">
        <SectionHeading eyebrow="تعرّف علينا" title="من نحن" title-id="about-title" />
        <div v-reveal="80" class="mt-6 space-y-5 text-base leading-8 text-navy-600 sm:text-lg sm:leading-9">
          <p>
            <strong class="font-bold text-navy-900">سينيفيو</strong> شركة متخصصة في تطوير الحلول التقنية والبرمجية
            الحديثة. نعمل على تحويل احتياجات الشركات والمؤسسات إلى أنظمة عملية وسهلة الاستخدام تساعد على تنظيم العمل،
            توفير الوقت وتقليل الأخطاء.
          </p>
          <p>
            نؤمن أن كل شركة لها احتياجات مختلفة، لذلك نركز على بناء حلول مرنة وقابلة للتوسع بدلاً من الاعتماد على أنظمة
            ثابتة لا تتناسب مع طبيعة العمل.
          </p>
        </div>

        <figure
          v-reveal="140"
          class="mt-10 border-s-2 border-brand-400 ps-5"
        >
          <blockquote class="text-lg leading-8 font-bold text-navy-900">
            نبدأ من طريقة عملك، ثم نبني النظام الذي يخدمها — لا العكس.
          </blockquote>
          <figcaption class="mt-2 text-sm text-navy-500">منهجية سينيفيو في بناء الحلول</figcaption>
        </figure>
      </div>

      <div class="lg:col-span-6">
        <div
          v-reveal="120"
          class="relative overflow-hidden rounded-3xl border border-navy-100 bg-linear-to-b from-navy-50 to-white p-2 shadow-soft"
        >
          <ul class="divide-y divide-navy-100 rounded-[1.25rem] bg-white">
            <li
              v-for="point in aboutPoints"
              :key="point.title"
              class="group flex items-start gap-4 p-5 transition-colors hover:bg-navy-50/60 sm:p-6"
            >
              <span
                class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-navy-950 text-brand-300 transition-transform duration-300 group-hover:scale-105"
              >
                <component :is="point.icon" :size="20" :stroke-width="1.75" aria-hidden="true" />
              </span>
              <div>
                <h3 class="font-bold text-navy-950">{{ point.title }}</h3>
                <p class="mt-1 text-[0.95rem] leading-7 text-navy-600">{{ point.text }}</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>
