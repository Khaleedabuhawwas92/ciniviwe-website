<script setup>
import { Ear, Lightbulb, ListChecks } from 'lucide-vue-next'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import ContactForm from '@/components/ContactForm.vue'
import ContactChannels from '@/components/ContactChannels.vue'
import { useCompanyContact } from '@/composables/useCompanyContact'

const { channels } = useCompanyContact()

const nextSteps = [
  { icon: Ear, title: 'نستمع لاحتياجك', text: 'نراجع طلبك ونتواصل معك لفهم التفاصيل.' },
  { icon: Lightbulb, title: 'نقترح الحل المناسب', text: 'نحدد الحل التقني الأنسب لطبيعة عملك.' },
  { icon: ListChecks, title: 'نوضح خطة التنفيذ', text: 'نشاركك نطاق العمل ومراحل التنفيذ بوضوح.' },
]
</script>

<template>
  <section id="contact" aria-labelledby="contact-title" class="section-y relative bg-navy-50/60">
    <div aria-hidden="true" class="bg-grid-light mask-fade-y pointer-events-none absolute inset-0" />
    <div class="container-page relative grid gap-12 lg:grid-cols-12 lg:gap-14">
      <div class="lg:col-span-5">
        <SectionHeading
          eyebrow="لنبدأ العمل معاً"
          title="تواصل معنا"
          title-id="contact-title"
          subtitle="أخبرنا عن مشروعك أو احتياج شركتك وسنتواصل معك."
        />

        <div v-if="channels.length" v-reveal="80" class="mt-10">
          <h3 class="mb-4 text-sm font-bold text-navy-900">قنوات التواصل المباشر</h3>
          <ContactChannels :channels="channels" tone="light" />
        </div>

        <div v-reveal="140" class="mt-10">
          <h3 class="text-sm font-bold text-navy-900">ماذا يحدث بعد إرسال طلبك؟</h3>
          <ol class="mt-5 space-y-5">
            <li v-for="step in nextSteps" :key="step.title" class="flex gap-4">
              <span class="flex size-10 shrink-0 items-center justify-center rounded-xl border border-navy-100 bg-white text-brand-700 shadow-soft">
                <component :is="step.icon" :size="18" :stroke-width="1.75" aria-hidden="true" />
              </span>
              <div>
                <p class="font-bold text-navy-950">{{ step.title }}</p>
                <p class="mt-0.5 text-sm leading-7 text-navy-600">{{ step.text }}</p>
              </div>
            </li>
          </ol>
        </div>
      </div>

      <div v-reveal="100" class="lg:col-span-7">
        <ContactForm />
      </div>
    </div>
  </section>
</template>
