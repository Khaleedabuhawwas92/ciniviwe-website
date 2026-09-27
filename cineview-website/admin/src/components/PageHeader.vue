<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
})
</script>

<template>
  <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div class="min-w-0">
      <slot name="before" />
      <h1 class="text-xl font-extrabold tracking-tight text-navy-950 sm:text-2xl">{{ title }}</h1>
      <p v-if="subtitle" class="mt-1 text-sm text-navy-500">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
