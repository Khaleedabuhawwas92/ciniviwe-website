<script setup>
import { ref, watch, nextTick, onBeforeUnmount, useId } from 'vue'
import { X } from 'lucide-vue-next'

/** Accessible dialog: focus moves in, Escape closes, focus returns to the opener. */
const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  size: { type: String, default: 'md' },
  dismissible: { type: Boolean, default: true },
})
const emit = defineEmits(['close'])

const panel = ref(null)
const titleId = useId()
let opener = null

function close() {
  if (props.dismissible) emit('close')
}

function onKeydown(event) {
  if (event.key === 'Escape') close()
  if (event.key === 'Tab' && panel.value) {
    const items = [...panel.value.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])')]
    if (!items.length) return
    const first = items[0]
    const last = items[items.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      opener = document.activeElement
      document.addEventListener('keydown', onKeydown)
      document.body.style.overflow = 'hidden'
      await nextTick()
      const target = panel.value?.querySelector('[autofocus], input, select, textarea, button')
      target?.focus()
    } else {
      document.removeEventListener('keydown', onKeydown)
      document.body.style.overflow = ''
      opener?.focus?.()
    }
  },
)

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition enter-active-class="transition duration-150" enter-from-class="opacity-0" leave-active-class="transition duration-100" leave-to-class="opacity-0">
      <div v-if="open" class="fixed inset-0 z-[90] flex items-end justify-center bg-navy-950/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" @mousedown.self="close">
        <div
          ref="panel"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          :class="[
            'max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-pop sm:rounded-2xl',
            size === 'sm' ? 'sm:max-w-md' : size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-lg',
          ]"
        >
          <header class="flex items-start justify-between gap-4 border-b border-navy-100 px-5 py-4 sm:px-6">
            <div>
              <h2 :id="titleId" class="text-base font-bold text-navy-950">{{ title }}</h2>
              <p v-if="description" class="mt-1 text-sm leading-6 text-navy-500">{{ description }}</p>
            </div>
            <button v-if="dismissible" type="button" class="rounded-lg p-1.5 text-navy-400 hover:bg-navy-50 hover:text-navy-700" aria-label="إغلاق" @click="close">
              <X :size="18" aria-hidden="true" />
            </button>
          </header>
          <div class="px-5 py-5 sm:px-6">
            <slot />
          </div>
          <footer v-if="$slots.footer" class="flex flex-wrap-reverse justify-end gap-2 border-t border-navy-100 bg-navy-50/50 px-5 py-3.5 sm:px-6">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
