<script setup>
import BrandIcon from '@/components/icons/BrandIcon.vue'
import { company } from '@/data/company'
import { useCompanyContact } from '@/composables/useCompanyContact'

// Rendered only when a WhatsApp number is configured in src/data/company.js.
const { whatsappHref } = useCompanyContact()
const visible = Boolean(whatsappHref) && company.showFloatingWhatsApp
</script>

<template>
  <a
    v-if="visible"
    :href="whatsappHref"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="تواصل معنا عبر واتساب"
    class="group fixed bottom-5 end-5 z-40 flex size-14 items-center justify-center rounded-full bg-[#1fa855] text-white shadow-[0_12px_30px_-8px_rgb(31_168_85/0.7)] ring-4 ring-white/70 transition hover:-translate-y-0.5 hover:bg-[#1b9a4d] sm:bottom-7 sm:end-7"
  >
    <BrandIcon name="whatsapp" :size="26" />
    <span
      class="pointer-events-none absolute end-full me-3 hidden rounded-lg bg-navy-950 px-3 py-1.5 text-sm font-semibold whitespace-nowrap text-white opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-visible:opacity-100 sm:block"
    >
      تواصل عبر واتساب
    </span>
  </a>
</template>
