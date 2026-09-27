<script setup>
import { House } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
</script>

<template>
  <section class="relative isolate flex min-h-[80vh] items-center overflow-hidden bg-navy-950 pt-28 pb-20">
    <div aria-hidden="true" class="absolute inset-0 -z-10">
      <div class="aurora absolute inset-0" />
      <div class="bg-grid-dark mask-radial absolute inset-0" />
    </div>
    <div class="container-page text-center">
      <p class="text-gradient text-7xl font-black sm:text-8xl" dir="ltr">404</p>
      <h1 class="mt-6 text-2xl font-bold text-white sm:text-3xl">الصفحة غير موجودة</h1>
      <p class="mx-auto mt-4 max-w-md leading-8 text-navy-200">
        يبدو أن الرابط الذي تبحث عنه غير صحيح أو تم نقله.
      </p>
      <BaseButton to="/" class="mt-9">
        <House :size="18" aria-hidden="true" />
        العودة إلى الرئيسية
      </BaseButton>
    </div>
  </section>
</template>
