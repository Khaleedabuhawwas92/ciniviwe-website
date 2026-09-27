<script setup>
import { useId } from 'vue'

defineProps({
  size: { type: Number, default: 36 },
})
const gradientId = useId()
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 64 64" aria-hidden="true" class="shrink-0">
    <defs>
      <linearGradient :id="gradientId" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#7dd8f5" />
        <stop offset="0.55" stop-color="#3ec3ee" />
        <stop offset="1" stop-color="#1f5fd1" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="16" fill="#0f1d3a" stroke="rgba(255,255,255,0.12)" />
    <path d="M43.5 21.5A15 15 0 1 0 43.5 42.5" fill="none" :stroke="`url(#${gradientId})`" stroke-width="6" stroke-linecap="round" />
    <circle cx="33" cy="32" r="5" fill="#3ec3ee" />
  </svg>
</template>
