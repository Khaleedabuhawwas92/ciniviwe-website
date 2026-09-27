import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'

/** Scroll-spy: returns the id of the section currently in the middle of the viewport. */
export function useActiveSection(ids) {
  const active = ref('')
  const route = useRoute()
  let observer

  const disconnect = () => observer?.disconnect()

  async function observe() {
    disconnect()
    active.value = ''
    await nextTick()
    if (!('IntersectionObserver' in window)) return
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) active.value = entry.target.id
        })
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
  }

  onMounted(observe)
  watch(() => route.path, observe)
  onBeforeUnmount(disconnect)

  return active
}
