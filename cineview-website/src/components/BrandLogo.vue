<script setup>
import { useId } from 'vue'
import { company } from '@/data/company'
import { hasValue } from '@/utils/contactLinks'

/**
 * Cineview logo. If `company.logo` is set (e.g. '/logo.svg' in /public), that image is used;
 * otherwise a text-based mark is rendered.
 */
defineProps({
  tone: { type: String, default: 'light', validator: (v) => ['light', 'dark'].includes(v) },
})

const gradientId = useId()
const logoSrc = hasValue(company.logo) ? company.logo : ''
</script>

<template>
  <span class="inline-flex items-center gap-3">
    <img
      v-if="logoSrc"
      :src="logoSrc"
      :alt="`${company.companyNameAr} | ${company.companyNameEn}`"
      class="h-10 w-auto"
      width="160"
      height="40"
    />
    <template v-else>
      <svg class="size-10 shrink-0" viewBox="0 0 64 64" aria-hidden="true">
        <defs>
          <linearGradient :id="gradientId" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#7dd8f5" />
            <stop offset="0.55" stop-color="#3ec3ee" />
            <stop offset="1" stop-color="#1f5fd1" />
          </linearGradient>
        </defs>
        <rect
          width="64"
          height="64"
          rx="16"
          :fill="tone === 'light' ? '#0f1d3a' : '#0b162e'"
          stroke="rgba(255,255,255,0.12)"
        />
        <path
          d="M43.5 21.5A15 15 0 1 0 43.5 42.5"
          fill="none"
          :stroke="`url(#${gradientId})`"
          stroke-width="6"
          stroke-linecap="round"
        />
        <circle cx="33" cy="32" r="5" fill="#3ec3ee" />
      </svg>
      <span class="flex flex-col leading-none">
        <span :class="['text-lg font-extrabold', tone === 'light' ? 'text-white' : 'text-navy-950']">
          {{ company.companyNameAr }}
        </span>
        <span
          dir="ltr"
          :class="[
            'mt-1 text-[0.7rem] font-semibold tracking-[0.28em] uppercase',
            tone === 'light' ? 'text-brand-300/90' : 'text-brand-700',
          ]"
        >
          {{ company.companyNameEn }}
        </span>
      </span>
    </template>
  </span>
</template>
