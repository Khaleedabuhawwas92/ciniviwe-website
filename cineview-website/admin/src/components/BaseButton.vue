<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { LoaderCircle } from 'lucide-vue-next'

const props = defineProps({
  to: { type: [String, Object], default: null },
  href: { type: String, default: '' },
  external: { type: Boolean, default: false },
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'secondary', 'ghost', 'danger', 'dark'].includes(v),
  },
  size: { type: String, default: 'md', validator: (v) => ['sm', 'md'].includes(v) },
  type: { type: String, default: 'button' },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const tag = computed(() => (props.to ? RouterLink : props.href ? 'a' : 'button'))
const attrs = computed(() => {
  if (props.to) return { to: props.to }
  if (props.href) return { href: props.href, ...(props.external && { target: '_blank', rel: 'noopener noreferrer' }) }
  return { type: props.type, disabled: props.disabled || props.loading }
})

const variants = {
  primary: 'bg-navy-900 text-white hover:bg-navy-800 shadow-card',
  secondary: 'border border-navy-200 bg-white text-navy-800 hover:bg-navy-50 hover:border-navy-300',
  ghost: 'text-navy-600 hover:bg-navy-100/70 hover:text-navy-900',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
  dark: 'bg-brand-400 text-navy-950 hover:bg-brand-300',
}
const sizes = { sm: 'h-9 px-3 text-sm gap-1.5', md: 'h-10.5 px-4 text-sm gap-2' }
</script>

<template>
  <component
    :is="tag"
    v-bind="attrs"
    :aria-busy="loading || undefined"
    :class="[
      'inline-flex items-center justify-center rounded-lg font-bold whitespace-nowrap transition disabled:cursor-not-allowed disabled:opacity-55',
      variants[variant],
      sizes[size],
    ]"
  >
    <LoaderCircle v-if="loading" :size="16" class="animate-spin" aria-hidden="true" />
    <slot />
  </component>
</template>
