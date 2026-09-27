<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

/**
 * One button for the whole site.
 * Renders a RouterLink (to), an external/anchor link (href) or a native <button>.
 */
const props = defineProps({
  to: { type: [String, Object], default: null },
  href: { type: String, default: '' },
  external: { type: Boolean, default: false },
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'secondary', 'outline', 'dark', 'whatsapp'].includes(v),
  },
  size: { type: String, default: 'md', validator: (v) => ['sm', 'md', 'lg'].includes(v) },
  type: { type: String, default: 'button' },
  block: { type: Boolean, default: false },
})

const tag = computed(() => (props.to ? RouterLink : props.href ? 'a' : 'button'))

const attrs = computed(() => {
  if (props.to) return { to: props.to }
  if (props.href)
    return { href: props.href, ...(props.external && { target: '_blank', rel: 'noopener noreferrer' }) }
  return { type: props.type }
})

const variants = {
  primary:
    'bg-brand-400 text-navy-950 shadow-[0_8px_24px_-8px_rgb(62_195_238/0.65)] hover:bg-brand-300 hover:shadow-[0_10px_30px_-8px_rgb(62_195_238/0.8)]',
  secondary: 'border border-white/15 bg-white/[0.06] text-white backdrop-blur hover:border-white/30 hover:bg-white/10',
  outline: 'border border-navy-200 bg-white text-navy-900 hover:border-navy-300 hover:bg-navy-50',
  dark: 'bg-navy-900 text-white shadow-soft hover:bg-navy-800',
  whatsapp: 'bg-[#1fa855] text-white shadow-[0_8px_24px_-10px_rgb(31_168_85/0.7)] hover:bg-[#1b9a4d]',
}

const sizes = {
  sm: 'h-10 px-4 text-sm gap-2',
  md: 'h-12 px-6 text-[0.95rem] gap-2.5',
  lg: 'h-13 px-7 text-base gap-2.5',
}
</script>

<template>
  <component
    :is="tag"
    v-bind="attrs"
    :class="[
      'group inline-flex items-center justify-center rounded-xl font-bold whitespace-nowrap transition duration-200 ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60',
      variants[variant],
      sizes[size],
      block && 'w-full',
    ]"
  >
    <slot />
  </component>
</template>
