<script setup>
import { Construction } from 'lucide-vue-next'
import PageHeader from '@/components/PageHeader.vue'
</script>

<template>
  <div>
    <PageHeader :title="$route.meta.title" />
    <section class="card flex flex-col items-center px-6 py-16 text-center">
      <span class="flex size-14 items-center justify-center rounded-2xl bg-navy-50 text-navy-400">
        <Construction :size="26" aria-hidden="true" />
      </span>
      <h2 class="mt-5 text-lg font-bold text-navy-950">قريباً</h2>
      <p class="mt-2 max-w-md text-sm leading-7 text-navy-500">
        قسم «{{ $route.meta.title }}» قيد التطوير وسيكون متاحاً في تحديث قادم للوحة الإدارة.
      </p>
      <RouterLink :to="{ name: 'contacts' }" class="mt-6 text-sm font-bold text-brand-700 hover:underline">الانتقال إلى طلبات التواصل</RouterLink>
    </section>
  </div>
</template>
