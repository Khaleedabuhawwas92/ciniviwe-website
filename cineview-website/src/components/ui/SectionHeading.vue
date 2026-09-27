<script setup>
defineProps({
  eyebrow: { type: String, default: '' },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  dark: { type: Boolean, default: false },
  center: { type: Boolean, default: false },
  titleId: { type: String, default: '' },
})
</script>

<template>
  <header v-reveal :class="['max-w-2xl', center && 'mx-auto text-center']">
    <p
      v-if="eyebrow"
      :class="[
        'mb-4 inline-flex items-center gap-2.5 text-sm font-bold tracking-wide',
        dark ? 'text-brand-300' : 'text-brand-700',
      ]"
    >
      <span aria-hidden="true" :class="['h-px w-6', dark ? 'bg-brand-300/70' : 'bg-brand-600/60']" />
      {{ eyebrow }}
    </p>
    <h2
      :id="titleId || undefined"
      :class="[
        'text-3xl leading-tight font-extrabold tracking-tight text-balance sm:text-4xl lg:text-[2.6rem]',
        dark ? 'text-white' : 'text-navy-950',
      ]"
    >
      {{ title }}
    </h2>
    <p
      v-if="subtitle"
      :class="['mt-4 text-base leading-8 text-pretty sm:text-lg', dark ? 'text-navy-200' : 'text-navy-600']"
    >
      {{ subtitle }}
    </p>
    <slot />
  </header>
</template>
