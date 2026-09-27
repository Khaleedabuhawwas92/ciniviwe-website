<script setup>
import { MailCheck, MailX, MailWarning, CircleDashed } from 'lucide-vue-next'
import { NOTIFICATION_STATUS_LABELS, NOTIFICATION_STYLES } from '@/utils/labels'

defineProps({
  status: { type: String, default: 'PENDING' },
  // In dense tables the label is visually hidden below 2xl (kept for screen readers and as a tooltip).
  compact: { type: Boolean, default: false },
})
const icons = { SENT: MailCheck, FAILED: MailX, SKIPPED: MailWarning, PENDING: CircleDashed }
</script>

<template>
  <span
    :class="['inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap', NOTIFICATION_STYLES[status]]"
    :title="NOTIFICATION_STATUS_LABELS[status] ?? status"
  >
    <component :is="icons[status] || CircleDashed" :size="15" aria-hidden="true" />
    <span :class="compact && 'max-2xl:sr-only'">{{ NOTIFICATION_STATUS_LABELS[status] ?? status }}</span>
  </span>
</template>
