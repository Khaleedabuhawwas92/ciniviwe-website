<script setup>
import BrandIcon from '@/components/icons/BrandIcon.vue'

/** List of configured contact channels (phone / email / WhatsApp / address). */
defineProps({
  channels: { type: Array, required: true },
  tone: { type: String, default: 'dark', validator: (v) => ['dark', 'light'].includes(v) },
  compact: { type: Boolean, default: false },
})
</script>

<template>
  <ul :class="compact ? 'space-y-3' : 'space-y-3.5'">
    <li v-for="channel in channels" :key="channel.key">
      <component
        :is="channel.href ? 'a' : 'div'"
        :href="channel.href || undefined"
        :target="channel.external ? '_blank' : undefined"
        :rel="channel.external ? 'noopener noreferrer' : undefined"
        :class="[
          'group flex items-center gap-3.5 rounded-xl transition-colors',
          compact ? '' : 'border p-3.5',
          !compact && tone === 'dark' && 'border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.07]',
          !compact && tone === 'light' && 'border-navy-100 bg-white hover:border-brand-300',
        ]"
      >
        <span
          :class="[
            'flex shrink-0 items-center justify-center rounded-lg',
            compact ? 'size-9' : 'size-11',
            channel.key === 'whatsapp'
              ? 'bg-[#1fa855]/15 text-[#3fd07a]'
              : tone === 'dark'
                ? 'bg-brand-400/10 text-brand-300'
                : 'bg-brand-50 text-brand-700',
          ]"
        >
          <BrandIcon v-if="channel.brand" :name="channel.brand" :size="compact ? 16 : 19" />
          <component :is="channel.icon" v-else :size="compact ? 16 : 19" aria-hidden="true" />
        </span>
        <span class="min-w-0">
          <span :class="['block text-xs font-semibold', tone === 'dark' ? 'text-navy-300' : 'text-navy-500']">
            {{ channel.label }}
          </span>
          <span
            :dir="channel.ltr ? 'ltr' : undefined"
            :class="[
              'block truncate font-semibold',
              compact ? 'text-sm' : 'text-[0.95rem]',
              tone === 'dark' ? 'text-white' : 'text-navy-900',
              channel.ltr && 'text-end',
            ]"
          >
            {{ channel.value }}
          </span>
        </span>
      </component>
    </li>
  </ul>
</template>
