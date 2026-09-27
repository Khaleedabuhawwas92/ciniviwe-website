<script setup>
import { ShieldX } from 'lucide-vue-next'
</script>

<template>
  <section class="card flex flex-col items-center px-6 py-16 text-center">
    <span class="flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
      <ShieldX :size="26" aria-hidden="true" />
    </span>
    <p class="mt-5 text-sm font-bold text-navy-400" dir="ltr">403</p>
    <h1 class="mt-1 text-lg font-bold text-navy-950">ليست لديك صلاحية للوصول إلى هذه الصفحة</h1>
    <p class="mt-2 max-w-md text-sm leading-7 text-navy-500">هذا القسم متاح للمدير العام فقط. تواصل معه إذا كنت تحتاج إلى هذه الصلاحية.</p>
    <RouterLink :to="{ name: 'dashboard' }" class="mt-6 text-sm font-bold text-brand-700 hover:underline">العودة إلى لوحة التحكم</RouterLink>
  </section>
</template>
