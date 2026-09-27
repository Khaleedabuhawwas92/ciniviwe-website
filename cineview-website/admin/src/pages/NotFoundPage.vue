<script setup>
import { SearchX } from 'lucide-vue-next'
</script>

<template>
  <section class="card flex flex-col items-center px-6 py-16 text-center">
    <span class="flex size-14 items-center justify-center rounded-2xl bg-navy-50 text-navy-400">
      <SearchX :size="26" aria-hidden="true" />
    </span>
    <h1 class="mt-5 text-lg font-bold text-navy-950">الصفحة غير موجودة</h1>
    <RouterLink :to="{ name: 'dashboard' }" class="mt-6 text-sm font-bold text-brand-700 hover:underline">العودة إلى لوحة التحكم</RouterLink>
  </section>
</template>
