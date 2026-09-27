<script setup>
import { ArrowLeft, Phone } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BrandIcon from '@/components/icons/BrandIcon.vue'
import { company } from '@/data/company'
import { hasValue, telLink } from '@/utils/contactLinks'
import { useCompanyContact } from '@/composables/useCompanyContact'
import { useSectionNav } from '@/composables/useSectionNav'

const { sectionLink, onSectionClick } = useSectionNav()
const { whatsappHref } = useCompanyContact()

// Secondary action: WhatsApp if configured, otherwise phone, otherwise the contact form.
const secondary = whatsappHref
  ? { kind: 'whatsapp', href: whatsappHref }
  : hasValue(company.phone)
    ? { kind: 'phone', href: telLink(company.phone) }
    : { kind: 'form' }
</script>

<template>
  <section aria-labelledby="cta-title" class="pb-20 lg:pb-28">
    <div class="container-page">
      <div
        v-reveal
        class="relative isolate overflow-hidden rounded-[1.75rem] bg-navy-950 px-6 py-14 text-center sm:px-12 lg:py-20"
      >
        <div aria-hidden="true" class="absolute inset-0 -z-10">
          <div class="aurora absolute inset-0" />
          <div class="bg-grid-dark mask-radial absolute inset-0" />
          <div class="absolute inset-x-0 top-0 h-px bg-linear-to-l from-transparent via-brand-300/60 to-transparent" />
        </div>

        <h2 id="cta-title" class="mx-auto max-w-3xl text-3xl leading-tight font-extrabold text-balance text-white sm:text-4xl">
          عندك فكرة أو نظام تحتاج تطويره؟
        </h2>
        <p class="mx-auto mt-5 max-w-2xl text-base leading-8 text-navy-200 sm:text-lg">
          دعنا نحول فكرتك إلى حل تقني عملي يساعدك على تطوير أعمالك.
        </p>

        <div class="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <BaseButton :to="sectionLink('contact')" size="lg" @click="onSectionClick($event, 'contact')">
            ابدأ مشروعك معنا
            <ArrowLeft :size="18" class="transition-transform group-hover:-translate-x-1" aria-hidden="true" />
          </BaseButton>

          <BaseButton v-if="secondary.kind === 'whatsapp'" :href="secondary.href" external variant="secondary" size="lg">
            <BrandIcon name="whatsapp" :size="18" />
            تواصل معنا
          </BaseButton>
          <BaseButton v-else-if="secondary.kind === 'phone'" :href="secondary.href" variant="secondary" size="lg">
            <Phone :size="18" aria-hidden="true" />
            تواصل معنا
          </BaseButton>
          <BaseButton
            v-else
            :to="sectionLink('contact')"
            variant="secondary"
            size="lg"
            @click="onSectionClick($event, 'contact')"
          >
            تواصل معنا
          </BaseButton>
        </div>
      </div>
    </div>
  </section>
</template>
