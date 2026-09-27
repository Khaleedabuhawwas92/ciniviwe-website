<script setup>
import { STATUS_STYLES, statusLabel } from '@/utils/labels'

defineProps({ status: { type: String, required: true } })
</script>

<template>
  <span :class="['inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap ring-1 ring-inset', STATUS_STYLES[status]]">
    <span class="size-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
    {{ statusLabel(status) }}
  </span>
</template>
