<script setup>
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { Menu, X, ArrowLeft } from 'lucide-vue-next'
import BrandLogo from '@/components/BrandLogo.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { navLinks } from '@/data/navigation'
import { useScrolled } from '@/composables/useScrolled'
import { useActiveSection } from '@/composables/useActiveSection'
import { useSectionNav } from '@/composables/useSectionNav'

const route = useRoute()
const scrolled = useScrolled(16)
const activeId = useActiveSection(navLinks.map((link) => link.id))

const menuOpen = ref(false)
const menuButton = ref(null)
const drawer = ref(null)

const { sectionLink: linkTo, onSectionClick } = useSectionNav()
const isActive = (id) => route.path === '/' && activeId.value === id

function onNavClick(event, id) {
  menuOpen.value = false
  onSectionClick(event, id)
}

function closeMenu({ restoreFocus = true } = {}) {
  if (!menuOpen.value) return
  menuOpen.value = false
  if (restoreFocus) nextTick(() => menuButton.value?.focus())
}

function onKeydown(event) {
  if (!menuOpen.value) return
  if (event.key === 'Escape') {
    closeMenu()
    return
  }
  // Keep keyboard focus inside the open drawer.
  if (event.key === 'Tab' && drawer.value) {
    const focusable = drawer.value.querySelectorAll('a[href], button:not([disabled])')
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }
}

watch(menuOpen, (open) => {
  document.documentElement.style.overflow = open ? 'hidden' : ''
  if (open) nextTick(() => drawer.value?.querySelector('a[href], button')?.focus())
})
watch(() => route.fullPath, () => closeMenu({ restoreFocus: false }))

const mq = typeof window !== 'undefined' ? window.matchMedia('(min-width: 64rem)') : null
const onBreakpoint = (e) => e.matches && closeMenu({ restoreFocus: false })

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  mq?.addEventListener('change', onBreakpoint)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  mq?.removeEventListener('change', onBreakpoint)
  document.documentElement.style.overflow = ''
})
</script>

<template>
  <header
    :class="[
      'fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300',
      scrolled || menuOpen
        ? 'border-b border-white/[0.07] bg-navy-950/95 shadow-[0_10px_30px_-18px_rgb(0_0_0/0.7)] backdrop-blur-xl'
        : 'border-b border-transparent bg-transparent',
    ]"
  >
    <nav
      aria-label="التنقل الرئيسي"
      :class="['container-page flex items-center justify-between gap-6 transition-[height] duration-300', scrolled ? 'h-[4.25rem]' : 'h-20']"
    >
      <RouterLink :to="linkTo('home')" class="shrink-0 rounded-lg" aria-label="سينيفيو — الصفحة الرئيسية" @click="onNavClick($event, 'home')">
        <BrandLogo />
      </RouterLink>

      <ul class="hidden items-center gap-1 lg:flex">
        <li v-for="link in navLinks" :key="link.id">
          <RouterLink
            :to="linkTo(link.id)"
            :aria-current="isActive(link.id) ? 'location' : undefined"
            :class="[
              'relative rounded-lg px-3 py-2 text-[0.94rem] font-semibold transition-colors duration-200 xl:px-3.5',
              isActive(link.id) ? 'text-white' : 'text-navy-200 hover:text-white',
            ]"
            @click="onNavClick($event, link.id)"
          >
            {{ link.label }}
            <span
              aria-hidden="true"
              :class="[
                'absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-brand-400 transition-all duration-300',
                isActive(link.id) ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0',
              ]"
            />
          </RouterLink>
        </li>
      </ul>

      <div class="flex items-center gap-3">
        <div class="hidden sm:block">
          <BaseButton :to="linkTo('contact')" size="sm" @click="onNavClick($event, 'contact')">
            اطلب خدمتك
            <ArrowLeft :size="16" class="transition-transform duration-200 group-hover:-translate-x-0.5" aria-hidden="true" />
          </BaseButton>
        </div>

        <button
          ref="menuButton"
          type="button"
          class="inline-flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10 lg:hidden"
          :aria-expanded="menuOpen"
          aria-controls="mobile-menu"
          :aria-label="menuOpen ? 'إغلاق القائمة' : 'فتح القائمة'"
          @click="menuOpen = !menuOpen"
        >
          <X v-if="menuOpen" :size="22" aria-hidden="true" />
          <Menu v-else :size="22" aria-hidden="true" />
        </button>
      </div>
    </nav>
  </header>

  <!-- Mobile drawer -->
  <Transition
    enter-active-class="transition-opacity duration-300"
    leave-active-class="transition-opacity duration-200"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div v-if="menuOpen" class="fixed inset-0 z-40 bg-navy-950/60 backdrop-blur-sm lg:hidden" aria-hidden="true" @click="closeMenu()" />
  </Transition>
  <Transition
    enter-active-class="transition-transform duration-300 ease-out"
    leave-active-class="transition-transform duration-200 ease-in"
    enter-from-class="rtl:translate-x-full ltr:-translate-x-full"
    leave-to-class="rtl:translate-x-full ltr:-translate-x-full"
  >
    <div
      v-if="menuOpen"
      id="mobile-menu"
      ref="drawer"
      role="dialog"
      aria-modal="true"
      aria-label="قائمة التنقل"
      class="fixed inset-y-0 start-0 z-50 flex w-[min(20rem,86vw)] flex-col border-e border-white/10 bg-navy-950 px-5 pt-5 pb-8 shadow-2xl lg:hidden"
    >
      <div class="flex items-center justify-between">
        <BrandLogo />
        <button
          type="button"
          class="inline-flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10"
          aria-label="إغلاق القائمة"
          @click="closeMenu()"
        >
          <X :size="22" aria-hidden="true" />
        </button>
      </div>

      <ul class="mt-8 flex flex-col gap-1">
        <li v-for="link in navLinks" :key="link.id">
          <RouterLink
            :to="linkTo(link.id)"
            :aria-current="isActive(link.id) ? 'location' : undefined"
            :class="[
              'flex items-center justify-between rounded-xl px-4 py-3.5 text-base font-semibold transition-colors',
              isActive(link.id) ? 'bg-white/[0.07] text-white' : 'text-navy-200 hover:bg-white/5 hover:text-white',
            ]"
            @click="onNavClick($event, link.id)"
          >
            {{ link.label }}
            <ArrowLeft :size="16" class="opacity-40" aria-hidden="true" />
          </RouterLink>
        </li>
      </ul>

      <BaseButton :to="linkTo('contact')" block class="mt-auto" @click="onNavClick($event, 'contact')">
        اطلب خدمتك
      </BaseButton>
    </div>
  </Transition>
</template>
