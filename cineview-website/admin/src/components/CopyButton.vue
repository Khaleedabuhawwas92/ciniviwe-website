<script setup>
import { ref } from 'vue'
import { Copy, Check } from 'lucide-vue-next'
import { useToastStore } from '@/stores/toast'

const props = defineProps({
  value: { type: String, required: true },
  label: { type: String, default: 'نسخ' },
})
const toast = useToastStore()
const copied = ref(false)

async function copy() {
  try {
    await navigator.clipboard.writeText(props.value)
  } catch {
    // Fallback for non-secure contexts
    const area = document.createElement('textarea')
    area.value = props.value
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    document.execCommand('copy')
    area.remove()
  }
  copied.value = true
  toast.success('تم النسخ')
  setTimeout(() => (copied.value = false), 1500)
}
</script>

<template>
  <button
    type="button"
    class="inline-flex size-8 items-center justify-center rounded-lg text-navy-400 transition hover:bg-navy-100 hover:text-navy-800"
    :aria-label="label"
    :title="label"
    @click="copy"
  >
    <Check v-if="copied" :size="15" class="text-emerald-600" aria-hidden="true" />
    <Copy v-else :size="15" aria-hidden="true" />
  </button>
</template>
