import { ref, onMounted, onBeforeUnmount } from 'vue'

/** True once the page has been scrolled past `threshold` pixels. */
export function useScrolled(threshold = 12) {
  const scrolled = ref(false)
  const update = () => (scrolled.value = window.scrollY > threshold)

  onMounted(() => {
    update()
    window.addEventListener('scroll', update, { passive: true })
  })
  onBeforeUnmount(() => window.removeEventListener('scroll', update))

  return scrolled
}
