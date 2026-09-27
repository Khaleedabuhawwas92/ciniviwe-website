<script setup>
import { CircleAlert } from 'lucide-vue-next'

/**
 * Label + control + error wrapper. The control is passed through the default slot and
 * receives `id` and `describedBy` so labels and error messages stay correctly associated.
 */
const props = defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  required: { type: Boolean, default: false },
  error: { type: String, default: '' },
  hint: { type: String, default: '' },
})

const errorId = `${props.id}-error`
const hintId = `${props.id}-hint`
</script>

<template>
  <div>
    <label :for="id" class="mb-2 flex items-center gap-1 text-sm font-bold text-navy-800">
      {{ label }}
      <span v-if="required" class="text-rose-600" aria-hidden="true">*</span>
      <span v-else class="text-xs font-medium text-navy-400">(اختياري)</span>
    </label>
    <slot :id="id" :describedBy="[error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined" :invalid="!!error" />
    <p v-if="hint && !error" :id="hintId" class="mt-1.5 text-xs text-navy-500">{{ hint }}</p>
    <p v-if="error" :id="errorId" class="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-rose-600" role="alert">
      <CircleAlert :size="14" aria-hidden="true" />
      {{ error }}
    </p>
  </div>
</template>
