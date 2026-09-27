<script setup>
import BrandLogo from '@/components/BrandLogo.vue'
import BrandIcon from '@/components/icons/BrandIcon.vue'
import ContactChannels from '@/components/ContactChannels.vue'
import { company } from '@/data/company'
import { footerLinks } from '@/data/navigation'
import { services } from '@/data/services'
import { useCompanyContact } from '@/composables/useCompanyContact'
import { useSectionNav } from '@/composables/useSectionNav'

const { channels, socials } = useCompanyContact()
const year = new Date().getFullYear()

const { onSectionClick: onNavClick } = useSectionNav()
</script>

<template>
  <footer class="relative overflow-hidden bg-navy-950 text-navy-200">
    <div aria-hidden="true" class="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-l from-transparent via-brand-400/40 to-transparent" />
    <div aria-hidden="true" class="bg-grid-dark mask-radial pointer-events-none absolute inset-0 opacity-50" />

    <div class="container-page relative grid gap-12 pt-16 pb-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-10 lg:pt-20">
      <div class="lg:col-span-4">
        <BrandLogo />
        <p class="mt-5 max-w-sm text-sm leading-7 text-navy-300">
          {{ company.descriptionAr }}
        </p>
        <ul v-if="socials.length" class="mt-6 flex gap-2.5" aria-label="حساباتنا على وسائل التواصل">
          <li v-for="social in socials" :key="social.key">
            <a
              :href="social.href"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="social.label"
              class="flex size-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-navy-200 transition hover:border-brand-400/40 hover:text-white"
            >
              <BrandIcon :name="social.key" :size="17" />
            </a>
          </li>
        </ul>
      </div>

      <nav aria-labelledby="footer-links-title" class="lg:col-span-2">
        <h2 id="footer-links-title" class="text-sm font-bold text-white">روابط سريعة</h2>
        <ul class="mt-5 space-y-3 text-sm">
          <li v-for="link in footerLinks" :key="link.id">
            <RouterLink
              :to="{ path: '/', hash: `#${link.id}` }"
              class="transition-colors hover:text-white"
              @click="onNavClick($event, link.id)"
            >
              {{ link.label }}
            </RouterLink>
          </li>
        </ul>
      </nav>

      <div class="lg:col-span-3">
        <h2 class="text-sm font-bold text-white">خدماتنا</h2>
        <ul class="mt-5 space-y-3 text-sm">
          <li v-for="service in services.slice(0, 6)" :key="service.id">
            <RouterLink
              :to="{ path: '/', hash: '#services' }"
              class="transition-colors hover:text-white"
              @click="onNavClick($event, 'services')"
            >
              {{ service.title }}
            </RouterLink>
          </li>
        </ul>
      </div>

      <div class="lg:col-span-3">
        <h2 class="text-sm font-bold text-white">تواصل معنا</h2>
        <ContactChannels v-if="channels.length" :channels="channels" compact class="mt-5" />
        <p v-else class="mt-5 text-sm leading-7 text-navy-300">
          أرسل لنا طلبك من خلال
          <RouterLink
            :to="{ path: '/', hash: '#contact' }"
            class="font-semibold text-brand-300 underline-offset-4 hover:underline"
            @click="onNavClick($event, 'contact')"
          >
            نموذج التواصل
          </RouterLink>
          وسنعود إليك.
        </p>
      </div>
    </div>

    <div class="container-page relative">
      <div class="flex flex-col items-center justify-between gap-3 border-t border-white/[0.07] py-6 text-xs text-navy-400 sm:flex-row">
        <p>© {{ year }} Cineview. جميع الحقوق محفوظة.</p>
        <p>{{ company.companyNameAr }} — {{ company.taglineAr }}</p>
      </div>
    </div>
  </footer>
</template>
