<script setup>
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import WhatsAppFloat from '@/components/WhatsAppFloat.vue'
import { useSeo } from '@/composables/useSeo'

useSeo()
</script>

<template>
  <a
    href="#main"
    class="sr-only z-[60] rounded-lg bg-white px-4 py-2 font-semibold text-navy-900 focus:not-sr-only focus:fixed focus:start-4 focus:top-4"
  >
    تخطَّ إلى المحتوى الرئيسي
  </a>
  <AppHeader />
  <main id="main" tabindex="-1" class="outline-none">
    <RouterView />
  </main>
  <AppFooter />
  <WhatsAppFloat />
</template>
