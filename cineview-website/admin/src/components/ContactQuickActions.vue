<script setup>
import { computed } from 'vue'
import { PhoneCall, Mail } from 'lucide-vue-next'
import WhatsAppIcon from '@/components/WhatsAppIcon.vue'
import { telLink, mailtoLink, whatsappLink } from '@/utils/contactLinks'

/** Call / WhatsApp / Email buttons — each only when that contact method exists. */
const props = defineProps({
  contact: { type: Object, required: true },
  compact: { type: Boolean, default: false },
})

const greeting = computed(() => `مرحباً ${props.contact.fullName}، معك فريق سينيفيو بخصوص طلبك.`)
const links = computed(() =>
  [
    props.contact.phone && { key: 'tel', label: 'اتصال', href: telLink(props.contact.phone), icon: PhoneCall, tone: 'text-navy-700 hover:bg-navy-100' },
    props.contact.phone && {
      key: 'wa',
      label: 'WhatsApp',
      href: whatsappLink(props.contact.phone, greeting.value),
      icon: WhatsAppIcon,
      tone: 'text-[#128c4a] hover:bg-emerald-50',
      external: true,
    },
    props.contact.email && { key: 'mail', label: 'Email', href: mailtoLink(props.contact.email), icon: Mail, tone: 'text-brand-700 hover:bg-brand-50' },
  ].filter((link) => link && link.href),
)
</script>

<template>
  <div v-if="links.length" :class="['flex items-center', compact ? 'gap-0.5' : 'flex-wrap gap-2']">
    <a
      v-for="link in links"
      :key="link.key"
      :href="link.href"
      :target="link.external ? '_blank' : undefined"
      :rel="link.external ? 'noopener noreferrer' : undefined"
      :aria-label="`${link.label}: ${contact.fullName}`"
      :title="link.label"
      :class="
        compact
          ? ['inline-flex size-7 items-center justify-center rounded-lg transition', link.tone]
          : ['inline-flex h-9 items-center gap-2 rounded-lg border border-navy-100 bg-white px-3 text-sm font-bold transition', link.tone]
      "
      @click.stop
    >
      <component :is="link.icon" :size="compact ? 16 : 16" aria-hidden="true" />
      <span v-if="!compact">{{ link.label }}</span>
    </a>
  </div>
</template>
